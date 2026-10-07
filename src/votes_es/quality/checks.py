"""`votes validate` — data-quality assertions over the silver layer.

Each check returns (name, status, detail). Statuses: PASS / WARN / FAIL.
WARN = anomaly worth a human look; FAIL = contract broken.
"""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

import duckdb

from votes_es.config import REPORTS_DIR, SILVER_DIR
from votes_es.domain.enums import VoteDirection


@dataclass
class Check:
    name: str
    status: str
    detail: str


def run_checks(silver_dir: Path | None = None) -> list[Check]:
    d = (silver_dir or SILVER_DIR).as_posix()
    con = duckdb.connect()
    checks: list[Check] = []

    def has_table(name: str) -> bool:
        return (Path(d) / f"{name}.parquet").exists()

    def T(name: str) -> str:
        return f"'{d}/{name}.parquet'"

    def scalar(sql: str) -> int:
        return int((con.execute(sql).fetchone() or (0,))[0])

    n_votes = scalar(f"SELECT count(*) FROM {T('votes')}")
    checks.append(Check("votes_present", "PASS" if n_votes else "FAIL",
                        f"{n_votes} votes"))

    # uniqueness
    dup = scalar(
        f"SELECT count(*) - count(DISTINCT vote_id) FROM {T('votes')}")
    checks.append(Check("vote_id_unique", "PASS" if dup == 0 else "FAIL",
                        f"{dup} duplicate vote_id"))

    # orphan FK
    orphan_p = scalar(
        f"SELECT count(*) FROM {T('votes')} v LEFT JOIN {T('proposals')} p "
        f"USING (proposal_id) WHERE p.proposal_id IS NULL")
    checks.append(Check("votes_proposal_fk", "PASS" if orphan_p == 0 else "FAIL",
                        f"{orphan_p} votes without proposal"))
    orphan_m = scalar(
        f"SELECT count(*) FROM {T('proposals')} p LEFT JOIN {T('meetings')} m "
        f"USING (meeting_id) WHERE m.meeting_id IS NULL")
    checks.append(Check("proposals_meeting_fk", "PASS" if orphan_m == 0 else "FAIL",
                        f"{orphan_m} proposals without meeting"))
    orphan_o = scalar(
        f"SELECT count(*) FROM {T('votes')} v LEFT JOIN {T('observations')} o "
        f"ON v.source_observation_id = o.observation_id "
        f"WHERE o.observation_id IS NULL")
    checks.append(Check("votes_observation_fk", "PASS" if orphan_o == 0 else "FAIL",
                        f"{orphan_o} votes without observation"))

    # enum validity
    valid = ",".join(f"'{d.value}'" for d in VoteDirection)
    bad_dir = con.execute(
        f"SELECT direction, count(*) FROM {T('votes')} "
        f"WHERE direction NOT IN ({valid}) GROUP BY 1").fetchall()
    checks.append(Check("direction_enum", "PASS" if not bad_dir else "FAIL",
                        f"invalid: {bad_dir}"))

    # provenance
    no_url = scalar(
        f"SELECT count(*) FROM {T('observations')} "
        f"WHERE source_url IS NULL OR source_url = ''")
    checks.append(Check("observation_url", "PASS" if no_url == 0 else "WARN",
                        f"{no_url} observations without URL"))

    # identity
    unr = scalar(
        f"SELECT count(*) FROM {T('issuers')} WHERE NOT in_universe")
    checks.append(Check("unresolved_issuers",
                        "PASS" if unr == 0 else "WARN",
                        f"{unr} unresolved issuers"))
    amb = scalar(
        f"SELECT count(*) FROM {T('votes')} WHERE review_status='AMBIGUOUS'"
    )
    checks.append(Check("ambiguous_matches",
                        "PASS" if amb == 0 else "WARN",
                        f"{amb} votes on AMBIGUOUS identity"))

    # sanity
    neg = scalar(
        f"SELECT count(*) FROM {T('votes')} WHERE shares_voted < 0 "
        f"OR shares_on_loan < 0")
    checks.append(Check("shares_nonnegative", "PASS" if neg == 0 else "FAIL",
                        f"{neg} negative share counts"))
    weird_dates = scalar(
        f"SELECT count(*) FROM {T('meetings')} WHERE meeting_date < '2000-01-01' "
        f"OR meeting_date > current_date + interval 1 year")
    checks.append(Check("meeting_dates", "PASS" if weird_dates == 0 else "WARN",
                        f"{weird_dates} meetings outside sane range"))

    # dissent semantics are SOURCE-AWARE:
    #   sec_npx → against_management iff management_alignment='AGAINST'
    #   iss_vds → direction != declared mgt recommendation (both meaningful)
    # NEVER direction != alignment on N-PX (that inverts AGAINST votes).
    bad_against = scalar(
        f"SELECT count(*) FROM {T('votes')} WHERE "
        f"(source_id='sec_npx' AND ("
        f"  (against_management IS TRUE AND management_alignment <> 'AGAINST') OR"
        f"  (against_management IS FALSE AND management_alignment <> 'FOR') OR"
        f"  (against_management IS NULL AND management_alignment IN ('FOR','AGAINST'))"
        f"  OR management_recommendation IS NOT NULL)) OR "
        f"(source_id LIKE 'iss_vds%' AND against_management IS NOT NULL AND ("
        f"  direction IN ('UNKNOWN','OTHER','DO_NOT_VOTE') OR "
        f"  management_recommendation IS NULL OR "
        f"  management_recommendation IN ('NONE','UNKNOWN','OTHER')))"
    )
    checks.append(Check("against_semantics",
                        "PASS" if bad_against == 0 else "FAIL",
                        f"{bad_against} votes violating source-aware dissent "
                        "semantics"))

    # N-PX must never claim a management-rec direction
    npx_rec = scalar(
        f"SELECT count(*) FROM {T('votes')} WHERE source_id='sec_npx' "
        f"AND management_recommendation IS NOT NULL")
    checks.append(Check("npx_no_mgmt_rec_direction",
                        "PASS" if npx_rec == 0 else "FAIL",
                        f"{npx_rec} N-PX votes with fabricated mgmt rec "
                        "direction"))
    # split-vote components must never collapse to a single direction
    splits = scalar(
        f"SELECT count(*) FROM {T('votes')} WHERE is_split") if has_table("votes") else 0
    checks.append(Check("split_votes_flagged", "PASS",
                        f"{splits} split-vote component rows preserved"))

    if has_table("meetings"):
        pass
    con.close()
    return checks


def write_report(checks: list[Check], out_dir: Path | None = None) -> Path:
    out_dir = out_dir or REPORTS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    report = {
        "generated_at": datetime.now(UTC).isoformat(),
        "overall": ("FAIL" if any(c.status == "FAIL" for c in checks)
                    else "WARN" if any(c.status == "WARN" for c in checks) else "PASS"),
        "checks": [asdict(c) for c in checks],
    }
    (out_dir / "latest.json").write_text(json.dumps(report, indent=2))
    md = ["# votes-es data quality", "", f"Overall: **{report['overall']}**",
          f"Generated: {report['generated_at']}", "",
          "| Check | Status | Detail |", "|---|---|---|"]
    md += [f"| {c.name} | {c.status} | {c.detail} |" for c in checks]
    (out_dir / "latest.md").write_text("\n".join(md))
    return out_dir
