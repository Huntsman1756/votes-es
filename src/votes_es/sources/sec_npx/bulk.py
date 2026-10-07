"""Bulk N-PX season ingest: quarterly form.idx discovery + fair-access fetch.

Design (prior art reviewed in docs/prior-art/N-PX.md):
- Discovery via official quarterly indexes:
    /Archives/edgar/full-index/{year}/QTR{n}/form.idx
  lines beginning "N-PX " / "N-PX/A " give cik, company, filing date, path.
- Manifest-first: data/manifests/npx-<season>.jsonl is append-only and
  auditable; per-accession status drives resumability.
- Fetch order per filing: index.json → primary_doc.xml → vote-table XML(s).
  primary_doc decides report_type (FUND / INSTITUTIONAL MANAGER /
  NOTICE / COMBINATION) and amendment semantics.
- Fair access: global token rate limiter (default 3 rps), exponential
  backoff, Retry-After honored, declared UA, one connection.
- Retention: vote-table XML is deleted after successful parse (content hash
  in the observation makes it re-fetchable); primary_doc + manifest.json
  are kept. Override with keep_xml=True.
"""
from __future__ import annotations

import json
import re
import threading
import time
import uuid
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

import httpx

from votes_es.config import BRONZE_DIR, RAW_DIR
from votes_es.sources.sec_npx import edgar
from votes_es.sources.sec_npx.edgar import FilingRef

MANIFEST_DIR = RAW_DIR / "manifests"
FILINGS_DIR = RAW_DIR / "sec" / "filings"


# ------------------------------------------------------------ rate limiting


@dataclass
class RateLimiter:
    """Global min-interval limiter + backoff. SEC policy is about request
    RATE, not throughput — thread-safe, shared across download workers."""
    rps: float = 3.0
    _min_interval: float = field(init=False, repr=False)
    _last: float = field(default=0.0, init=False, repr=False)
    _failures: int = field(default=0, init=False, repr=False)
    _lock: threading.Lock = field(init=False, repr=False)

    def __post_init__(self):
        self._lock = threading.Lock()
        self._min_interval = 1.0 / max(self.rps, 0.1)

    def wait(self) -> None:
        with self._lock:
            now = time.monotonic()
            if delta := self._min_interval - (now - self._last):
                if delta > 0:
                    time.sleep(delta)
            self._last = time.monotonic()

    def backoff(self, retry_after: str | None = None) -> None:
        """Called on 403/429/5xx/network error. Exponential + Retry-After."""
        self._failures += 1
        base = 60.0 if retry_after is None else float(retry_after)
        wait = min(base if self._failures <= 2 else 30 * self._failures, 300)
        time.sleep(wait)

    def ok(self) -> None:
        self._failures = 0


class FairClient:
    """httpx wrapper: declared UA, global rate limiting, resumable.
    httpx.Client is safe to share across worker threads; the shared
    RateLimiter bounds request rate — concurrency only overlaps downloads."""

    def __init__(self, rps: float = 3.0, workers: int = 4):
        self.limit = RateLimiter(rps)
        self.http = httpx.Client(
            headers={"User-Agent": edgar.UA, "Accept-Encoding": "gzip"},
            timeout=120.0, follow_redirects=True,
            limits=httpx.Limits(max_connections=workers + 2))

    def get(self, url: str, attempts: int = 5) -> httpx.Response | None:
        for _ in range(attempts):
            self.limit.wait()
            try:
                r = self.http.get(url)
            except httpx.HTTPError:
                self.limit.backoff()
                continue
            if r.status_code == 200:
                self.limit.ok()
                return r
            if r.status_code == 404:
                return None
            if r.status_code in (403, 429, 500, 502, 503):
                self.limit.backoff(r.headers.get("retry-after"))
                continue
            return None
        return None

    def download(self, url: str, dest: Path, attempts: int = 4) -> int | None:
        """Stream to disk under the same rate limiter; returns byte count."""
        dest.parent.mkdir(parents=True, exist_ok=True)
        for _ in range(attempts):
            self.limit.wait()
            try:
                with self.http.stream("GET", url) as r:
                    if r.status_code == 404:
                        return None
                    if r.status_code in (403, 429, 500, 502, 503):
                        self.limit.backoff(r.headers.get("retry-after"))
                        continue
                    if r.status_code != 200:
                        return None
                    n = 0
                    with dest.open("wb") as f:
                        for chunk in r.iter_bytes(1 << 20):
                            f.write(chunk)
                            n += len(chunk)
                    self.limit.ok()
                    return n
            except httpx.HTTPError:
                self.limit.backoff()
        return None

    def close(self):
        self.http.close()


# ------------------------------------------------------------- discovery

_FORM_RE = re.compile(r"^(N-PX/A?|N-PX)\s")


def discover_quarter(year: int, qtr: int,
                     client: FairClient | None = None) -> list[FilingRef]:
    """All N-PX/N-PX-A filings in one quarterly form.idx."""
    c = client or FairClient()
    url = f"{edgar.EDGAR}/Archives/edgar/full-index/{year}/QTR{qtr}/form.idx"
    r = c.get(url)
    if r is None:
        return []
    out = []
    for line in r.text.splitlines():
        if not _FORM_RE.match(line):
            continue
        parts = re.split(r"\s{2,}", line.strip())
        if len(parts) < 5:
            continue
        acc = re.search(r"(\d{10}-\d{2}-\d{6})", parts[4])
        if not acc:
            continue
        try:
            fd = date.fromisoformat(parts[3].strip())
        except ValueError:
            fd = date(1900, 1, 1)
        out.append(FilingRef(
            cik=parts[2].strip(), accession=acc.group(1),
            form=parts[0].strip(), filing_date=fd,
            company_name=parts[1].strip()))
    return out


def season_quarters(season: int) -> list[tuple[int, int]]:
    """N-PX season `season` = report period ending ~June {season}. Filed
    overwhelmingly Jul–Dec {season}; late amendments can extend a quarter."""
    return [(season, 3), (season, 4), (season + 1, 1)]


# -------------------------------------------------------------- manifest


def manifest_path(season: int) -> Path:
    return MANIFEST_DIR / f"npx-{season}.jsonl"


def load_manifest(path: Path) -> dict[str, dict]:
    out: dict[str, dict] = {}
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                row = json.loads(line)
                out[row["accession"]] = row
    return out


def append_manifest(path: Path, row: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(row, default=str) + "\n")


def upsert_manifest(path: Path, row: dict) -> None:
    """Rewrite-with-latest-state — small file, deterministic."""
    rows = load_manifest(path)
    rows[row["accession"]] = row
    with open(path, "w", encoding="utf-8") as f:
        for r in sorted(rows.values(), key=lambda x: x.get("filing_date", "")):
            f.write(json.dumps(r, default=str) + "\n")


# ------------------------------------------------------------------ bulk


def build_manifest(season: int, client: FairClient | None = None) -> Path:
    """Phase 1: discovery only. One manifest row per accession."""
    c = client or FairClient()
    path = manifest_path(season)
    known = load_manifest(path)
    for year, qtr in season_quarters(season):
        refs = discover_quarter(year, qtr, c)
        for ref in refs:
            acc = ref.accession
            if acc in known:
                continue
            append_manifest(path, {
                "season": season, "accession": acc, "cik": ref.cik,
                "form": ref.form, "filing_date": ref.filing_date.isoformat(),
                "company": ref.company_name, "folder_url": ref.folder_url,
                "status": "DISCOVERED", "size_bytes": None, "vote_rows": None,
                "report_type": None, "amendment": None, "error": None,
            })
    return path


def _process_filing(entry: dict, c: FairClient, manifest: Path,
                    stats: dict, lock, keep_xml: bool,
                    progress, total: int, t0: float) -> None:
    """One filing end-to-end. Mutates entry + stats under `lock` only for
    shared structures; file writes are per-accession (no contention)."""
    from votes_es.pipeline.ingest import ingest_npx_dir
    from votes_es.sources.sec_npx.provider import filing_row
    from votes_es.storage import bronze

    acc_nodash = entry["accession"].replace("-", "")
    ref = FilingRef(cik=entry["cik"], accession=entry["accession"],
                    form=entry["form"],
                    filing_date=date.fromisoformat(entry["filing_date"]),
                    company_name=entry["company"])
    fdir = FILINGS_DIR / acc_nodash
    try:
        pdoc = c.get(ref.folder_url + "primary_doc.xml")
        if pdoc is None:
            entry.update(status="FAILED", error="primary_doc fetch failed")
            with lock:
                stats["failed"] += 1
                append_manifest(manifest, entry)
            return
        fdir.mkdir(parents=True, exist_ok=True)
        (fdir / "primary_doc.xml").write_bytes(pdoc.content)
        with lock:
            stats["bytes"] += len(pdoc.content)
        from votes_es.sources.sec_npx.filing import parse_primary_doc
        meta = parse_primary_doc(fdir / "primary_doc.xml",
                                 accession=entry["accession"], cik=ref.cik)
        entry.update(
            report_type=meta.report_type, amendment=meta.amendment_type,
            submission_type=meta.submission_type,
            reporting_person=meta.reporting_person,
            period_of_report=(meta.period_of_report.isoformat()
                              if meta.period_of_report else None),
            size_bytes=len(pdoc.content))
        sidecar = {
            "accession": entry["accession"], "cik": ref.cik,
            "report_type": meta.report_type,
            "submission_type": meta.submission_type,
            "amendment_no": meta.amendment_no,
            "amendment_type": meta.amendment_type,
            "reporting_person": meta.reporting_person,
            "period_of_report": entry["period_of_report"],
            "folder_url": ref.folder_url}

        rt = (meta.report_type or "").upper()
        if "VOTING" not in rt and "COMBINATION" not in rt:
            entry["status"] = "NO_VOTE_TABLE"
            bronze.append_filing(filing_row(meta), "sec_npx")
            (fdir / "manifest.json").write_text(json.dumps(sidecar))
            with lock:
                stats["no_votes"] += 1
                append_manifest(manifest, entry)
            return

        idx = c.get(ref.folder_url + "index.json")
        docs = idx.json() if idx else {}
        items = docs.get("directory", {}).get("item", [])
        xmls = [i["name"] for i in items
                if i["name"].lower().endswith(".xml")
                and "primary_doc" not in i["name"].lower()]
        if not xmls:
            entry["status"] = "NO_VOTE_TABLE"
            bronze.append_filing(filing_row(meta), "sec_npx")
            with lock:
                stats["no_votes"] += 1
                append_manifest(manifest, entry)
            return
        with lock:
            stats["downloaded"] += 1
        ok = True
        for name in xmls:
            n = c.download(ref.folder_url + name, fdir / name)
            if n is None:
                entry.update(status="FAILED", error=f"download failed: {name}")
                ok = False
                break
            with lock:
                stats["bytes"] += n
            entry["size_bytes"] += n
        if not ok:
            with lock:
                stats["failed"] += 1
                append_manifest(manifest, entry)
            return
        (fdir / "manifest.json").write_text(json.dumps(sidecar))
        run = ingest_npx_dir(fdir, source_url=ref.folder_url)
        if run.status == "OK":
            entry.update(status="OK", vote_rows=run.records_parsed)
            with lock:
                stats["parsed"] += 1
        else:
            entry.update(status="FAILED", error=";".join(run.errors[:3]))
            with lock:
                stats["failed"] += 1
        if not keep_xml:
            for name in xmls:
                (fdir / name).unlink(missing_ok=True)
        with lock:
            append_manifest(manifest, entry)
    except Exception as e:  # noqa: BLE001 — one filing must not kill the job
        entry.update(status="FAILED", error=f"{type(e).__name__}: {e}")
        with lock:
            stats["failed"] += 1
            append_manifest(manifest, entry)
    finally:
        with lock:
            stats["seen"] += 1
            if stats["seen"] % 50 == 0:
                elapsed = (time.time() - t0) / 60
                progress(f"[{stats['seen']}/{total}] ok={stats['parsed']} "
                         f"no_votes={stats['no_votes']} failed={stats['failed']} "
                         f"{stats['bytes']/1e9:.2f}GB {elapsed:.0f}min")


def ingest_season(season: int, client: FairClient | None = None,
                  manifest_only: bool = False, max_files: int | None = None,
                  retry_failed: bool = True, keep_xml: bool = False,
                  workers: int = 4, progress=print) -> dict:
    """Phase 2: per filing — index.json → primary_doc → vote tables → bronze.

    Resume-safe: accessions already OK/NO_VOTE_TABLE are skipped unless
    retry_failed. Each filing's bronze file name = accession (idempotent).
    `workers` bounds concurrency; the shared RateLimiter still caps request
    RATE (SEC policy) — workers only overlap the download/parse time.
    """
    from concurrent.futures import ThreadPoolExecutor

    c = client or FairClient()
    path = manifest_path(season)
    if not path.exists():
        build_manifest(season, c)
    rows = load_manifest(path)
    if manifest_only:
        return {"manifest": str(path), "entries": len(rows)}

    # reconcile with existing bronze (fast resume without re-fetch)
    done = {p.stem for p in (BRONZE_DIR / "sec_npx").glob("*.parquet")}
    pending = []
    skipped_done = 0
    for e in sorted(rows.values(), key=lambda x: x["accession"]):
        acc_nodash = e["accession"].replace("-", "")
        if acc_nodash in done and e["status"] in ("OK", "NO_VOTE_TABLE"):
            skipped_done += 1
            continue
        if e["status"] == "FAILED" and not retry_failed:
            continue
        pending.append(e)
        if max_files and len(pending) >= max_files:
            break

    stats = {"seen": 0, "downloaded": 0, "parsed": 0, "failed": 0,
             "no_votes": 0, "skipped_done": skipped_done, "bytes": 0}
    lock = threading.Lock()
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = [pool.submit(_process_filing, e, c, path, stats, lock,
                            keep_xml, progress, len(pending), t0)
                for e in pending]
        for f in futs:
            f.result()          # propagate worker crash (shouldn't happen)
    return {**stats, "manifest": str(path), "run_id": str(uuid.uuid4())}
