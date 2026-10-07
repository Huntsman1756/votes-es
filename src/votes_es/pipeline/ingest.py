"""Ingest: raw artifacts → bronze parquet (+ observation JSONL).

Commands:
    ingest_npx_dir(path)     — a downloaded filing dir (primary_doc + vote table)
    ingest_vds_capture(...)  — previously captured VDS JSON payloads
    ingest_vds_live(...)     — live pull for a registered VDS customer
"""
from __future__ import annotations

import json
import uuid
from datetime import UTC, date, datetime
from pathlib import Path

from votes_es import ADAPTER_VERSION
from votes_es.config import RAW_DIR
from votes_es.domain.models import IngestRun
from votes_es.sources.iss_vds import adapter as vds
from votes_es.sources.iss_vds.client import VdsClient
from votes_es.sources.registry import SOURCES
from votes_es.sources.sec_npx import provider as npx
from votes_es.storage import bronze
from votes_es.storage.schemas import BRONZE_NPX, BRONZE_VDS


def _run(source_id: str) -> IngestRun:
    return IngestRun(run_id=str(uuid.uuid4()), source_id=source_id,
                     started_at=datetime.now(UTC), adapter_version=ADAPTER_VERSION)


def _finish(run: IngestRun, ok: bool = True) -> IngestRun:
    run.finished_at = datetime.now(UTC)
    run.status = "OK" if ok and not run.errors else ("PARTIAL" if run.records_parsed else "FAILED")
    log = bronze.BRONZE_DIR / bronze.src_dir_name(run.source_id) / "_runs.jsonl"
    log.parent.mkdir(parents=True, exist_ok=True)
    with open(log, "a", encoding="utf-8") as f:
        f.write(run.model_dump_json() + "\n")
    return run


def ingest_npx_dir(filing_dir: Path, source_url: str = "") -> IngestRun:
    """Parse one downloaded N-PX filing directory into bronze."""
    run = _run("sec_npx")
    try:
        try:
            meta, vote_doc = npx.load_filing_dir(filing_dir)
        except FileNotFoundError:
            # NOTICE / non-voting reports: primary_doc only, no vote table —
            # legitimate terminal state, not a parse failure.
            meta = npx._meta_from(filing_dir / "primary_doc.xml", filing_dir)
            rt = (meta.report_type or "").upper()
            if "VOTING" in rt or "COMBINATION" in rt:
                raise
            bronze.append_filing(npx.filing_row(meta), "sec_npx")
            run.records_seen = run.records_parsed = run.records_matched = 0
            return _finish(run)

        rows, obs = npx.bronze_rows(meta, vote_doc, source_url=source_url)
        run.records_seen = run.records_parsed = len(rows)
        key = meta.accession.replace("-", "") or filing_dir.name
        n = bronze.write_rows(rows, BRONZE_NPX,
                              bronze.bronze_path("sec_npx", key))
        bronze.append_observation(
            obs.model_dump(mode="json"), bronze.observations_log("sec_npx"))
        bronze.append_filing(npx.filing_row(meta), "sec_npx")
        run.records_matched = n
    except Exception as e:  # noqa: BLE001 — ingest must record, not crash silently
        run.errors.append(f"{type(e).__name__}: {e}")
    return _finish(run, not run.errors)


def ingest_vds_capture(source_id: str, meetings_path: Path | None,
                       votes_paths: list[Path], funds_path: Path | None = None,
                       fund_id: int | None = None,
                       retrieved_at: datetime | None = None) -> IngestRun:
    """Bronze from captured VDS payloads (offline/testing path)."""
    src = SOURCES[source_id]
    run = _run(source_id)
    try:
        meeting_index = {}
        if meetings_path:
            mrows = vds.parse_meetings(json.loads(meetings_path.read_text("utf-8")))
            meeting_index = {m.meeting_id: m for m in mrows}
            run.records_seen = len(mrows)
        if funds_path:
            raw_dir = RAW_DIR / source_id.replace(":", "_")
            raw_dir.mkdir(parents=True, exist_ok=True)
            (raw_dir / "funds.json").write_bytes(funds_path.read_bytes())
        all_rows: list[dict] = []
        for vp in votes_paths:
            vrows = vds.parse_votes(json.loads(vp.read_text("utf-8")))
            run.records_seen += len(vrows)
            meeting_row = meeting_index.get(vrows[0].meeting_id) if vrows else None
            url = f"{src.base_url} meeting={vrows[0].meeting_id if vrows else '?'}"
            rows, obs = vds.votes_to_bronze(
                vrows, source_id=source_id, reporter_key=src.reporter_key or source_id,
                meeting_row=meeting_row, source_url=url, fund_id=fund_id,
                retrieved_at=retrieved_at)
            all_rows.extend(rows)
            bronze.append_observation(
                obs.model_dump(mode="json"),
                bronze.observations_log(source_id))
            run.records_parsed += len(rows)
            run.records_matched += len(rows)
        if all_rows:
            # One bronze file per ingest run — per-meeting files created an
            # N-small-files problem (Windows FS + AV) and duplicated rows on
            # re-ingestion. Re-pulls are season snapshots; dedup in silver.
            key = f"capture_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}"
            bronze.write_rows(all_rows, BRONZE_VDS,
                              bronze.bronze_path(source_id, key))
    except Exception as e:  # noqa: BLE001
        run.errors.append(f"{type(e).__name__}: {e}")
    return _finish(run, not run.errors)


def ingest_vds_live(source_id: str, from_date: date, to_date: date,
                    isin_filter: set[str] | None = None,
                    max_meetings: int | None = None) -> IngestRun:
    """Live pull: fund list + meeting list + per-fund×meeting votes.

    `isin_filter` restricts api/7 fetches to meetings of universe issuers —
    the product is Spain-scoped; we don't need the manager's global register.
    """
    src = SOURCES[source_id]
    run = _run(source_id)
    client = VdsClient(src.vds_customer_b64 or "")
    try:
        client.bootstrap()
        funds = vds.parse_funds({"data": client.funds()})
        bronze.save_raw_json([f.model_dump(mode="json") for f in funds],
                             source_id, "funds.json")
        meetings = vds.parse_meetings(
            {"data": client.all_meetings(from_date, to_date)})
        run.records_seen = len(meetings)
        wanted = [m for m in meetings
                  if isin_filter is None or m.isin in isin_filter]
        if max_meetings:
            wanted = wanted[:max_meetings]
        all_rows: list[dict] = []
        for m in wanted:
            for fund_id in m.fund_ids:
                try:
                    vrows = vds.parse_votes(client.votes(m.meeting_id, fund_id))
                    run.records_seen += len(vrows)
                    rows, obs = vds.votes_to_bronze(
                        vrows, source_id=source_id,
                        reporter_key=src.reporter_key or source_id,
                        meeting_row=m,
                        source_url=f"{src.base_url} meeting={m.meeting_id}",
                        fund_id=fund_id)
                    all_rows.extend(rows)
                    bronze.append_observation(
                        obs.model_dump(mode="json"),
                        bronze.observations_log(source_id))
                    run.records_parsed += len(rows)
                    run.records_matched += len(rows)
                except Exception as e:  # noqa: BLE001
                    run.errors.append(f"meeting {m.meeting_id} fund {fund_id}: {e}")
                    run.records_rejected += 1
        if all_rows:
            key = f"live_{from_date}_{to_date}_{datetime.now(UTC).strftime('%H%M%S')}"
            bronze.write_rows(all_rows, BRONZE_VDS,
                              bronze.bronze_path(source_id, key))
    except Exception as e:  # noqa: BLE001
        run.errors.append(f"{type(e).__name__}: {e}")
    finally:
        client.close()
    return _finish(run, not run.errors)
