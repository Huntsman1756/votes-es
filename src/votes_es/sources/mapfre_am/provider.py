"""MAPFRE AM provider: document registry + PDF -> bronze conversion.

One publication document = one bronze batch. The document registry
(data/raw/mapfre_am/documents.json) pins every ingested file to
{year, url, retrieved_at, sha256, parser_version} — an observation is
deterministic per document so re-ingestion of the same file is idempotent.
"""
from __future__ import annotations

import hashlib
import json
import shutil
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

from votes_es import ids
from votes_es.config import RAW_DIR
from votes_es.domain.models import Observation
from votes_es.sources.mapfre_am.parser import (
    PARSER_VERSION,
    MapfreRow,
    ParseStats,
    semantic_consistency,
    parse_pdf,  # noqa: F401  (re-exported for callers)
)

SOURCE_ID = "mapfre_am"
REPORTER_KEY = "mapfre-am"

# Document catalog — the three publications covered by G8-C.
# (year, local filename, canonical document URL)
DOCUMENT_URLS = {
    2023: "https://www.mapfream.com/media/ES-informe-anual-implicacion-2023.pdf",
    2024: "https://www.mapfream.com/media/ES-informe-anual-implicacion-2024.pdf",
    2025: "https://www.mapfream.com/media/ES-actividades-implicacion-y-ejercicio-politica-voto-2025.pdf",
}


@dataclass
class DocumentEntry:
    source_id: str
    publication_year: int
    document_url: str
    retrieved_at: str
    sha256: str
    parser_version: str
    local_path: str


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def registry_path() -> Path:
    return RAW_DIR / "mapfre_am" / "documents.json"


def load_registry() -> list[dict]:
    p = registry_path()
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return []


def register_document(path: Path, year: int, url: str,
                      retrieved_at: datetime | None = None) -> DocumentEntry:
    """Pin a source PDF into data/raw/mapfre_am + the document registry.

    Idempotent on (year, sha256): re-registering the same bytes updates
    nothing but returns the existing entry.
    """
    sha = sha256_file(path)
    reg = load_registry()
    for e in reg:
        if e["publication_year"] == year and e["sha256"] == sha:
            return DocumentEntry(**e)
    raw_dir = RAW_DIR / "mapfre_am"
    raw_dir.mkdir(parents=True, exist_ok=True)
    dest = raw_dir / f"MAPFRE-AM-implicacion-{year}-{sha[:8]}.pdf"
    if path.resolve() != dest.resolve():
        shutil.copy2(path, dest)
    entry = DocumentEntry(
        source_id=SOURCE_ID, publication_year=year, document_url=url,
        retrieved_at=(retrieved_at or datetime.now(UTC)).isoformat(),
        sha256=sha, parser_version=PARSER_VERSION,
        local_path=str(dest),
    )
    reg = [e for e in reg if not (e["publication_year"] == year
                                  and e["sha256"] == sha)]
    reg.append(asdict(entry))
    registry_path().write_text(json.dumps(reg, indent=2), encoding="utf-8")
    return entry


def observation_for(entry: DocumentEntry) -> Observation:
    """One deterministic observation per document — all rows of that
    document trace to it; page/row_top inside bronze pin the exact cell."""
    oid = ids.observation_id(SOURCE_ID, str(entry.publication_year),
                           entry.sha256[:16], REPORTER_KEY)
    return Observation(
        observation_id=oid,
        source_id=SOURCE_ID,
        source_document=Path(entry.local_path).name,
        source_url=entry.document_url,
        retrieved_at=datetime.fromisoformat(entry.retrieved_at),
        raw_reference=f"year={entry.publication_year}",
        parser_version=PARSER_VERSION,
        content_hash=entry.sha256,
    )


def rows_to_bronze(rows: list[MapfreRow], entry: DocumentEntry,
                   stats: ParseStats) -> list[dict]:
    """Raw parse rows -> bronze dicts (raw cells verbatim + quarantine).

    A second quarantine pass applies semantic_consistency — parser flags
    structural anomalies, this flags impossible vote/rec/alignment triples.
    """
    obs = observation_for(entry)
    out = []
    for r in rows:
        reason = r.quarantine_reason
        if not reason:
            c = semantic_consistency(r)
            if c:
                reason = c
        out.append({
            "observation_id": obs.observation_id,
            "publication_year": entry.publication_year,
            "company_raw": r.company_raw,
            "security_raw": r.security_raw,
            "isin": r.isin,
            "ticker_raw": r.ticker_raw,
            "meeting_date_raw": r.meeting_date_raw,
            "meeting_type_raw": r.meeting_type_raw,
            "agenda_number": r.agenda_number,
            "record_date_raw": r.record_date_raw,
            "vote_deadline_raw": r.vote_deadline_raw,
            "city_country_raw": r.city_country_raw,
            "item_raw": r.item_raw,
            "parent_item_raw": r.parent_item_raw,
            "proposal_text_raw": r.proposal_text_raw,
            "proposed_by_raw": r.proposed_by_raw,
            "vote_raw": r.vote_raw,
            "management_recommendation_raw": r.management_recommendation_raw,
            "for_against_raw": r.for_against_raw,
            "page": r.page,
            "row_top": r.row_top,
            "page_end": r.page_end,
            "quarantined": bool(reason),
            "quarantine_reason": reason or None,
        })
    return out
