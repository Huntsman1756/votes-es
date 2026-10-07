"""Publication gate: local gold may hold MAPFRE; the public build must not.

Covers the G8-C contract — `VOTES_PUBLISH_VOTE_SOURCES=sec_npx` keeps the
current public dataset unchanged while the local build carries mapfre_am.
"""
from pathlib import Path

import pytest


def _silver_has_mapfre(silver_dir: Path) -> bool:
    import pyarrow.parquet as pq
    p = silver_dir / "votes.parquet"
    if not p.exists():
        return False
    src = set(pq.read_table(p, columns=["source_id"])
              .column("source_id").unique().to_pylist())
    return "mapfre_am" in src


def test_gold_filters_by_publish_sources(tmp_path, monkeypatch):
    """Gold build honors PUBLISH_VOTE_SOURCES: restricted rows excluded."""
    import duckdb

    from votes_es.config import SILVER_DIR
    from votes_es.storage import gold

    if not _silver_has_mapfre(SILVER_DIR):
        pytest.skip("mapfre bronze not ingested in this checkout")

    monkeypatch.setattr(gold, "PUBLISH_VOTE_SOURCES", ["sec_npx"])
    db = gold.build_gold(SILVER_DIR, tmp_path / "votes.duckdb")
    con = duckdb.connect(str(db), read_only=True)
    rows = con.execute(
        "SELECT source_id, count(*) FROM votes GROUP BY 1").fetchall()
    assert dict(rows) == {"sec_npx": dict(rows)["sec_npx"]}
    assert set(dict(rows)) == {"sec_npx"}
    # sources metadata stays visible even when rows are gated
    srcs = {r[0] for r in con.execute("SELECT source_id FROM sources").fetchall()}
    assert "mapfre_am" in srcs
    assert "iss_vds:caixabank-am" in srcs
    con.close()


def test_mapfre_present_when_enabled(tmp_path, monkeypatch):
    """VOTES_PUBLISH_VOTE_SOURCES=sec_npx,mapfre_am opens rows without code."""
    import duckdb

    from votes_es.config import SILVER_DIR
    from votes_es.storage import gold

    if not _silver_has_mapfre(SILVER_DIR):
        pytest.skip("mapfre bronze not ingested in this checkout")

    monkeypatch.setattr(gold, "PUBLISH_VOTE_SOURCES", ["sec_npx", "mapfre_am"])
    db = gold.build_gold(SILVER_DIR, tmp_path / "votes.duckdb")
    con = duckdb.connect(str(db), read_only=True)
    n = con.execute(
        "SELECT count(*) FROM votes WHERE source_id='mapfre_am'").fetchone()[0]
    assert n > 0
    con.close()


def test_registry_access_model():
    """The four reuse questions are populated — not a single flag."""
    from votes_es.domain.enums import ExtractionTerms, PublicationStatus
    from votes_es.sources.registry import SOURCES

    vds = SOURCES["iss_vds:caixabank-am"]
    assert vds.extraction_terms == ExtractionTerms.PROHIBITED_BY_TERMS
    assert vds.publication_status == PublicationStatus.PERMISSION_REQUIRED
    m = SOURCES["mapfre_am"]
    assert m.publication_status == PublicationStatus.PERMISSION_REQUIRED
    assert m.technical_access.value == "PUBLIC_DOCUMENT"
