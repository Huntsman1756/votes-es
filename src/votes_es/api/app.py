"""votes-es read-only API over the gold DuckDB.

- /api/v1/* serves derived facts with provenance.
- No write endpoints. No arbitrary SQL. All queries parameterized.
- VDS-derived rows are served as facts (direction/meeting/proposal) with source
  links; bulk export stays gated by reuse_status.
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import duckdb
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from votes_es import ADAPTER_VERSION, __version__
from votes_es.config import DUCKDB_PATH

PAGE_MAX = 500


app = FastAPI(title="votes-es", version=__version__)
app.state.db_path = os.environ.get("VOTES_ES_DB", str(DUCKDB_PATH))
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["GET"], allow_headers=["*"])


def db() -> duckdb.DuckDBPyConnection:
    return duckdb.connect(app.state.db_path, read_only=True)


def rows(con: duckdb.DuckDBPyConnection, sql: str,
         params: list | None = None) -> list[dict[str, Any]]:
    cur = con.execute(sql, params or [])
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r, strict=True)) for r in cur.fetchall()]


def one(con, sql, params=None) -> dict | None:
    r = rows(con, sql, params)
    return r[0] if r else None


def _paginate(limit: int, offset: int) -> tuple[int, int]:
    return max(1, min(limit, PAGE_MAX)), max(0, offset)


# ------------------------------------------------------------------ status


@app.get("/api/v1/status")
def status():
    con = db()
    r = one(con, """
        SELECT (SELECT count(*) FROM votes) votes,
               (SELECT count(*) FROM meetings) meetings,
               (SELECT count(*) FROM issuers WHERE in_universe) issuers,
               (SELECT count(*) FROM reporters) reporters,
               (SELECT count(DISTINCT source_id) FROM votes) sources""")
    r["software_version"] = __version__
    r["adapter_version"] = ADAPTER_VERSION
    r["disclaimer"] = ("Observed public disclosures only; coverage differs by "
                       "reporter and source.")
    con.close()
    return r


@app.get("/api/v1/seasons")
def seasons():
    con = db()
    out = rows(con, """
        SELECT year(m.meeting_date) season, count(DISTINCT m.meeting_id) meetings,
               count(DISTINCT v.vote_id) votes, count(DISTINCT v.reporter_id) reporters
        FROM votes v JOIN proposals p USING(proposal_id)
        JOIN meetings m USING(meeting_id)
        GROUP BY 1 ORDER BY 1 DESC""")
    con.close()
    return {"seasons": out}


# ------------------------------------------------------------------ issuers


@app.get("/api/v1/issuers")
def issuers(q: str = "", season: int | None = None,
            limit: int = 100, offset: int = 0):
    limit, offset = _paginate(limit, offset)
    con = db()
    params: list[Any] = []
    where = "WHERE i.in_universe"
    if q:
        where += (" AND (upper(i.canonical_name) LIKE ? OR i.issuer_id = ? "
                  "OR EXISTS (SELECT 1 FROM instruments x WHERE x.issuer_id=i.issuer_id "
                  "AND (x.isin = ? OR upper(coalesce(x.ticker,'')) = ?)))")
        params += [f"%{q.upper()}%", q, q.upper(), q.upper()]
    if season:
        where += " AND year(m.meeting_date) = ?"
        params.append(season)
    out = rows(con, f"""
        SELECT i.issuer_id, i.canonical_name, i.country, i.lei,
               count(DISTINCT m.meeting_id) meetings,
               count(DISTINCT v.reporter_id) reporters,
               count(v.vote_id) observed_votes, max(m.meeting_date) latest_meeting,
               (SELECT string_agg(DISTINCT x.isin) FROM instruments x
                WHERE x.issuer_id = i.issuer_id) isins
        FROM issuers i
        LEFT JOIN meetings m ON m.issuer_id = i.issuer_id
        LEFT JOIN proposals p ON p.meeting_id = m.meeting_id
        LEFT JOIN votes v ON v.proposal_id = p.proposal_id
        {where}
        GROUP BY ALL ORDER BY observed_votes DESC NULLS LAST
        LIMIT ? OFFSET ?""", params + [limit, offset])
    con.close()
    return {"issuers": out, "limit": limit, "offset": offset}


@app.get("/api/v1/issuers/{issuer_id}")
def issuer_detail(issuer_id: str):
    con = db()
    i = one(con, """
        SELECT issuer_id, canonical_name, country, lei, in_universe,
               universe_basis FROM issuers WHERE issuer_id = ?""",
        [issuer_id])
    if not i:
        con.close()
        raise HTTPException(404, "issuer not found")
    i["instruments"] = rows(con,
        "SELECT isin, cusip, figi, ticker, instrument_type FROM instruments "
        "WHERE issuer_id = ?", [issuer_id])
    i["aliases"] = rows(con,
        "SELECT alias, alias_type FROM issuer_aliases WHERE issuer_id = ?",
        [issuer_id])
    con.close()
    return i


@app.get("/api/v1/issuers/{issuer_id}/meetings")
def issuer_meetings(issuer_id: str):
    con = db()
    out = rows(con, """
        SELECT m.meeting_id, m.meeting_date, m.meeting_type,
               count(DISTINCT p.proposal_id) proposals,
               count(DISTINCT v.reporter_id) reporters,
               count(v.vote_id) observed_votes,
               sum(CASE WHEN v.against_management THEN 1 ELSE 0 END) dissent_votes
        FROM meetings m
        LEFT JOIN proposals p ON p.meeting_id = m.meeting_id
        LEFT JOIN votes v ON v.proposal_id = p.proposal_id
        WHERE m.issuer_id = ?
        GROUP BY ALL ORDER BY m.meeting_date DESC""", [issuer_id])
    con.close()
    return {"meetings": out}


# ------------------------------------------------------------------ meetings


@app.get("/api/v1/meetings/{meeting_id}")
def meeting_detail(meeting_id: str):
    con = db()
    m = one(con, """
        SELECT m.meeting_id, m.meeting_date, m.meeting_type,
               m.source_meeting_ids, i.issuer_id, i.canonical_name issuer,
               i.lei, i.country
        FROM meetings m JOIN issuers i USING(issuer_id)
        WHERE m.meeting_id = ?""", [meeting_id])
    if not m:
        con.close()
        raise HTTPException(404, "meeting not found")
    m["reporters"] = rows(con, """
        SELECT DISTINCT r.reporter_id, r.canonical_name, r.parent_group,
               r.reporter_type
        FROM votes v JOIN proposals p USING(proposal_id)
        JOIN reporters r USING(reporter_id)
        WHERE p.meeting_id = ? ORDER BY r.canonical_name""", [meeting_id])
    con.close()
    return m


@app.get("/api/v1/meetings/{meeting_id}/votes")
def meeting_votes(meeting_id: str, pivot: bool = False,
                  limit: int = 500, offset: int = 0):
    """Per-proposal votes. pivot=true returns proposal x reporter matrix.
    NOT_OBSERVED cells are simply absent — never fabricated."""
    limit, offset = _paginate(limit, offset)
    con = db()
    if pivot:
        out = rows(con, """
            SELECT p.proposal_id, p.proposal_number, p.proposal_title_normalized,
                   (SELECT string_agg(c.category) FROM proposal_categories c
                    WHERE c.proposal_id=p.proposal_id AND c.taxonomy='VOTES_ES')
                    AS category,
                   r.canonical_name reporter, r.parent_group reporter_group,
                   v.direction, v.management_recommendation,
                   v.management_alignment, v.against_management, v.is_split,
                   v.vote_raw, v.source_id
            FROM proposals p
            JOIN votes v ON v.proposal_id = p.proposal_id
            JOIN reporters r USING(reporter_id)
            WHERE p.meeting_id = ?
            ORDER BY p.proposal_number NULLS LAST, p.proposal_title_normalized,
                     reporter""", [meeting_id])
        con.close()
        return {"pivot": out}
    out = rows(con, """
        SELECT v.vote_id, p.proposal_id, p.proposal_number,
               p.proposal_title_normalized, p.sponsor_type,
               u.canonical_name unit, r.canonical_name reporter,
               r.parent_group reporter_group,
               v.direction, v.vote_raw, v.management_recommendation,
               v.management_recommendation_raw, v.management_alignment,
               v.against_management, v.is_split, v.voting_managers,
               CAST(v.shares_voted AS DOUBLE) shares_voted,
               CAST(v.shares_on_loan AS DOUBLE) shares_on_loan,
               o.source_id, o.source_url, o.accession, o.retrieved_at
        FROM votes v JOIN proposals p USING(proposal_id)
        JOIN reporting_units u ON v.reporting_unit_id = u.unit_id
        JOIN reporters r ON v.reporter_id = r.reporter_id
        LEFT JOIN observations o ON v.source_observation_id = o.observation_id
        WHERE p.meeting_id = ?
        ORDER BY p.proposal_number NULLS LAST, p.proposal_title_normalized,
                 r.canonical_name
        LIMIT ? OFFSET ?""", [meeting_id, limit, offset])
    con.close()
    return {"votes": out, "limit": limit, "offset": offset,
            "note": "absent cell = not observed / not disclosed"}


# ----------------------------------------------------------------- reporters


@app.get("/api/v1/reporters")
def reporters():
    con = db()
    out = rows(con, """
        SELECT r.reporter_id, r.canonical_name, r.reporter_type, r.country,
               r.parent_group,
               count(DISTINCT v.reporting_unit_id) units,
               count(DISTINCT p.meeting_id) meetings,
               count(v.vote_id) observed_votes,
               sum(CASE WHEN v.against_management THEN 1 ELSE 0 END) dissent_votes
        FROM reporters r
        LEFT JOIN votes v USING(reporter_id)
        LEFT JOIN proposals p USING(proposal_id)
        GROUP BY ALL ORDER BY observed_votes DESC NULLS LAST""")
    for r in out:
        r["disclosure_seasons"] = rows(con, """
            SELECT season, disclosure_level, significance_criteria_documented,
                   significance_criteria_text
            FROM disclosure_seasons WHERE reporter_id = ?
            ORDER BY season DESC""", [r["reporter_id"]])
    con.close()
    return {"reporters": out}


@app.get("/api/v1/reporters/{reporter_id}")
def reporter_detail(reporter_id: str):
    con = db()
    r = one(con, """
        SELECT reporter_id, canonical_name, reporter_type, country,
               parent_group, lei, source_identifiers_json
        FROM reporters WHERE reporter_id = ?""", [reporter_id])
    if not r:
        con.close()
        raise HTTPException(404, "reporter not found")
    r["units"] = rows(con, """
        SELECT unit_id, unit_type, source_identifier, canonical_name
        FROM reporting_units WHERE reporter_id = ?""", [reporter_id])
    r["disclosure_seasons"] = rows(con, """
        SELECT * FROM disclosure_seasons WHERE reporter_id = ?
        ORDER BY season DESC""", [reporter_id])
    r["category_breakdown"] = rows(con, """
        SELECT c.category, count(*) votes,
               sum(CASE WHEN v.against_management THEN 1 ELSE 0 END) dissent
        FROM votes v
        JOIN proposal_categories c ON v.proposal_id = c.proposal_id
        WHERE v.reporter_id = ? AND c.taxonomy = 'VOTES_ES'
        GROUP BY 1 ORDER BY votes DESC""", [reporter_id])
    con.close()
    return r


@app.get("/api/v1/reporters/{reporter_id}/votes")
def reporter_votes(reporter_id: str, season: int | None = None,
                   issuer: str = "", limit: int = 200, offset: int = 0):
    limit, offset = _paginate(limit, offset)
    con = db()
    params: list[Any] = [reporter_id]
    where = "WHERE v.reporter_id = ?"
    if season:
        where += " AND year(m.meeting_date) = ?"
        params.append(season)
    if issuer:
        where += " AND upper(i.canonical_name) LIKE ?"
        params.append(f"%{issuer.upper()}%")
    out = rows(con, f"""
        SELECT v.vote_id, i.canonical_name issuer, m.meeting_date,
               p.proposal_title_normalized, v.direction, v.vote_raw,
               v.management_recommendation, v.against_management,
               u.canonical_name unit, o.source_url
        FROM votes v JOIN proposals p USING(proposal_id)
        JOIN meetings m USING(meeting_id)
        JOIN issuers i ON m.issuer_id = i.issuer_id
        JOIN reporting_units u ON v.reporting_unit_id = u.unit_id
        LEFT JOIN observations o ON v.source_observation_id = o.observation_id
        {where} ORDER BY m.meeting_date DESC, i.canonical_name
        LIMIT ? OFFSET ?""", params + [limit, offset])
    con.close()
    return {"votes": out, "limit": limit, "offset": offset}


# ------------------------------------------------------------------ compare


@app.get("/api/v1/compare/reporters")
def compare_reporters(a: str = Query(...), b: str = Query(...),
                      season: int | None = None):
    """Intersection-only comparison: same issuer+meeting+proposal, both
    reporters disclosed. Never extrapolates beyond observed overlap."""
    con = db()
    # param order: a,b in CTE WHERE -> (season inside CTE) -> a,b in SELECT
    params: list[Any] = [f"%{a}%", a, f"%{b}%", b]
    season_clause = ""
    if season:
        season_clause = "AND year(m.meeting_date) = ?"
        params.append(season)
    params += [f"%{a}%", a, f"%{b}%", b]
    out = rows(con, f"""
        WITH mine AS (
          SELECT v.proposal_id, p.meeting_id, v.reporter_id, v.direction,
                 v.against_management,
                 (SELECT c.category FROM proposal_categories c
                  WHERE c.proposal_id = v.proposal_id AND c.taxonomy='VOTES_ES'
                  LIMIT 1) AS category,
                 i.canonical_name issuer, p.proposal_title_normalized,
                 m.meeting_date
          FROM votes v JOIN proposals p USING(proposal_id)
          JOIN meetings m USING(meeting_id)
          JOIN issuers i ON m.issuer_id = i.issuer_id
          JOIN reporters r ON v.reporter_id = r.reporter_id
          WHERE ((r.canonical_name ILIKE ? OR r.reporter_id = ?)
             OR (r.canonical_name ILIKE ? OR r.reporter_id = ?))
             {season_clause})
        SELECT issuer, meeting_date, proposal_id, proposal_title_normalized,
               category,
               max(CASE WHEN reporter_id = (SELECT reporter_id FROM reporters
                        WHERE canonical_name ILIKE ? OR reporter_id = ? LIMIT 1)
                        THEN direction END) AS vote_a,
               max(CASE WHEN reporter_id = (SELECT reporter_id FROM reporters
                        WHERE canonical_name ILIKE ? OR reporter_id = ? LIMIT 1)
                        THEN direction END) AS vote_b
        FROM mine GROUP BY ALL""",
        params)
    both = [r for r in out if r["vote_a"] and r["vote_b"]]
    same = sum(1 for r in both if r["vote_a"] == r["vote_b"])
    con.close()
    return {
        "a": a, "b": b, "season": season,
        "common_disclosed_proposals": len(both),
        "same_direction": same, "different_direction": len(both) - same,
        "observed_agreement": (same / len(both)) if both else None,
        "meetings_compared": len({r["meeting_date"] for r in both}),
        "issuers_compared": len({r["issuer"] for r in both}),
        "proposals": both,
        "caveat": ("Observed disclosed intersection only. Disclosure levels "
                   "differ; absence is not a vote."),
    }


# ------------------------------------------------------------------- misc


@app.get("/api/v1/categories")
def categories():
    con = db()
    out = rows(con, """
        SELECT taxonomy, category, count(DISTINCT proposal_id) proposals,
               count(*) votes,
               sum(CASE WHEN v.against_management THEN 1 ELSE 0 END) dissent
        FROM proposal_categories c
        LEFT JOIN votes v ON c.proposal_id = v.proposal_id
        GROUP BY 1,2 ORDER BY taxonomy, votes DESC""")
    con.close()
    return {"categories": out}


@app.get("/api/v1/sources")
def sources():
    con = db()
    out = rows(con, """
        SELECT s.source_id, s.source_type, s.name, s.base_url, s.reuse_status,
               s.adapter_version,
               (SELECT count(*) FROM votes v WHERE v.source_id = s.source_id)
                 AS votes_ingested,
               (SELECT max(o.retrieved_at) FROM observations o
                WHERE o.source_id = s.source_id) AS last_retrieved,
               (SELECT count(*) FROM observations o
                WHERE o.source_id = s.source_id) AS observations
        FROM sources s ORDER BY s.source_id""")
    con.close()
    return {"sources": out}


# Static frontend (production): serve web/dist if present. Registered AFTER
# all /api/v1 routes so the SPA catch-all cannot shadow the API.
_dist = Path(__file__).resolve().parents[3] / "web" / "dist"
if _dist.exists():
    from fastapi.responses import FileResponse
    from fastapi.staticfiles import StaticFiles

    app.mount("/assets", StaticFiles(directory=_dist / "assets"),
              name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        f = _dist / full_path
        if full_path and f.is_file():
            return FileResponse(f)
        return FileResponse(_dist / "index.html")


@app.get("/api/v1/votes/{vote_id}")
def vote_explain(vote_id: str):
    """Explain view: canonical row + raw + provenance + identity evidence."""
    con = db()
    v = one(con, """
        SELECT v.*, p.proposal_title_normalized, p.proposal_number,
               m.meeting_date, m.meeting_type, i.canonical_name issuer,
               u.canonical_name unit, u.unit_type, u.source_identifier,
               r.canonical_name reporter, r.reporter_type, r.parent_group,
               o.source_document, o.source_url, o.accession,
               o.published_at, o.retrieved_at, o.parser_version, o.content_hash
        FROM votes v
        JOIN proposals p USING(proposal_id)
        JOIN meetings m ON p.meeting_id = m.meeting_id
        JOIN issuers i ON m.issuer_id = i.issuer_id
        JOIN reporting_units u ON v.reporting_unit_id = u.unit_id
        JOIN reporters r ON v.reporter_id = r.reporter_id
        LEFT JOIN observations o ON v.source_observation_id = o.observation_id
        WHERE v.vote_id = ?""", [vote_id])
    if not v:
        con.close()
        raise HTTPException(404, "vote not found")
    v["split_components"] = rows(con, """
        SELECT vote_id, direction, vote_raw,
               CAST(shares_voted AS DOUBLE) shares_voted
        FROM votes
        WHERE proposal_id = ? AND reporting_unit_id = ?
          AND source_observation_id = ? AND vote_id <> ?""",
        [v["proposal_id"], v["reporting_unit_id"], v["source_observation_id"],
         vote_id]) if v.get("is_split") else []
    con.close()
    v["semantics_note"] = (
        "SEC N-PX: management_alignment = whether the vote was cast for/against "
        "management's recommendation; the recommendation direction itself is "
        "not declared by N-PX."
        if v.get("source_id") == "sec_npx"
        else "VDS: management_recommendation is the direction declared in the "
             "register.")
    return v
