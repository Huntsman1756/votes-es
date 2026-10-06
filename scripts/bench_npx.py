"""G0 benchmark: streaming-parse N-PX proxyVoteTable XML.

Measures wall time, peak RSS (via psutil peak_wset on Windows),
record counts and field coverage. Namespace-agnostic via local-name
matching (handles both `inf:`-prefixed and default-namespace variants).
"""
from __future__ import annotations

import sys
import time
from collections import Counter
from pathlib import Path
from xml.etree.ElementTree import iterparse

import psutil


def local(tag: str) -> str:
    return tag.rpartition("}")[2]


FIELDS = (
    "issuerName", "cusip", "isin", "figi", "meetingDate", "voteDescription",
    "voteSource", "sharesVoted", "sharesOnLoan", "voteSeries",
)


def iter_proxy_tables(path: Path):
    for _event, elem in iterparse(path, events=("end",)):
        if local(elem.tag) == "proxyTable":
            yield elem
            elem.clear()


def parse_table(elem) -> dict:
    rec: dict = {}
    cats: list[str] = []
    votes: list[dict] = []
    managers: list[str] = []
    for child in elem:
        name = local(child.tag)
        if name == "voteCategories":
            cats = [c.text.strip() for c in child.iter() if local(c.tag) == "categoryType" and c.text]
        elif name == "vote":
            for vr in child:
                if local(vr.tag) == "voteRecord":
                    votes.append({local(g.tag): (g.text or "").strip() for g in vr})
        elif name == "voteManager":
            managers = [m.text.strip() for m in child.iter() if local(m.tag) == "otherManager" and m.text]
        elif name in FIELDS:
            rec[name] = (child.text or "").strip()
    rec["_categories"] = cats
    rec["_votes"] = votes
    rec["_other_managers"] = managers
    return rec


def main() -> None:
    path = Path(sys.argv[1])
    materialize = "--materialize" in sys.argv
    proc = psutil.Process()
    size = path.stat().st_size
    t0 = time.perf_counter()

    n_tables = 0
    n_vote_records = 0
    field_counts: Counter = Counter()
    how_voted: Counter = Counter()
    categories: Counter = Counter()
    issuers: set[str] = set()
    materialized: list[dict] | None = [] if materialize else None

    for elem in iter_proxy_tables(path):
        rec = parse_table(elem)
        n_tables += 1
        n_vote_records += len(rec["_votes"])
        issuers.add(rec.get("issuerName", ""))
        categories.update(rec["_categories"])
        for v in rec["_votes"]:
            how_voted[v.get("howVoted", "")] += 1
        for k, v in rec.items():
            if v:
                field_counts[k] += 1
        if materialized is not None:
            materialized.append(rec)

    wall = time.perf_counter() - t0
    peak_mb = proc.memory_info().peak_wset / 1e6

    print(f"file={path.name} size_mb={size/1e6:.1f}")
    print(f"wall_s={wall:.2f} mb_s={size/1e6/wall:.1f} tables_s={n_tables/wall:.0f}")
    print(f"peak_rss_mb={peak_mb:.0f}")
    print(f"proxyTables={n_tables} voteRecords={n_vote_records} issuers={len(issuers)}")
    print(f"field_coverage={dict(field_counts)}")
    print(f"how_voted={dict(how_voted)}")
    print(f"categories_top={categories.most_common(10)}")
    print(f"materialized={materialize}")


if __name__ == "__main__":
    main()
