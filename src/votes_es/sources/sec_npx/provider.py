"""NpxProvider — the SEC N-PX source adapter.

One N-PX filing → bronze rows: filing meta (primary_doc) + one row per
(proxyTable × voteRecord). Every row carries its Observation envelope
(accession, document, URL, retrieval time, content hash, parser version).

Filings map: reporter = reporting person (registrant); reporting unit =
voteSeries when present else reporter-self. report_type preserves the
FUND / INSTITUTIONAL_MANAGER distinction — coverage math must never mix them.
"""
from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from pathlib import Path

from votes_es import ADAPTER_VERSION, ids
from votes_es.domain.enums import ReportType
from votes_es.domain.models import NpxFilingMeta, Observation
from votes_es.sources.sec_npx import filing as filing_mod
from votes_es.sources.sec_npx.parser import parse_file

SOURCE_ID = "sec_npx"


def report_type_of(meta: NpxFilingMeta) -> ReportType:
    rt = (meta.report_type or "").upper()
    return (ReportType.INSTITUTIONAL_MANAGER
            if rt.startswith("INSTITUTIONAL") else ReportType.FUND)


def load_filing_dir(filing_dir: Path) -> tuple[NpxFilingMeta, Path]:
    """Locate primary_doc + vote table inside a downloaded filing dir.

    Fallback: a `manifest.json` may carry reporter metadata when the
    primary_doc was not retained (bulk-download retention policy)."""
    xmls = sorted(filing_dir.glob("*.xml"))
    primary = next((p for p in xmls if "primary_doc" in p.name.lower()), None)
    votes = [p for p in xmls if p != primary]
    if not votes:
        # single XML + manifest = the vote table itself
        if primary is not None:
            return _meta_from(primary, filing_dir), primary
        manifest = filing_dir / "manifest.json"
        if manifest.exists() and xmls:
            return _meta_from_manifest(manifest), xmls[0]
        raise FileNotFoundError(f"no vote-table XML in {filing_dir}")
    vote_doc = next(
        (p for p in votes if any(k in p.name.lower()
                                 for k in ("proxy", "vote", "table", "npx"))),
        votes[0],
    )
    if primary is None:
        manifest = filing_dir / "manifest.json"
        if manifest.exists():
            return _meta_from_manifest(manifest), vote_doc
        raise FileNotFoundError(f"no primary_doc.xml in {filing_dir}")
    return _meta_from(primary, filing_dir), vote_doc


def _meta_from_manifest(manifest: Path) -> NpxFilingMeta:
    import json
    from datetime import date as _d
    m = json.loads(manifest.read_text(encoding="utf-8"))
    por = m.get("period_of_report")
    return NpxFilingMeta(
        accession=m.get("accession", ""), cik=str(m.get("cik", "")),
        submission_type=m.get("submission_type", "N-PX"),
        report_type=m.get("report_type"),
        reporting_person=m.get("reporting_person"),
        reporting_person_lei=m.get("lei"),
        period_of_report=_d.fromisoformat(por) if por else None,
        amendment_no=m.get("amendment_no"),
        amendment_type=m.get("amendment_type"),
    )


def _meta_from(primary: Path, filing_dir: Path) -> NpxFilingMeta:
    acc, cik = "", ""
    # accession may be recoverable from a sibling manifest written at download
    manifest = filing_dir / "manifest.json"
    if manifest.exists():
        import json
        m = json.loads(manifest.read_text(encoding="utf-8"))
        acc, cik = m.get("accession", ""), str(m.get("cik", ""))
    return filing_mod.parse_primary_doc(primary, accession=acc, cik=cik)


def filing_row(meta: NpxFilingMeta, retrieved_at: datetime | None = None) -> dict:
    """Filing-level bronze record — amendment semantics live here."""
    return {
        "accession": meta.accession,
        "cik": meta.cik,
        "submission_type": meta.submission_type,
        "report_type": meta.report_type,
        "reporting_person": meta.reporting_person,
        "reporting_person_lei": meta.reporting_person_lei,
        "period_of_report": meta.period_of_report.isoformat()
        if meta.period_of_report else None,
        "amendment_no": meta.amendment_no,
        "amendment_type": meta.amendment_type,
        "other_managers_json": __import__("json").dumps(
            meta.other_included_managers),
        "series_json": __import__("json").dumps(meta.series_names),
        "retrieved_at": (retrieved_at or datetime.now(UTC)).isoformat(),
    }


def bronze_rows(meta: NpxFilingMeta, vote_doc: Path,
                retrieved_at: datetime | None = None,
                source_url: str = "") -> tuple[list[dict], Observation]:
    """Parse a vote table into flat bronze dicts — one per voteRecord."""
    retrieved_at = retrieved_at or datetime.now(UTC)
    content_hash = hashlib.sha256(vote_doc.read_bytes()).hexdigest()
    obs = Observation(
        observation_id=ids.observation_id(SOURCE_ID, meta.accession or vote_doc.stem,
                                        vote_doc.name),
        source_id=SOURCE_ID,
        accession=meta.accession or None,
        source_document=vote_doc.name,
        source_url=source_url,
        retrieved_at=retrieved_at,
        raw_reference=vote_doc.name,
        parser_version=ADAPTER_VERSION,
        content_hash=content_hash,
    )
    rows: list[dict] = []
    for i, t in enumerate(parse_file(vote_doc)):
        vr_list = t.vote_records or [
            # degenerate table-level vote (no voteRecord children observed)
            __import__("votes_es.domain.models", fromlist=["NpxVoteRecord"]).NpxVoteRecord(
                how_voted_raw="", shares_voted_raw=None, management_recommendation_raw=None)
        ]
        for vr in vr_list:
            rows.append({
                "observation_id": obs.observation_id,
                "accession": meta.accession,
                "cik": meta.cik,
                "reporter_name_raw": meta.reporting_person or "",
                "reporter_lei": meta.reporting_person_lei,
                "report_type": report_type_of(meta).value,
                "period_of_report": meta.period_of_report.isoformat()
                if meta.period_of_report else None,
                "issuer_name_raw": t.issuer_name_raw,
                "cusip": t.cusip,
                "isin": t.isin,
                "figi": t.figi,
                "meeting_date_raw": t.meeting_date_raw,
                "proposal_text_raw": t.vote_description_raw,
                "vote_source": t.vote_source,
                "categories_raw": "|".join(t.categories),
                "other_managers": "|".join(t.other_managers),
                "vote_series": t.vote_series,
                "how_voted_raw": vr.how_voted_raw,
                "shares_voted_raw": vr.shares_voted_raw or t.shares_voted_raw,
                "shares_on_loan_raw": t.shares_on_loan_raw,
                "management_recommendation_raw": vr.management_recommendation_raw,
                "row_index": i,
            })
    return rows, obs
