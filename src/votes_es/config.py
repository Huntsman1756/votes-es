"""Paths & runtime config. Overridable via VOTES_ES_* env vars."""
from __future__ import annotations

import os
from pathlib import Path

_REPO = Path(__file__).resolve().parents[2]  # src/votes_es/config.py → repo root
DATA_DIR = Path(os.environ.get("VOTES_ES_DATA", _REPO / "data"))

RAW_DIR = DATA_DIR / "raw"
BRONZE_DIR = DATA_DIR / "bronze"
SILVER_DIR = DATA_DIR / "silver"
GOLD_DIR = DATA_DIR / "gold"
REFERENCE_DIR = DATA_DIR / "reference"
COVERAGE_DIR = DATA_DIR / "coverage"
REPORTS_DIR = _REPO / "reports" / "data-quality"

UNIVERSE_PARQUET = REFERENCE_DIR / "universe.parquet"
DUCKDB_PATH = GOLD_DIR / "votes.duckdb"

# Reuse gate: which source_ids may publish vote ROWS in the served dataset.
# Empty = all (local dev). For the public deployment we keep VDS metadata
# (reporters, meetings, source links) but not vote rows:
#   VOTES_PUBLISH_VOTE_SOURCES="sec_npx"
PUBLISH_VOTE_SOURCES = [
    s.strip() for s in os.environ.get("VOTES_PUBLISH_VOTE_SOURCES", "").split(",")
    if s.strip()
]
