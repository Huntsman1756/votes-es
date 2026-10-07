"""Differential validation: votes-es bronze vs proxy-voting-panel data/votes.csv.gz.

For overlapping accessions, compares per (series, cusip, proposal-norm):
- direction of the largest-share component (their `vote` = main position)
- total shares_voted (they sum components; we keep rows separately)
- alignment flag (their `vs_mgmt`) on the main component
- split presence (their split_vote='Y' vs our multi-direction rows)

Usage: python scripts/diff_panel.py <panel-votes.csv.gz>
"""
from __future__ import annotations

import csv
import gzip
import re
import sys
from collections import defaultdict
from pathlib import Path

import pyarrow.parquet as pq

from votes_es.config import BRONZE_DIR
from votes_es.storage.schemas import BRONZE_NPX


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


_FREQ = {"1 YEAR": "FREQ1", "ONE YEAR": "FREQ1", "2 YEARS": "FREQ2",
         "TWO YEARS": "FREQ2", "3 YEARS": "FREQ3", "THREE YEARS": "FREQ3",
         "1.0": "FREQ1", "2.0": "FREQ2", "3.0": "FREQ3", "1": "FREQ1",
         "2": "FREQ2", "3": "FREQ3", "TAKENOACTION": "TAKE NO ACTION"}

# not real positions — excluded from split determination on both sides
_NOT_A_POSITION = {"TAKE NO ACTION", "", "NONE"}


def canon_dir(raw: str) -> str:
    k = re.sub(r"\s+", " ", (raw or "").strip()).upper()
    return _FREQ.get(k, k)


def main(csv_gz: Path) -> int:
    # ---- panel rows, keyed by (acc, series, cusip, proposal)
    panel: dict[tuple, dict] = {}
    with gzip.open(csv_gz, "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            k = (r["accession"], r["series_id"], r["cusip"], r["meeting_date"],
                 norm(r["proposal"]))
            panel[k] = r
    if not panel:
        print("panel csv empty")
        return 1
    accs = {k[0] for k in panel}
    print(f"panel: {len(panel)} rows, {len(accs)} accessions")

    # ---- our bronze for the same accessions
    ours: dict[tuple, list[dict]] = defaultdict(list)
    d = BRONZE_DIR / "sec_npx"
    n_files = 0
    for p in sorted(d.glob("*.parquet")):
        t = pq.read_table(p, schema=BRONZE_NPX)
        accs_in = set(t.column("accession").unique().to_pylist())
        if not accs_in & accs:
            continue
        n_files += 1
        for row in t.to_pylist():
            acc = row["accession"]
            # N-PX date = MM/DD/YYYY → ISO to match panel's meeting_date
            mdr = row["meeting_date_raw"] or ""
            try:
                m, d, y = mdr.split("/")
                mdr = f"{y}-{int(m):02d}-{int(d):02d}"
            except ValueError:
                pass
            k = (acc, row["vote_series"] or "", row["cusip"] or "", mdr,
                 norm(row["proposal_text_raw"]))
            ours[k].append(row)
    overlap = set(panel) & set(ours)
    print(f"ours: {n_files} filings scanned; overlap keys: {len(overlap)}")

    diffs = {"direction": [], "shares": [], "vs_mgmt": [], "split": []}
    matched = 0
    for k in sorted(overlap):
        rows = ours[k]
        pr = panel[k]
        # Dedup identical components first: some filers emit the same
        # (series, proposal) block twice with different categories — the
        # vote component is identical, count it once.
        seen_comp: set[tuple] = set()
        by_dir: dict[str, float] = defaultdict(float)
        n_blocks = 0
        for r in rows:
            comp = (canon_dir(r["how_voted_raw"] or ""),
                    r["shares_voted_raw"] or "")
            if comp not in seen_comp:
                seen_comp.add(comp)
                try:
                    by_dir[comp[0]] += float(r["shares_voted_raw"] or 0)
                except ValueError:
                    pass
            n_blocks += 1
        if not by_dir:
            continue
        main = max(by_dir.items(), key=lambda kv: kv[1])[0]
        total = sum(by_dir.values())
        if main != canon_dir(pr["vote"]):
            diffs["direction"].append((k, main, pr["vote"]))
        if abs(total - float(pr["shares_voted"] or 0)) > 0.5:
            # filer emitted multiple blocks for the same key with different
            # share lots — panel collapses to one; classify, don't hide
            tag = "multi-block" if n_blocks > len(seen_comp) else "value"
            diffs["shares"].append((k, total, pr["shares_voted"], tag))
        # alignment flag on the main-direction component; panel falls back
        # to any record's flag when the main record is empty/NONE — we keep
        # the component's own value (more faithful); flag-only diffs tagged
        align = next((r["management_recommendation_raw"] for r in rows
                      if canon_dir(r["how_voted_raw"] or "") == main), None)
        if align and pr["vs_mgmt"] and align.upper() != pr["vs_mgmt"].upper():
            diffs["vs_mgmt"].append((k, align, pr["vs_mgmt"]))
        positions = {d for d in by_dir if d not in _NOT_A_POSITION}
        is_split = len(positions) > 1
        if is_split != (pr["split_vote"] == "Y"):
            diffs["split"].append((k, is_split, pr["split_vote"]))
        matched += 1

    print(f"matched={matched}")
    for name, ds in diffs.items():
        print(f"{name}: {len(ds)} disagreements")
        for d in ds[:8]:
            print("   ", d)
    return 0


if __name__ == "__main__":
    sys.exit(main(Path(sys.argv[1])))
