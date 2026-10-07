"""EDGAR discovery + download for Form N-PX.

Two official bulk paths, both used with a declared User-Agent per SEC policy:
- Daily master index: Archives/edgar/daily-index/bulkdata/submissions.YYYYMM.zip? No —
  we use the per-day master index: /Archives/edgar/daily-index/YYYY/QTRN/master.YYYYMMDD.idx
  (form column 3 = 'N-PX'). Lightweight (~1 MB/day), gives cik + accession + path.
- Filing index: /Archives/edgar/data/{cik}/{accession-no-dashes}/index.json
  lists the real documents; the vote table is the XML that is NOT primary_doc.xml.

sec-cli remains an optional alternative (`tools/sec.exe daily`), pinned for
discovery — see docs/SEC-CLI-SMOKE.md.
"""
from __future__ import annotations

import csv
import io
import json
import re
import zipfile
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import httpx

UA = "votes-es research (contact: admin@h1756.es)"
EDGAR = "https://www.sec.gov"


@dataclass(frozen=True)
class FilingRef:
    cik: str
    accession: str
    form: str
    filing_date: date
    company_name: str

    @property
    def accession_nodash(self) -> str:
        return self.accession.replace("-", "")

    @property
    def folder_url(self) -> str:
        return f"{EDGAR}/Archives/edgar/data/{int(self.cik)}/{self.accession_nodash}/"


def _client() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": UA, "Accept-Encoding": "gzip"},
        timeout=60.0, follow_redirects=True,
    )


def daily_npx_index(day: date, client: httpx.Client | None = None) -> list[FilingRef]:
    """All N-PX filings in one daily master index."""
    c = client or _client()
    qtr = (day.month - 1) // 3 + 1
    url = (f"{EDGAR}/Archives/edgar/daily-index/{day.year}/QTR{qtr}/"
           f"master.{day.strftime('%Y%m%d')}.idx")
    r = c.get(url)
    if r.status_code == 404:
        return []
    r.raise_for_status()
    out = []
    for row in csv.reader(io.StringIO(r.text), delimiter="|"):
        if len(row) >= 5 and row[2].strip().upper().startswith("N-PX"):
            cik = row[0].strip()
            acc = re.search(r"(\d{10}-\d{2}-\d{6})", row[4])
            if not acc:
                continue
            out.append(FilingRef(
                cik=cik, accession=acc.group(1), form=row[2].strip(),
                filing_date=date.fromisoformat(row[3].strip()),
                company_name=row[1].strip(),
            ))
    return out


def season_index(year: int, start: date, end: date,
                 client: httpx.Client | None = None) -> list[FilingRef]:
    """Scan daily indexes over the filing window (N-PX cluster: Aug–Oct)."""
    from datetime import timedelta
    c = client or _client()
    out: list[FilingRef] = []
    d = start
    while d <= end:
        if d.weekday() < 5:
            out.extend(daily_npx_index(d, c))
        d += timedelta(days=1)
    return out


def filing_documents(ref: FilingRef, client: httpx.Client | None = None) -> dict:
    """index.json for a filing — lists primary doc + vote table XML."""
    c = client or _client()
    r = c.get(ref.folder_url + "index.json")
    r.raise_for_status()
    return r.json()


def pick_vote_table(docs_index: dict) -> str | None:
    """Vote table = XML sibling of the primary submission doc. Filer-chosen
    names vary (proxytable.xml / ProxyVotingTable.xml / BRDWLB_*.xml)."""
    items = {i["name"]: i for i in docs_index.get("directory", {}).get("item", [])}
    xmls = [n for n in items if n.lower().endswith(".xml")]
    non_primary = [n for n in xmls if "primary_doc" not in n.lower()]
    if len(non_primary) == 1:
        return non_primary[0]
    # prefer names suggesting the vote table
    for n in non_primary:
        if re.search(r"proxy|vote|table|npx", n, re.IGNORECASE):
            return n
    return non_primary[0] if non_primary else None


def download_filing(ref: FilingRef, dest_dir: Path,
                    client: httpx.Client | None = None) -> dict:
    """Download primary_doc.xml + vote-table XML into dest_dir/accession/.
    Returns paths + content hashes. Caller decides retention."""
    import hashlib
    c = client or _client()
    out_dir = dest_dir / ref.accession_nodash
    out_dir.mkdir(parents=True, exist_ok=True)
    docs = filing_documents(ref, c)
    result = {"accession": ref.accession, "cik": ref.cik, "folder": ref.folder_url}
    for item in docs.get("directory", {}).get("item", []):
        name = item["name"]
        if not name.lower().endswith(".xml"):
            continue
        r = c.get(ref.folder_url + name)
        r.raise_for_status()
        p = out_dir / name
        p.write_bytes(r.content)
        result[name] = {"path": str(p), "sha256": hashlib.sha256(r.content).hexdigest(),
                        "size": len(r.content)}
    return result


def index_zip_to_refs(payload: bytes) -> list[FilingRef]:
    """Parse a companyfacts-style zip index (kept for alternate bulk path)."""
    refs = []
    with zipfile.ZipFile(io.BytesIO(payload)) as z:
        for n in z.namelist():
            if n.endswith(".json"):
                d = json.loads(z.read(n))
                refs.append(d)
    return refs
