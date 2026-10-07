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


def main(csv_gz: Path) -> int:
    # ---- panel rows, keyed by (acc, series, cusip, proposal)
    panel: dict[tuple, dict] = {}
    with gzip.open(csv_gz, "rt", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            k = (r["accession"], r["series_id"], r["cusip"], norm(r["proposal"]))
            panel[k] = r
    if not panel:
        print("panel csv empty"); return 1
    accs = {k[0] for k in panel}
    print(f"panel: {len(panel)} rows, {len(accs)} accessions")

    # ---- our bronze for the same accessions
    ours: dict[tuple, list[dict]] = defaultdict(list)
    d = BRONZE_DIR / "sec_npx"
    n_files = 0
    for p in sorted(d.glob("*.parquet")):
        t = pq.read_table(p, schema=BRONZE_NPX)
        accs_in = {a.replace("-", "") for a in t.column("accession").unique().to_pylist()}
        if not accs_in & accs:
            continue
        n_files += 1
        for row in t.to_pylist():
            acc = row["accession"].replace("-", "")
            k = (acc, row["vote_series"] or "", row["cusip"] or "",
                 norm(row["proposal_text_raw"]))
            ours[k].append(row)
    overlap = set(panel) & set(ours)
    print(f"ours: {n_files} filings scanned; overlap keys: {len(overlap)}")

    diffs = {"direction": [], "shares": [], "vs_mgmt": [], "split": []}
    matched = 0
    for k in sorted(overlap):
        rows = ours[k]
        pr = panel[k]
        # their vote = position with most shares; replicate for comparison
        by_dir: dict[str, float] = defaultdict(float)
        for r in rows:
            try:
                by_dir[(r["how_voted_raw"] or "").upper()] += float(
                    r["shares_voted_raw"] or 0)
            except ValueError:
                pass
        if not by_dir:
            continue
        main = max(by_dir.items(), key=lambda kv: kv[1])[0]
        total = sum(by_dir.values())
        if main != pr["vote"].upper():
            diffs["direction"].append((k, main, pr["vote"]))
        if abs(total - float(pr["shares_voted"] or 0)) > 0.5:
            diffs["shares"].append((k, total, pr["shares_voted"]))
        # alignment flag on the main-direction component
        align = next((r["management_recommendation_raw"] for r in rows
                      if (r["how_voted_raw"] or "").upper() == main), None)
        if align and pr["vs_mgmt"] and align.upper() != pr["vs_mgmt"].upper():
            diffs["vs_mgmt"].append((k, align, pr["vs_mgmt"]))
        is_split = len(by_dir) > 1
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
