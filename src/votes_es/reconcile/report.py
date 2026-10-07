"""G9 reconciliation runner — reads the gold DB, writes auditable artifacts.

Reads:
    data/gold/votes.duckdb  (built from silver; never re-parse bronze)

Writes:
    reports/proposal_matches.parquet   one row per MAPFRE instance
    reports/proposal-match-review.csv  review queue, lowest confidence first

Deterministic: no timestamps inside artifacts that would change ordering.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq

from votes_es.reconcile.matcher import (
    MATCHER_VERSION,
    SourceProposalCluster,
    SourceProposal,
    match_meeting,
)
from votes_es.reconcile.normalize import normalize_for_match


@dataclass
class RecStats:
    shared_meetings: int = 0
    mapfre_instances: int = 0
    matched: int = 0
    ambiguous: int = 0
    unmatched: int = 0
    by_method: dict = field(default_factory=dict)


def _sponsor(raw: str | None) -> str | None:
    t = (raw or "").strip().lower()
    if t == "shareholder":
        return "SHAREHOLDER"
    if t == "management":
        return "MANAGEMENT"
    return None


def run(gold_path: Path, out_dir: Path) -> RecStats:
    con = duckdb.connect(str(gold_path), read_only=True)

    shared = [r[0] for r in con.execute("""
        SELECT DISTINCT m.meeting_id FROM meetings m
        WHERE EXISTS (SELECT 1 FROM proposals p JOIN votes v USING (proposal_id)
                      WHERE p.meeting_id=m.meeting_id AND v.source_id='mapfre_am')
          AND EXISTS (SELECT 1 FROM proposals p JOIN votes v USING (proposal_id)
                      WHERE p.meeting_id=m.meeting_id AND v.source_id='sec_npx')
        ORDER BY 1""").fetchall()]

    match_rows: list[dict] = []
    review_rows: list[dict] = []
    stats = RecStats()

    for mid in shared:
        meta = con.execute("""
            SELECT i.canonical_name, m.meeting_date FROM meetings m
            JOIN issuers i USING (issuer_id) WHERE m.meeting_id=?""",
            [mid]).fetchone()
        if meta is None:
            continue
        issuer, mdate = meta[0], str(meta[1])

        # MAPFRE side: one instance per proposal_instances row of the source
        mrows = con.execute("""
            SELECT pi.proposal_id, pi.text_raw, p.proposal_number,
                   p.sponsor_type
            FROM proposal_instances pi JOIN proposals p USING (proposal_id)
            WHERE p.meeting_id=? AND pi.source_id='mapfre_am'
            ORDER BY pi.proposal_id""", [mid]).fetchall()
        import re as _re
        def _seq(item):
            m = _re.match(r"^(\d+)", (item or "").strip())
            return int(m.group(1)) if m else None
        mps = []
        for pid, text, num, sponsor in mrows:
            mps.append(SourceProposal(
                key=f"{mid}|mapfre:{pid}", raw=text or "",
                norm=normalize_for_match(text),
                item=num, proponent=_sponsor(sponsor),
                categories=frozenset(), seq=_seq(num)))

        # canonical side: silver proposals with ≥1 sec_npx instance; the
        # representative text is the most common N-PX variant
        crows = con.execute("""
            SELECT p.proposal_id, p.proposal_number, p.sponsor_type,
                   pi.text_raw, count(*) n
            FROM proposals p JOIN proposal_instances pi USING (proposal_id)
            WHERE p.meeting_id=? AND pi.source_id='sec_npx'
            GROUP BY ALL ORDER BY n DESC, pi.text_raw""", [mid]).fetchall()
        cp_map: dict[str, SourceProposalCluster] = {}
        for pid, num, sponsor, text, _n in crows:
            if pid in cp_map:
                cp_map[pid].raw_variants.append(text or "")
                cp_map[pid].norm_variants.append(normalize_for_match(text))
                continue
            cats = {c[0] for c in con.execute(
                "SELECT DISTINCT category FROM proposal_categories "
                "WHERE proposal_id=? AND taxonomy='SEC'", [pid]).fetchall()}
            cp_map[pid] = SourceProposalCluster(
                proposal_id=pid, raw_variants=[text or ""],
                norm_variants=[normalize_for_match(text)],
                norm_rep=normalize_for_match(text), ballot=num,
                proponent=_sponsor(sponsor), categories=frozenset(cats),
                seq=_seq(num))
        cps = list(cp_map.values())

        res = match_meeting(mps, cps)
        stats.shared_meetings += 1
        stats.mapfre_instances += len(mps)
        mp_by_key = {m.key: m for m in mps}
        cp_by_id = {c.proposal_id: c for c in cps}
        for mt in res.matches:
            mp = mp_by_key[mt.source_key]
            cp = cp_by_id.get(mt.proposal_id) if mt.proposal_id else None
            row = {
                "meeting_id": mid, "issuer": issuer, "meeting_date": mdate,
                "mapfre_key": mt.source_key, "mapfre_item": mp.item,
                "mapfre_text": mp.raw,
                "canonical_proposal_id": mt.proposal_id,
                "canonical_text": cp.raw_variants[0] if cp else None,
                "n_variants": len(cp.raw_variants) if cp else 0,
                "method": mt.method, "score": mt.score, "margin": mt.margin,
                "evidence": mt.evidence, "review_status": mt.review_status,
                "matcher_version": MATCHER_VERSION,
            }
            match_rows.append(row)
            stats.by_method[mt.method] = stats.by_method.get(mt.method, 0) + 1
            if mt.proposal_id:
                stats.matched += 1
            elif mt.method == "AMBIGUOUS":
                stats.ambiguous += 1
            else:
                stats.unmatched += 1
            if mt.review_status in ("AMBIGUOUS", "UNRESOLVED"):
                rivals = [q for q in cps if q.proposal_id == mt.best_rival]
                review_rows.append({**row,
                                    "rival_text": (rivals[0].raw_variants[0]
                                                   if rivals else None)})

    out_dir.mkdir(parents=True, exist_ok=True)
    pq.write_table(pa.Table.from_pylist(match_rows),
                   out_dir / "proposal_matches.parquet")
    review_rows.sort(key=lambda r: (r["score"], r["margin"]))
    import csv
    rev_path = out_dir / "proposal-match-review.csv"
    with rev_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(review_rows[0].keys())
                           if review_rows else ["empty"])
        w.writeheader()
        w.writerows(review_rows)
    con.close()
    return stats
