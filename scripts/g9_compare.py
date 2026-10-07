"""G9 local comparison: MAPFRE vs big N-PX reporters on matched proposals.

Local-only analytics — publication stays gated (mapfre_am is
PERMISSION_REQUIRED). Writes docs/findings/G9-COMPARISON.md.
"""
from __future__ import annotations

from pathlib import Path

import duckdb

GOLD = Path("data/gold/votes.duckdb")
MATCHES = Path("reports/proposal_matches.parquet")
OUT = Path("docs/findings/G9-COMPARISON.md")


def main() -> None:
    con = duckdb.connect(str(GOLD), read_only=True)
    n_pairs = con.execute(f"""
        SELECT count(*) FROM '{MATCHES.as_posix()}'
        WHERE canonical_proposal_id IS NOT NULL""").fetchone()[0]
    if not n_pairs:
        print("no matched pairs — run `votes reconcile proposals` first")
        return

    md = ["# G9 — local cross-source comparison (not published)\n",
          "Scope: canonical proposals where MAPFRE and N-PX reporters both\n",
          "observed the same meeting item. MAPFRE rows are gate-suppressed\n",
          "publicly; this is a local-only artifact.\n"]

    per_reporter = con.execute(f"""
        WITH m AS (
          SELECT DISTINCT mp.meeting_id, mp.canonical_proposal_id pid
          FROM '{MATCHES.as_posix()}' mp
          WHERE mp.canonical_proposal_id IS NOT NULL)
        SELECT COALESCE(r.parent_group, r.canonical_name) grp,
               count(DISTINCT (m.pid, v.reporting_unit_id)) n,
               count(DISTINCT CASE WHEN v.direction = mv.direction
                    THEN (m.pid, v.reporting_unit_id) END) same,
               count(DISTINCT CASE WHEN v.direction <> mv.direction
                    THEN (m.pid, v.reporting_unit_id) END) diff,
               count(DISTINCT CASE WHEN v.against_management IS TRUE
                    THEN (m.pid, v.reporting_unit_id) END) vs_mgmt,
               count(DISTINCT CASE WHEN mv.against_management IS TRUE
                    THEN m.pid END) mapfre_vs_mgmt
        FROM votes mv
        JOIN m ON mv.proposal_id = m.pid
        JOIN votes v ON v.proposal_id = m.pid AND v.source_id='sec_npx'
        JOIN reporters r ON v.reporter_id = r.reporter_id
        WHERE mv.source_id='mapfre_am'
          AND v.direction IN ('FOR','AGAINST','ABSTAIN','WITHHOLD')
          AND mv.direction IN ('FOR','AGAINST','ABSTAIN','WITHHOLD')
        GROUP BY ALL ORDER BY n DESC LIMIT 15""").fetchall()

    md.append("## MAPFRE vs N-PX reporter groups — same canonical proposal\n")
    md.append("| group | n | same | diff | group vs-mgmt | mapfre vs-mgmt |")
    md.append("|---|---|---|---|---|---|")
    for grp, n, same, diff, vsm, mvm in per_reporter:
        md.append(f"| {grp} | {n} | {same} | {diff} "
                  f"| {vsm} | {mvm} |")

    grp_rows = [r for r in per_reporter
                if (r[0] or "") in ("BlackRock", "Vanguard")]
    md.append("\n## Headline\n")
    for grp, n, same, diff, _vsm, _mvm in grp_rows:
        md.append(f"- **{grp}**: {n} shared proposal×unit pairs — "
                  f"agree {same}, diverge {diff} "
                  f"({same/n*100:.0f}% agreement)")
    md.append("\nCaveat: agreement is computed on matched proposals only; "
              "the 210 unmatched/ambiguous MAPFRE items are excluded by "
              "design (precision-first).")
    OUT.write_text("\n".join(md), encoding="utf-8")
    for r in per_reporter[:8]:
        print(r)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
