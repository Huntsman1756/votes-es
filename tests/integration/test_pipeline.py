"""End-to-end on fixtures: universe → ingest → bronze → silver → gold.

Runs fully offline with a seed-only universe (no OpenInstrument dependency).
"""
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


def _seed_universe(path: Path) -> None:
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


def _make_filing_dir(tmp: Path, xml: str, manifest: dict) -> Path:
    d = tmp / "filing"
    d.mkdir(parents=True, exist_ok=True)
    shutil.copy(xml, d / "proxytable.xml")
    (d / "manifest.json").write_text(json.dumps(manifest))
    return d


def test_end_to_end(env):
    from votes_es.pipeline.ingest import ingest_npx_dir, ingest_vds_capture
    from votes_es.pipeline.silver import build_silver

    uni = env / "reference" / "universe.parquet"
    _seed_universe(uni)

    # N-PX fund filing (default-ns fixture)
    d = _make_filing_dir(env, str(FIX / "npx" / "fund_default_ns.xml"), {
        "accession": "0001104659-26-101952", "cik": "857489",
        "reporting_person": "VANGUARD INTERNATIONAL EQUITY INDEX FUNDS",
        "report_type": "FUND VOTING REPORT", "period_of_report": "2026-06-30"})
    run = ingest_npx_dir(d)
    assert run.status == "OK" and run.records_parsed == 6

    # VDS capture (BBVA × Iberdrola)
    run = ingest_vds_capture(
        "iss_vds:bbva-am",
        meetings_path=FIX / "vds" / "meetings.json",
        votes_paths=[FIX / "vds" / "votes_iberdrola_bbva.json"],
        retrieved_at=datetime(2026, 10, 6, tzinfo=UTC))
    assert run.status == "OK" and run.records_parsed == 23

    stats = build_silver(uni, env / "silver", use_oi=False)
    assert stats.unresolved == 0
    assert stats.votes == 29                      # 6 npx + 23 vds
    assert stats.meetings == 3                    # Santander, Ferrovial,
    # Iberdrola (VDS + N-PX merge on issuer+date)
    # Ferrovial appears in the npx fixture via NL ISIN
    issuers = pq.read_table(env / "silver" / "issuers.parquet").to_pylist()
    fer = [i for i in issuers if i["canonical_name"] == "Ferrovial"]
    assert fer and fer[0]["lei"] == "72450022R2ZFL41Y6I04"

    votes = pq.read_table(env / "silver" / "votes.parquet").to_pylist()
    ibe = [v for v in votes if v["source_id"].startswith("iss_vds")]
    assert all(v["direction"] == "FOR" for v in ibe)
    assert all(v["against_management"] is False for v in ibe)
    npx = [v for v in votes if v["source_id"] == "sec_npx"]
    assert all(v["shares_voted"] is not None for v in npx)

    # proposals were clustered per meeting; provenance present
    obs = pq.read_table(env / "silver" / "observations.parquet").to_pylist()
    assert len(obs) >= 2
    assert all(o["parser_version"] for o in obs)

    # gold build + validation
    import votes_es.quality.checks as qc
    from votes_es.storage import gold
    db = gold.build_gold(env / "silver", env / "gold" / "votes.duckdb")
    assert db.exists()
    monkeypatch = pytest.MonkeyPatch()
    monkeypatch.setattr(qc, "SILVER_DIR", env / "silver")
    checks = qc.run_checks(env / "silver")
    fails = [c for c in checks if c.status == "FAIL"]
    assert not fails, fails
