"""Shared integration fixtures: temp bronze + seed universe + built gold."""
import json
import shutil
from datetime import UTC, datetime
from pathlib import Path

import pyarrow.parquet as pq
import pytest

FIX = Path(__file__).parent.parent.parent / "fixtures"


@pytest.fixture()
def env(tmp_path, monkeypatch):
    """Redirect all writable dirs to tmp."""
    import votes_es.config as cfg
    import votes_es.pipeline.ingest as ing
    import votes_es.storage.bronze as bz

    bronze_dir = tmp_path / "bronze"
    monkeypatch.setattr(cfg, "BRONZE_DIR", bronze_dir)
    monkeypatch.setattr(cfg, "RAW_DIR", tmp_path / "raw")
    monkeypatch.setattr(bz, "BRONZE_DIR", bronze_dir)
    monkeypatch.setattr(bz, "RAW_DIR", tmp_path / "raw")
    monkeypatch.setattr(ing, "RAW_DIR", tmp_path / "raw")
    return tmp_path


def seed_universe(path: Path) -> None:
    import pyarrow as pa

    from votes_es import ids
    from votes_es.identity.universe import UNIVERSE_SCHEMA
    from votes_es.normalization.text import normalize_issuer_name
    rows = []
    for isin, name, lei in [
        ("ES0144580Y14", "Iberdrola", "5QK37QC7NWOJ8D7WVQ45"),
        ("ES0113900J37", "Banco Santander", "5493006QMFDDMYWIAM13"),
        ("NL0015001FS8", "Ferrovial", "72450022R2ZFL41Y6I04"),
        ("ES0132105018", "Acerinox", ""),
        ("ES0125220311", "Acciona", ""),
    ]:
        rows.append({
            "issuer_id": ids.issuer_id(lei or None, isin),
            "canonical_name": name, "country": isin[:2],
            "lei": lei or None, "isin": isin, "ticker": None,
            "universe_basis": "SEED",
            "alias_normalized": normalize_issuer_name(name),
        })
    path.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(pa.Table.from_pylist(rows, schema=UNIVERSE_SCHEMA), path)


def make_filing_dir(tmp: Path, xml: str, manifest: dict) -> Path:
    d = tmp / "filing"
    d.mkdir(parents=True, exist_ok=True)
    shutil.copy(xml, d / "proxytable.xml")
    (d / "manifest.json").write_text(json.dumps(manifest))
    return d


@pytest.fixture()
def built_env(env):
    """Ingest fixtures -> silver. Returns (env_path, stats)."""
    from votes_es.pipeline.ingest import ingest_npx_dir, ingest_vds_capture
    from votes_es.pipeline.silver import build_silver

    uni = env / "reference" / "universe.parquet"
    seed_universe(uni)
    d = make_filing_dir(env, str(FIX / "npx" / "fund_default_ns.xml"), {
        "accession": "0001104659-26-101952", "cik": "857489",
        "reporting_person": "VANGUARD INTERNATIONAL EQUITY INDEX FUNDS",
        "report_type": "FUND VOTING REPORT", "period_of_report": "2026-06-30"})
    assert ingest_npx_dir(d).status == "OK"
    assert ingest_vds_capture(
        "iss_vds:bbva-am",
        meetings_path=FIX / "vds" / "meetings.json",
        votes_paths=[FIX / "vds" / "votes_iberdrola_bbva.json"],
        retrieved_at=datetime(2026, 10, 6, tzinfo=UTC)).status == "OK"
    stats = build_silver(uni, env / "silver", use_oi=False)
    return env, stats


@pytest.fixture()
def built_gold(built_env):
    """built_env + DuckDB gold. Returns duckdb path."""
    from votes_es.storage import gold
    env, _ = built_env
    return gold.build_gold(env / "silver", env / "gold" / "votes.duckdb")
