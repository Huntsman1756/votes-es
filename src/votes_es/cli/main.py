"""`votes` CLI - first-class interface. The API/frontend read the same gold DB.
"""
from __future__ import annotations

from datetime import date
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

app = typer.Typer(name="votes", help="votes-es - institutional voting at Spanish listed companies",
                  no_args_is_help=True)
ingest_app = typer.Typer(help="Ingest sources into bronze", no_args_is_help=True)
app.add_typer(ingest_app, name="ingest")
con = Console()


def _table(title: str, cols: list[str], rows) -> None:
    t = Table(title=title, header_style="bold")
    for c in cols:
        t.add_column(c)
    for r in rows:
        t.add_row(*["" if v is None else str(v) for v in r])
    con.print(t)


# ---------------------------------------------------------------- admin: universe


@app.command()
def universe_build() -> None:
    """Build issuer universe from OpenInstrument snapshot + seed."""
    from votes_es.config import UNIVERSE_PARQUET
    from votes_es.identity.universe import build_universe_cli
    n, prov = build_universe_cli(UNIVERSE_PARQUET)
    con.print(f"universe: {n} instrument rows -> {UNIVERSE_PARQUET} ({prov})")


# ---------------------------------------------------------------- admin: ingest


@ingest_app.command("npx-file")
def ingest_npx_file(path: Path = typer.Argument(..., exists=True),
                    source_url: str = "") -> None:
    """Ingest one downloaded N-PX filing directory (primary_doc + vote XML)."""
    from votes_es.pipeline.ingest import ingest_npx_dir
    run = ingest_npx_dir(path, source_url=source_url)
    con.print(f"{run.status}: parsed={run.records_parsed} errors={len(run.errors)}")
    for e in run.errors:
        con.print(f"  [red]{e}[/red]")


@ingest_app.command("npx-season")
def ingest_npx_season(season: int, start: str = f"{date.today().year}-08-01",
                      end: str = str(date.today()), limit: int = 25,
                      keep_files: bool = False) -> None:
    """Discover + download N-PX filings for a season window (live EDGAR)."""
    import httpx

    from votes_es.config import RAW_DIR
    from votes_es.pipeline.ingest import ingest_npx_dir
    from votes_es.sources.sec_npx.edgar import (
        UA,
        download_filing,
        season_index,
    )

    client = httpx.Client(headers={"User-Agent": UA}, timeout=120,
                          follow_redirects=True)
    refs = season_index(season, date.fromisoformat(start),
                        date.fromisoformat(end), client)
    con.print(f"{len(refs)} N-PX filings in window; ingesting <={limit}")
    done = 0
    for ref in refs[:limit]:
        try:
            dest = RAW_DIR / "sec" / "filings"
            meta = download_filing(ref, dest, client)
            run = ingest_npx_dir(dest / ref.accession_nodash,
                                 source_url=ref.folder_url)
            con.print(f"  {ref.accession} {ref.company_name[:40]:40} "
                      f"{run.status} rows={run.records_parsed}")
            if not keep_files:
                for v in meta.values():
                    if isinstance(v, dict) and v.get("path"):
                        Path(v["path"]).unlink(missing_ok=True)
            done += 1
        except Exception as e:  # noqa: BLE001
            con.print(f"  {ref.accession} [red]{e}[/red]")
    con.print(f"ingested {done} filings")


@ingest_app.command("vds-capture")
def ingest_vds_capture_cmd(
    source: str = typer.Argument(..., help="e.g. iss_vds:caixabank-am"),
    votes: list[Path] = typer.Option(..., "--votes", exists=True),
    meetings: Path | None = typer.Option(None, "--meetings", exists=True),
    funds: Path | None = typer.Option(None, "--funds", exists=True),
    fund_id: int = typer.Option(0, "--fund-id",
                                help="VDS fundValue used in the api/7 request"),
) -> None:
    """Ingest previously captured VDS JSON payloads (offline path)."""
    from votes_es.pipeline.ingest import ingest_vds_capture
    run = ingest_vds_capture(source, meetings, votes, funds,
                             fund_id=fund_id or None)
    con.print(f"{run.status}: seen={run.records_seen} parsed={run.records_parsed}")
    for e in run.errors:
        con.print(f"  [red]{e}[/red]")


@ingest_app.command("vds")
def ingest_vds_cmd(
    source: str = typer.Argument(..., help="e.g. iss_vds:caixabank-am"),
    from_date: str = typer.Option("2025-01-01", "--from"),
    to_date: str = typer.Option(str(date.today()), "--to"),
    universe_only: bool = typer.Option(True, "--universe-only/--all"),
    max_meetings: int = 0,
) -> None:
    """Live pull of an ISS VDS register."""
    import pyarrow.parquet as pq

    from votes_es.config import UNIVERSE_PARQUET
    from votes_es.pipeline.ingest import ingest_vds_live
    isins = None
    if universe_only and UNIVERSE_PARQUET.exists():
        isins = set(pq.read_table(UNIVERSE_PARQUET, columns=["isin"])
                    .to_pydict()["isin"])
    run = ingest_vds_live(source, date.fromisoformat(from_date),
                          date.fromisoformat(to_date),
                          isin_filter=isins,
                          max_meetings=max_meetings or None)
    con.print(f"{run.status}: seen={run.records_seen} parsed={run.records_parsed} "
              f"errors={len(run.errors)}")
    for e in run.errors[:20]:
        con.print(f"  [red]{e}[/red]")


# ---------------------------------------------------------------- admin: build


@app.command()
def build(no_oi: bool = typer.Option(False, "--no-oi")) -> None:
    """bronze -> silver -> gold (DuckDB)."""
    from votes_es.config import UNIVERSE_PARQUET
    from votes_es.pipeline.silver import build_silver
    from votes_es.storage.gold import build_gold
    stats = build_silver(UNIVERSE_PARQUET, Path("data/silver"), use_oi=not no_oi)
    con.print(f"silver: issuers={stats.issuers} meetings={stats.meetings} "
              f"proposals={stats.proposals} votes={stats.votes}")
    con.print(f"identity: isin={stats.resolved_isin} cusip={stats.resolved_cusip} "
              f"oi-extra={stats.resolved_oi} unresolved={stats.unresolved} "
              f"ambiguous={stats.ambiguous} "
              f"out-of-universe-rows={stats.out_of_universe}")
    db = build_gold()
    con.print(f"gold: {db}")
    for w in stats.warnings[:10]:
        con.print(f"  [yellow]{w}[/yellow]")


@app.command()
def validate() -> None:
    """Data-quality checks over silver -> reports/data-quality/latest.*"""
    from votes_es.quality.checks import run_checks, write_report
    checks = run_checks()
    write_report(checks)
    _table("data quality", ["check", "status", "detail"],
           [(c.name, c.status, c.detail) for c in checks])


# ---------------------------------------------------------------- queries


def _db():
    from votes_es.storage.gold import open_gold
    return open_gold()


@app.command()
def coverage(season: int | None = None) -> None:
    """Coverage summary per source/season."""
    c = _db()
    season_clause = f"AND year(m.meeting_date) = {season}" if season else ""
    rows = c.execute(f"""
        SELECT v.source_id, count(DISTINCT v.reporter_id) reporters,
               count(DISTINCT v.reporting_unit_id) units,
               count(DISTINCT m.issuer_id) issuers,
               count(DISTINCT m.meeting_id) meetings,
               count(DISTINCT v.proposal_id) proposals, count(*) votes,
               sum(CASE WHEN v.against_management THEN 1 ELSE 0 END) dissent,
               sum(CASE WHEN v.review_status='UNRESOLVED' THEN 1 ELSE 0 END) unresolved
        FROM votes v JOIN proposals p USING(proposal_id)
        JOIN meetings m USING(meeting_id)
        WHERE 1=1 {season_clause}
        GROUP BY 1 ORDER BY 1""").fetchall()
    _table(f"coverage season={season or 'all'}",
           ["source", "reporters", "units", "issuers", "meetings",
            "proposals", "votes", "dissent", "unresolved"], rows)
    con.print("[dim]Observed public disclosures only; coverage differs by "
              "reporter and source.[/dim]")


@app.command()
def issuers(min_votes: int = 0) -> None:
    c = _db()
    rows = c.execute(f"""
        SELECT i.canonical_name, i.country, count(DISTINCT m.meeting_id) meetings,
               count(DISTINCT v.reporter_id) reporters, count(*) votes,
               max(m.meeting_date) latest
        FROM issuers i JOIN meetings m ON i.issuer_id=m.issuer_id
        JOIN proposals p USING(meeting_id) JOIN votes v USING(proposal_id)
        WHERE i.in_universe
        GROUP BY 1,2 HAVING count(*) >= {min_votes} ORDER BY votes DESC""").fetchall()
    _table("issuers", ["issuer", "country", "meetings", "reporters", "votes", "latest"], rows)


@app.command()
def meetings(issuer: str) -> None:
    c = _db()
    rows = c.execute("""
        SELECT m.meeting_date, m.meeting_type, count(DISTINCT p.proposal_id) proposals,
               count(DISTINCT v.reporter_id) reporters, m.meeting_id
        FROM meetings m JOIN issuers i USING(issuer_id)
        JOIN proposals p USING(meeting_id) JOIN votes v USING(proposal_id)
        WHERE upper(i.canonical_name) LIKE ?
        GROUP BY ALL ORDER BY m.meeting_date DESC""",
        [f"%{issuer.upper()}%"]).fetchall()
    _table(f"meetings {issuer}",
           ["date", "type", "proposals", "reporters", "meeting_id"], rows)


@app.command("meeting")
def meeting_votes(meeting_id: str, pivot: bool = True) -> None:
    """Votes of one meeting; --pivot gives proposal × reporter matrix."""
    c = _db()
    if pivot:
        rows = c.execute("""
            SELECT proposal_number, proposal_title_normalized, mgmt_rec,
                   reporter, direction FROM v_meeting_pivot
            WHERE meeting_id LIKE ? ORDER BY proposal_number NULLS LAST, 2""",
            [f"{meeting_id}%"]).fetchall()
        _table(f"meeting {meeting_id}",
               ["#", "proposal", "mgmt", "reporter", "vote"], rows)
    else:
        rows = c.execute("""
            SELECT p.proposal_title_normalized, u.canonical_name unit,
                   v.direction, v.management_recommendation, v.against_management,
                   v.shares_voted, v.source_id
            FROM votes v JOIN proposals p USING(proposal_id)
            JOIN reporting_units u ON v.reporting_unit_id=u.unit_id
            WHERE p.meeting_id LIKE ? ORDER BY p.proposal_id, unit""",
            [f"{meeting_id}%"]).fetchall()
        _table(f"meeting {meeting_id}",
               ["proposal", "unit", "vote", "mgmt", "against", "shares", "src"], rows)
    con.print("[dim]- / missing row = not observed, never 'did not vote'.[/dim]")


@app.command()
def reporters() -> None:
    c = _db()
    rows = c.execute("""
        SELECT r.canonical_name, r.reporter_type, r.parent_group,
               count(DISTINCT v.reporting_unit_id) units,
               count(DISTINCT p.meeting_id) meetings, count(*) votes
        FROM reporters r LEFT JOIN votes v USING(reporter_id)
        LEFT JOIN proposals p USING(proposal_id)
        GROUP BY ALL ORDER BY votes DESC NULLS LAST""").fetchall()
    _table("reporters", ["reporter", "type", "group", "units", "meetings", "votes"], rows)


@app.command()
def compare(a: str, b: str, season: int | None = None) -> None:
    """Intersection-only comparison between two reporters."""
    c = _db()
    season_clause = f"AND year(m.meeting_date)={season}" if season else ""
    rows = c.execute(f"""
        WITH x AS (
          SELECT v.proposal_id, v.reporter_id, v.direction, p.meeting_id,
                 i.canonical_name issuer, p.proposal_title_normalized
          FROM votes v JOIN proposals p USING(proposal_id)
          JOIN meetings m USING(meeting_id) JOIN issuers i ON m.issuer_id=i.issuer_id
          JOIN reporters r USING(reporter_id)
          WHERE (r.canonical_name ILIKE ? OR r.reporter_id = ?)
             OR (r.canonical_name ILIKE ? OR r.reporter_id = ?)
          {season_clause})
        SELECT issuer, meeting_id, proposal_title_normalized,
               max(CASE WHEN reporter_id IN (SELECT reporter_id FROM reporters
                    WHERE canonical_name ILIKE ?) THEN direction END) a_vote,
               max(CASE WHEN reporter_id IN (SELECT reporter_id FROM reporters
                    WHERE canonical_name ILIKE ?) THEN direction END) b_vote
        FROM x GROUP BY ALL""",
        [f"%{a}%", a, f"%{b}%", b, f"%{a}%", f"%{b}%"]).fetchall()
    same = sum(1 for r in rows if r[3] == r[4] and r[3])
    diff = sum(1 for r in rows if r[3] and r[4] and r[3] != r[4])
    _table(f"compare {a} vs {b}",
           ["issuer", "meeting", "proposal", a, b], rows)
    con.print(f"common disclosed proposals={len(rows)} same={same} diff={diff}")


@app.command()
def sources() -> None:
    c = _db()
    rows = c.execute("""
        SELECT source_id, source_type, name, reuse_status, adapter_version
        FROM sources ORDER BY 1""").fetchall()
    _table("sources", ["id", "type", "name", "reuse", "adapter"], rows)


@app.command("export")
def export(fmt: str = "parquet", out: Path = Path("votes_export")) -> None:
    """Export votes (reuse-filtered) to csv/parquet/json."""
    c = _db()
    q = """SELECT v.* FROM votes v JOIN sources s USING(source_id)
           WHERE s.reuse_status = 'OPEN_REUSE_CONFIRMED'"""
    p = out.with_suffix("." + {"parquet": "parquet", "csv": "csv", "json": "json"}[fmt])
    if fmt == "parquet":
        c.execute(f"COPY ({q}) TO '{p}' (FORMAT PARQUET, COMPRESSION ZSTD)")
    elif fmt == "csv":
        c.execute(f"COPY ({q}) TO '{p}' (FORMAT CSV, HEADER)")
    else:
        c.execute(f"COPY ({q}) TO '{p}' (FORMAT JSON)")
    con.print(f"wrote {p} - OPEN_REUSE_CONFIRMED sources only "
              "(VDS-derived rows excluded until reuse confirmed)")


def main() -> None:  # console entry point
    app()


if __name__ == "__main__":
    main()
