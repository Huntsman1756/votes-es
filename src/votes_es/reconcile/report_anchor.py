"""G9-R runner — anchors source wordings to official agenda items.

Both MAPFRE register lines and N-PX voteDescriptions are mapped against the
*issuer's official AGM agenda* (data/reference/official_agendas/), never
directly against each other.

Writes:
    reports/official_anchor_mapfre.parquet
    reports/official_anchor_npx.parquet
    reports/official-anchor-review.csv   review queue, lowest confidence first

Deterministic: no timestamps inside artifacts that would change ordering.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import csv
import duckdb
import pyarrow as pa
import pyarrow.parquet as pq

from votes_es.reconcile.anchor import (
    ANCHOR_VERSION, AgendaItem, SourceRow, anchor_meeting, load_agendas)
from votes_es.reconcile.normalize import normalize_for_match


@dataclass
class AnchorStats:
    meetings: int = 0
    meetings_with_agenda: int = 0
    agenda_items: int = 0
    mapfre_rows: int = 0
    mapfre_auto: int = 0
    mapfre_ambiguous: int = 0
    mapfre_unmatched: int = 0
    npx_wordings: int = 0
    npx_auto: int = 0
    npx_ambiguous: int = 0
    npx_unmatched: int = 0
    by_method: dict = field(default_factory=dict)


def _sponsor(raw: str | None) -> str | None:
    t = (raw or "").strip().lower()
    return {"shareholder": "SHAREHOLDER",
            "management": "MANAGEMENT"}.get(t)


def _isin_of(con: duckdb.DuckDBPyConnection, issuer_id: str,
             mdate: str) -> str | None:
    rows = con.execute("""
        SELECT isin FROM instruments WHERE issuer_id=?
          AND (valid_from IS NULL OR valid_from <= ?)
          AND (valid_to IS NULL OR valid_to = '' OR valid_to >= ?)
        ORDER BY isin""", [issuer_id, mdate, mdate]).fetchall()
    return rows[0][0] if rows else None


def run(gold_path: Path, out_dir: Path,
        agenda_dir: Path | None = None) -> AnchorStats:
    agendas = load_agendas(agenda_dir) if agenda_dir else load_agendas()
    con = duckdb.connect(str(gold_path), read_only=True)

    shared = con.execute("""
        SELECT DISTINCT m.meeting_id FROM meetings m
        WHERE EXISTS (SELECT 1 FROM proposals p JOIN votes v USING (proposal_id)
                      WHERE p.meeting_id=m.meeting_id AND v.source_id='mapfre_am')
          AND EXISTS (SELECT 1 FROM proposals p JOIN votes v USING (proposal_id)
                      WHERE p.meeting_id=m.meeting_id AND v.source_id='sec_npx')
        ORDER BY 1""").fetchall()

    stats = AnchorStats()
    mapfre_rows: list[dict] = []
    npx_rows: list[dict] = []
    review_rows: list[dict] = []

    for (mid,) in shared:
        meta = con.execute("""
            SELECT i.issuer_id, i.canonical_name, m.meeting_date
            FROM meetings m JOIN issuers i USING (issuer_id)
            WHERE m.meeting_id=?""", [mid]).fetchone()
        if meta is None:
            continue
        issuer_id, issuer, mdate = meta[0], meta[1], str(meta[2])
        isin = _isin_of(con, issuer_id, mdate)
        agenda = agendas.get((isin, mdate)) if isin else None

        stats.meetings += 1
        if not agenda:
            continue
        stats.meetings_with_agenda += 1
        stats.agenda_items += len(agenda)

        # MAPFRE register lines: itemized, one row per proposal_instances
        mrows = con.execute("""
            SELECT pi.proposal_id, pi.text_raw, p.proposal_number,
                   p.sponsor_type
            FROM proposal_instances pi JOIN proposals p USING (proposal_id)
            WHERE p.meeting_id=? AND pi.source_id='mapfre_am'
            ORDER BY pi.proposal_id""", [mid]).fetchall()
        msrc = [SourceRow(key=f"{mid}|mapfre:{pid}", raw=text or "",
                          item=num, proponent=_sponsor(sponsor))
                for pid, text, num, sponsor in mrows]
        res_m = anchor_meeting(msrc, agenda, one_to_one=True)
        src_by_key = {s.key: s for s in msrc}
        for mt in res_m:
            s = src_by_key[mt.source_key]
            mapfre_rows.append({
                "meeting_id": mid, "isin": isin, "issuer": issuer,
                "meeting_date": mdate, "source_key": mt.source_key,
                "source_item": s.item, "source_text": s.raw,
                "official_item": mt.proposal_id,
                "official_title": _title(agenda, mt.proposal_id),
                "method": mt.method, "score": mt.score, "margin": mt.margin,
                "best_rival": mt.best_rival, "evidence": mt.evidence,
                "review_status": mt.review_status,
                "matcher_version": ANCHOR_VERSION})
            stats.mapfre_rows += 1
            stats.by_method[mt.method] = stats.by_method.get(mt.method, 0) + 1
            if mt.proposal_id:
                stats.mapfre_auto += 1
            elif mt.method == "AMBIGUOUS":
                stats.mapfre_ambiguous += 1
            else:
                stats.mapfre_unmatched += 1
            if mt.review_status in ("AMBIGUOUS", "UNRESOLVED"):
                review_rows.append({**mapfre_rows[-1], "source": "mapfre"})

        # N-PX: distinct wordings per meeting — observations, not proposals
        nrows = con.execute("""
            SELECT pi.text_raw, p.proposal_number, count(*) n
            FROM proposal_instances pi JOIN proposals p USING (proposal_id)
            WHERE p.meeting_id=? AND pi.source_id='sec_npx'
            GROUP BY ALL ORDER BY n DESC, pi.text_raw""", [mid]).fetchall()
        # collapse identical normalized wordings, keep the densest rep
        seen: dict[str, dict] = {}
        for text, num, n in nrows:
            key = normalize_for_match(text)
            if not key:
                continue
            if key not in seen or n > seen[key]["n"]:
                seen[key] = {"raw": text or "", "item": num, "n": n}
        nsrc = [SourceRow(key=f"{mid}|npx:{normalize_for_match(v['raw'])[:60]}",
                          raw=v["raw"], item=v["item"], proponent=None)
                for v in seen.values()]
        res_n = anchor_meeting(nsrc, agenda, one_to_one=False)
        src_by_key = {s.key: s for s in nsrc}
        for mt in res_n:
            s = src_by_key[mt.source_key]
            npx_rows.append({
                "meeting_id": mid, "isin": isin, "issuer": issuer,
                "meeting_date": mdate, "source_key": mt.source_key,
                "source_item": s.item, "source_text": s.raw,
                "official_item": mt.proposal_id,
                "official_title": _title(agenda, mt.proposal_id),
                "method": mt.method, "score": mt.score, "margin": mt.margin,
                "best_rival": mt.best_rival, "evidence": mt.evidence,
                "review_status": mt.review_status,
                "matcher_version": ANCHOR_VERSION})
            stats.npx_wordings += 1
            stats.by_method[mt.method] = stats.by_method.get(mt.method, 0) + 1
            if mt.proposal_id:
                stats.npx_auto += 1
            elif mt.method == "AMBIGUOUS":
                stats.npx_ambiguous += 1
            else:
                stats.npx_unmatched += 1
            if mt.review_status in ("AMBIGUOUS", "UNRESOLVED"):
                review_rows.append({**npx_rows[-1], "source": "sec_npx"})

    out_dir.mkdir(parents=True, exist_ok=True)
    pq.write_table(pa.Table.from_pylist(mapfre_rows),
                   out_dir / "official_anchor_mapfre.parquet")
    pq.write_table(pa.Table.from_pylist(npx_rows),
                   out_dir / "official_anchor_npx.parquet")
    review_rows.sort(key=lambda r: (r["score"], r["margin"]))
    rev_path = out_dir / "official-anchor-review.csv"
    with rev_path.open("w", encoding="utf-8", newline="") as f:
        cols = (list(review_rows[0].keys()) if review_rows else
                ["meeting_id", "source_key", "method"])
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(review_rows)
    con.close()
    return stats


def _title(agenda: list[AgendaItem], item: str | None) -> str | None:
    for a in agenda:
        if a.item_number == item:
            return a.title_es or a.title_en
    return None
