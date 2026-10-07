"""Bronze IO: source-native rows as Parquet, one file per ingested unit."""
from __future__ import annotations

import json
import threading
from pathlib import Path

_APPEND_LOCK = threading.Lock()  # bulk ingest runs filing workers in parallel

import pyarrow as pa
import pyarrow.parquet as pq

from votes_es.config import BRONZE_DIR, RAW_DIR


def write_rows(rows: list[dict], schema: pa.Schema, path: Path) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    t = pa.Table.from_pylist(rows, schema=schema)
    pq.write_table(t, path, compression="zstd")
    return t.num_rows


def append_observation(obs: dict, path: Path) -> None:
    """Observations are small; append as JSONL sidecar next to bronze files."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with _APPEND_LOCK, open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(obs, default=str) + "\n")


def src_dir_name(source: str) -> str:
    """Windows-safe directory name for a source_id (':' is illegal)."""
    return source.replace(":", "_")


def bronze_path(source: str, key: str) -> Path:
    safe = key.replace(":", "_").replace("/", "_")
    return BRONZE_DIR / src_dir_name(source) / f"{safe}.parquet"


def observations_log(source: str) -> Path:
    return BRONZE_DIR / src_dir_name(source) / "_observations.jsonl"


def filings_log(source: str) -> Path:
    return BRONZE_DIR / src_dir_name(source) / "_filings.jsonl"


def append_filing(row: dict, source: str) -> None:
    """Filing-level meta (accession, amendment semantics). JSONL append —
    deduped by accession at silver load."""
    append_observation(row, filings_log(source))


def load_filings(source: str = "sec_npx") -> list[dict]:
    """Latest meta per accession (re-ingest overwrites)."""
    out: dict[str, dict] = {}
    f = filings_log(source)
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip():
                row = json.loads(line)
                out[row["accession"]] = row
    return list(out.values())


def load_bronze(source: str, schema: pa.Schema) -> pa.Table:
    d = BRONZE_DIR / src_dir_name(source)
    if not d.exists():
        return schema.empty_table()
    files = sorted(p for p in d.glob("*.parquet"))
    if not files:
        return schema.empty_table()
    tables = [pq.read_table(f) for f in files]
    if len(tables) == 1:
        return tables[0]
    return pa.concat_tables(tables, promote_options="default")


def load_observations() -> list[dict]:
    out = []
    for f in sorted(BRONZE_DIR.glob("*/_observations.jsonl")):
        for line in f.read_text(encoding="utf-8").splitlines():
            if line.strip():
                out.append(json.loads(line))
    # dedup by observation_id (re-ingestion is idempotent)
    seen = {}
    for o in out:
        seen[o["observation_id"]] = o
    return list(seen.values())


def save_raw_json(payload: object, source: str, name: str) -> Path:
    d = RAW_DIR / src_dir_name(source)
    d.mkdir(parents=True, exist_ok=True)
    p = d / name
    p.write_text(json.dumps(payload, default=str), encoding="utf-8")
    return p
