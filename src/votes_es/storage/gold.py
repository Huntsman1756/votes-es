"""Gold layer: silver Parquet → a serving DuckDB database.

The DuckDB file is a *derived* artifact — fully rebuildable from silver
parquets. It is never the only place data lives.
"""
from __future__ import annotations

from pathlib import Path

import duckdb

from votes_es.config import DUCKDB_PATH, PUBLISH_VOTE_SOURCES, SILVER_DIR
from votes_es.storage.schemas import SILVER_SCHEMAS

VIEWS = """
CREATE OR REPLACE VIEW v_votes AS
SELECT v.*, p.meeting_id, p.proposal_title_normalized, p.proposal_number,
       p.sponsor_type, m.meeting_date, m.meeting_type, m.issuer_id,
       i.canonical_name AS issuer_name, i.lei AS issuer_lei,
       r.canonical_name AS reporter_name, r.parent_group AS reporter_parent,
       u.canonical_name AS unit_name
FROM votes v
JOIN proposals p USING (proposal_id)
JOIN meetings m USING (meeting_id)
JOIN issuers i ON m.issuer_id = i.issuer_id
JOIN reporters r USING (reporter_id)
JOIN reporting_units u ON v.reporting_unit_id = u.unit_id;

CREATE OR REPLACE VIEW v_meeting_pivot AS
SELECT m.meeting_id, i.canonical_name AS issuer, m.meeting_date, m.meeting_type,
       p.proposal_id, p.proposal_number, p.proposal_title_normalized,
       r.parent_group AS reporter,
       MIN(v.management_recommendation) AS mgmt_rec,
       MIN(v.direction) AS direction,
       BOOL_OR(v.against_management) AS against_management,
       COUNT(*) AS unit_votes
FROM votes v
JOIN proposals p USING (proposal_id)
JOIN meetings m USING (meeting_id)
JOIN issuers i ON m.issuer_id = i.issuer_id
JOIN reporters r USING (reporter_id)
GROUP BY ALL;
"""


def build_gold(silver_dir: Path | None = None,
               out_path: Path | None = None) -> Path:
    silver = silver_dir or SILVER_DIR
    out = out_path or DUCKDB_PATH
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        out.unlink()
    con = duckdb.connect(str(out))
    for name in SILVER_SCHEMAS:
        p = silver / f"{name}.parquet"
        # reuse gate: VDS (or any restricted source) vote rows never reach the
        # served dataset unless explicitly enabled — metadata stays.
        where = ""
        if name == "votes" and PUBLISH_VOTE_SOURCES:
            allowed = ", ".join(f"'{s}'" for s in PUBLISH_VOTE_SOURCES)
            where = f" WHERE source_id IN ({allowed})"
        if p.exists():
            sp = str(p).replace("\\", "/")
            con.execute(f"CREATE TABLE {name} AS SELECT * FROM '{sp}'{where}")
        else:
            con.execute(
                f"CREATE TABLE {name} AS SELECT * FROM "
                f"'{str(silver / (name + '.parquet')).replace(chr(92), '/')}' LIMIT 0")
    # canonical layer (G10) — derived artifacts if a canonical build exists
    cdir = Path("data/canonical")
    for name in ("official_agenda_items", "canonical_proposals",
                 "proposal_anchor_links"):
        p = cdir / f"{name}.parquet"
        if p.exists():
            sp = str(p).replace("\\", "/")
            con.execute(f"CREATE OR REPLACE TABLE {name} "
                        f"AS SELECT * FROM '{sp}'")
    con.execute(VIEWS)
    con.execute("""CREATE OR REPLACE VIEW v_canonical_votes AS
SELECT v.*, p.meeting_id, l.canonical_proposal_id, l.agenda_item_id,
       l.relation_type, cp.canonical_number, cp.canonical_title,
       cp.identity_basis, cp.votable_status AS canonical_votable_status
FROM votes v
JOIN proposals p ON p.proposal_id = v.proposal_id
JOIN proposal_anchor_links l ON l.legacy_proposal_id = v.proposal_id
    AND (l.vote_id IS NULL OR l.vote_id = v.vote_id)
LEFT JOIN canonical_proposals cp
       ON cp.canonical_proposal_id = l.canonical_proposal_id
WHERE l.relation_type IN ('SAME','SUBITEM_OF')
  -- information-only official items are not votable: N-PX platforms may
  -- record a disposition, but absent official evidence that the point
  -- was actually put to a vote it is excluded from comparisons
  AND (cp.votable_status IS NULL OR cp.votable_status <> 'INFORMATION_ONLY')""" if
        (cdir / "proposal_anchor_links.parquet").exists() else "SELECT 1")
    con.execute("CHECKPOINT")
    con.close()
    return out


def open_gold(path: Path | None = None) -> duckdb.DuckDBPyConnection:
    p = path or DUCKDB_PATH
    return duckdb.connect(str(p), read_only=True)
