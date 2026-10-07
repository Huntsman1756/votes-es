"""G9-R local comparison on OFFICIAL agenda items — MAPFRE vs N-PX reporters.

Both sides anchored to official_agenda_items; comparison only where
issuer+meeting+official_item+reporting unit align. Local-only; MAPFRE stays
gate-suppressed. Writes docs/findings/G9R-COMPARISON.md.
"""
from __future__ import annotations

from pathlib import Path

import duckdb


GOLD = Path("data/gold/votes.duckdb")
MP = Path("reports/official_anchor_mapfre.parquet")
NPX = Path("reports/official_anchor_npx.parquet")
OUT = Path("docs/findings/G9R-COMPARISON.md")


def main() -> None:
    con = duckdb.connect(str(GOLD), read_only=True)

    # MAPFRE proposal_id -> (meeting_id, official_item)
    con.execute(rf"""
        CREATE TEMP TABLE mp_anchor AS
        SELECT a.meeting_id, a.official_item, a.source_key,
               regexp_replace(a.source_key, '.*\|mapfre:', '') pid
        FROM '{MP.as_posix()}' a
        WHERE a.official_item IS NOT NULL""")
    # N-PX normalized wording -> (meeting_id, official_item)
    con.execute(f"""
        CREATE TEMP TABLE npx_anchor AS
        SELECT meeting_id, official_item, source_text
        FROM '{NPX.as_posix()}'
        WHERE official_item IS NOT NULL""")

    # N-PX votes: join instance text -> anchored official item
    con.execute("""
        CREATE TEMP TABLE npx_votes AS
        SELECT v.vote_id, pi.proposal_id, v.reporting_unit_id, v.reporter_id,
               v.direction, v.against_management, m.issuer_id,
               m.meeting_id, a.official_item
        FROM votes v
        JOIN proposal_instances pi ON pi.proposal_id = v.proposal_id
                                  AND pi.source_id = v.source_id
        JOIN proposals p ON p.proposal_id = v.proposal_id
        JOIN meetings m ON m.meeting_id = p.meeting_id
        JOIN npx_anchor a ON a.meeting_id = m.meeting_id
        WHERE v.source_id = 'sec_npx'""")
    con.execute("""
        DELETE FROM npx_votes nv WHERE NOT EXISTS (
          SELECT 1 FROM npx_anchor a
          JOIN proposal_instances pi ON pi.proposal_id = nv.proposal_id
                                    AND pi.source_id = 'sec_npx'
          WHERE a.meeting_id = nv.meeting_id
            AND a.source_text = pi.text_raw
            AND a.official_item = nv.official_item)""")
    # collapse to one row per (meeting, official_item, reporting_unit)
    con.execute("""
        CREATE TEMP TABLE npx_u AS
        SELECT DISTINCT meeting_id, official_item, reporting_unit_id,
               reporter_id, direction, against_management
        FROM npx_votes
        WHERE direction IN ('FOR','AGAINST','ABSTAIN','WITHHOLD')""")

    # MAPFRE votes deduplicated to one direction per (meeting, official_item)
    con.execute("""
        CREATE TEMP TABLE mp_u AS
        SELECT DISTINCT p.meeting_id, ma.official_item, mv.direction,
               mv.against_management
        FROM votes mv
        JOIN proposals p ON p.proposal_id = mv.proposal_id
        JOIN mp_anchor ma ON ma.pid = mv.proposal_id
        WHERE mv.source_id = 'mapfre_am'
          AND mv.direction IN ('FOR','AGAINST','ABSTAIN','WITHHOLD')""")

    per_reporter = con.execute("""
        SELECT COALESCE(r.parent_group, r.canonical_name) grp,
               count(*) n,
               count(*) FILTER (nv.direction = mu.direction) same,
               count(*) FILTER (nv.direction <> mu.direction) diff,
               count(*) FILTER (nv.against_management IS TRUE) vs_mgmt,
               count(*) FILTER (mu.against_management IS TRUE) mapfre_vs_mgmt
        FROM mp_u mu
        JOIN npx_u nv ON nv.meeting_id = mu.meeting_id
                     AND nv.official_item = mu.official_item
        JOIN reporters r ON r.reporter_id = nv.reporter_id
        GROUP BY ALL ORDER BY n DESC LIMIT 15""").fetchall()

    # known regression: Inditex 2025 remuneration (official item 8)
    itx = con.execute("""
        SELECT mu.direction mapfre, nv.direction npx,
               COALESCE(r.parent_group, r.canonical_name) grp
        FROM mp_u mu
        JOIN meetings m ON m.meeting_id = mu.meeting_id
        JOIN npx_u nv ON nv.meeting_id = m.meeting_id
                     AND nv.official_item = mu.official_item
        JOIN reporters r ON r.reporter_id = nv.reporter_id
        WHERE mu.official_item='8' AND m.meeting_date='2025-07-15'
        ORDER BY grp""").fetchall()

    md = ["# G9-R — cross-source comparison on official agenda items\n",
          "Both reporters anchored to official agenda items (sidecar).\n",
          "Local-only; MAPFRE remains PERMISSION_REQUIRED.\n",
          "## MAPFRE vs N-PX reporter groups — same official item\n",
          "| group | n | same | diff | group vs-mgmt | mapfre vs-mgmt |",
          "|---|---|---|---|---|---|"]
    for grp, n, same, diff, vsm, mvm in per_reporter:
        md.append(f"| {grp} | {n} | {same} | {diff} | {vsm} | {mvm} |")
    md.append("\n## Inditex 2025 item 8 (remuneration report) regression\n")
    for m, n, g in itx:
        md.append(f"- {g}: MAPFRE={m} vs {g}={n}")
    OUT.write_text("\n".join(md), encoding="utf-8")
    for r in per_reporter[:10]:
        print(r)
    print("Inditex item8:", itx)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
