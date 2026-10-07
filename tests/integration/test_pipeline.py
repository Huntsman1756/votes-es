"""End-to-end on fixtures: universe → ingest → bronze → silver → gold.

Runs fully offline with a seed-only universe (no OpenInstrument dependency).
"""
import pyarrow.parquet as pq
import pytest



def test_end_to_end(built_env):
    env, stats = built_env
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
