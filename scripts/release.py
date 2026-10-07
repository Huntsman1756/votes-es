"""Release-build an immutable dataset generation.

Usage:
    VOTES_PUBLISH_VOTE_SOURCES=sec_npx python scripts/release.py

Produces dist/generations/<run_id>/ with:
    gold/votes.duckdb   gated serving DB
    parquets/*.parquet  gated silver tables (release assets)
    manifest.json  coverage.json  quality.json  SHA256SUMS
and a dist/CURRENT pointer file naming the active generation.

Validation runs against BOTH the full silver layer (structural checks)
and the gated gold DB (publication gate check). Any FAIL aborts before
the CURRENT pointer is touched.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

import duckdb

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO / "src"))

from votes_es import __version__, SCHEMA_VERSION  # noqa: E402
from votes_es.config import (  # noqa: E402
    PUBLISH_VOTE_SOURCES, SILVER_DIR)
from votes_es.quality.checks import run_checks  # noqa: E402
from votes_es.storage.gold import build_gold  # noqa: E402
from votes_es.storage.schemas import SILVER_SCHEMAS  # noqa: E402

CANONICAL_DIR = REPO / "data" / "canonical"


def _sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _q(con, sql, params=None):
    cur = con.execute(sql, params or [])
    return cur.fetchall()


def main() -> int:
    run_id = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    gen = REPO / "dist" / "generations" / run_id
    gen.mkdir(parents=True)

    # ---- gated gold build ------------------------------------------------
    gold = build_gold(silver_dir=SILVER_DIR,
                      out_path=gen / "gold" / "votes.duckdb")

    con = duckdb.connect(str(gold), read_only=True)
    counts = {k: _q(con, f"SELECT count(*) FROM {k}")[0][0]
              for k in ("votes", "meetings", "proposals", "issuers",
                        "reporters", "reporting_units", "observations")}
    source_rows = {r[0]: r[1] for r in _q(
        con, "SELECT source_id, count(*) FROM votes GROUP BY 1")}
    manifest_check = _q(con, """
        SELECT count(*) FROM votes v JOIN sources s USING(source_id)
        WHERE s.reuse_status <> 'OPEN_REUSE_CONFIRMED'""")[0][0]
    gate_ok = manifest_check == 0
    cutoffs = {r[0]: str(r[1]) for r in _q(con, """
        SELECT source_id, max(COALESCE(published_at, retrieved_at))
        FROM observations GROUP BY 1""")}
    split = _q(con, "SELECT count(*) FROM votes WHERE is_split")[0][0]
    ambiguous = _q(con, "SELECT count(*) FROM votes WHERE "
                        "review_status='AMBIGUOUS'")[0][0]
    unresolved_issuers = _q(con, "SELECT count(*) FROM issuers WHERE "
                                 "NOT in_universe")[0][0]
    dissent = _q(con, "SELECT count(*) FROM votes WHERE against_management")[0][0]
    con.close()

    # ---- gated parquets (release assets) ---------------------------------
    parquet_dir = gen / "parquets"
    parquet_dir.mkdir()
    con = duckdb.connect()
    for name in SILVER_SCHEMAS:
        p = SILVER_DIR / f"{name}.parquet"
        if not p.exists():
            continue
        where = ""
        if name == "votes" and PUBLISH_VOTE_SOURCES:
            allowed = ", ".join(f"'{s}'" for s in PUBLISH_VOTE_SOURCES)
            where = f" WHERE source_id IN ({allowed})"
        con.execute(
            f"COPY (SELECT * FROM '{p.as_posix()}'{where}) "
            f"TO '{(parquet_dir / f'{name}.parquet').as_posix()}' "
            "(FORMAT PARQUET, COMPRESSION ZSTD)")
    # canonical v2 artifacts: derived, source-agnostic — shipped whole
    for name in ("official_agenda_items", "canonical_proposals",
                 "proposal_anchor_links"):
        p = CANONICAL_DIR / f"{name}.parquet"
        if p.exists():
            con.execute(
                f"COPY (SELECT * FROM '{p.as_posix()}') "
                f"TO '{(parquet_dir / f'{name}.parquet').as_posix()}' "
                "(FORMAT PARQUET, COMPRESSION ZSTD)")
    con.close()

    # ---- QA --------------------------------------------------------------
    checks = run_checks(SILVER_DIR)
    quality = {
        "silver_checks": [{"check": c.name, "status": c.status,
                           "detail": c.detail} for c in checks],
        "publication_gate": {
            "enabled_sources": list(PUBLISH_VOTE_SOURCES),
            "restricted_source_rows_in_gold": manifest_check,
            "status": "PASS" if gate_ok else "FAIL"},
    }
    fails = [c for c in checks if c.status == "FAIL"]
    (gen / "quality.json").write_text(json.dumps(quality, indent=2),
                                      encoding="utf-8")
    if fails or not gate_ok:
        print("RELEASE FAILED — generation rejected:", gen)
        for c in fails:
            print("  FAIL", c.name, c.detail)
        if not gate_ok:
            print(f"  FAIL publication_gate {manifest_check} restricted rows")
        return 1

    # ---- coverage --------------------------------------------------------
    coverage = {
        "counts": counts,
        "votes_by_source": source_rows,
        "split_components": split,
        "ambiguous_votes": ambiguous,
        "unresolved_issuers": unresolved_issuers,
        "dissent_votes": dissent,
    }
    (gen / "coverage.json").write_text(json.dumps(coverage, indent=2),
                                       encoding="utf-8")

    # ---- manifest --------------------------------------------------------
    commit = subprocess.run(["git", "rev-parse", "HEAD"], cwd=REPO,
                            capture_output=True, text=True).stdout.strip()
    manifest = {
        "dataset_version": run_id,
        "schema_version": SCHEMA_VERSION,
        "software_version": __version__,
        "software_commit": commit,
        "created_at": datetime.now(UTC).isoformat(),
        "counts": counts,
        "source_cutoffs": cutoffs,
        "publication_vote_sources": list(PUBLISH_VOTE_SOURCES),
        "canonical": {
            "official_agenda_items": "official_agenda_items.parquet"
                if (parquet_dir / "official_agenda_items.parquet").exists()
                else None,
            "has_canonical_layer": (parquet_dir
                                    / "canonical_proposals.parquet")
                .exists(),
        },
        "vds_vote_rows_published": not PUBLISH_VOTE_SOURCES
        or any("iss_vds" in s for s in PUBLISH_VOTE_SOURCES),
        "quality_status": "PASS",
        "season_note": ("N-PX 2026 ingested through SEC index cutoff; late "
                        "filings/amendments may follow in refresh runs."),
    }
    (gen / "manifest.json").write_text(json.dumps(manifest, indent=2),
                                       encoding="utf-8")

    # ---- checksums over every artifact -----------------------------------
    sums = []
    for p in sorted(gen.rglob("*")):
        if p.is_file() and p.name != "SHA256SUMS":
            sums.append(f"{_sha256(p)}  {p.relative_to(gen).as_posix()}")
    (gen / "SHA256SUMS").write_text("\n".join(sums) + "\n", encoding="utf-8")

    # ---- CURRENT pointer (file; VPS switches with a symlink) -------------
    (REPO / "dist" / "CURRENT").write_text(run_id, encoding="utf-8")

    size = sum(f.stat().st_size for f in gen.rglob("*") if f.is_file())
    print(f"generation {run_id}: {counts['votes']:,} votes, "
          f"{size / 1e6:.0f} MB, quality PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
