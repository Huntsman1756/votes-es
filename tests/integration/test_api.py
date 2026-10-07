"""API contract tests against the integration-built gold DuckDB."""
import warnings

warnings.filterwarnings("ignore")

import pytest

from fastapi.testclient import TestClient


@pytest.fixture()
def client(built_gold):
    from votes_es.api.app import app
    app.state.db_path = str(built_gold)
    with TestClient(app) as c:
        yield c


def test_status(client):
    r = client.get("/api/v1/status").json()
    assert r["votes"] > 0 and "disclaimer" in r


def test_issuers_search(client):
    iss = client.get("/api/v1/issuers", params={"q": "Iberdrola"}).json()["issuers"]
    assert iss and iss[0]["reporters"] >= 2


def test_meeting_pivot_and_provenance(client):
    iss = client.get("/api/v1/issuers", params={"q": "Iberdrola"}).json()["issuers"]
    mid = client.get(f"/api/v1/issuers/{iss[0]['issuer_id']}/meetings").json()["meetings"][0]["meeting_id"]
    pivot = client.get(f"/api/v1/meetings/{mid}/votes?pivot=true").json()["pivot"]
    assert {p["reporter_group"] for p in pivot}
    votes = client.get(f"/api/v1/meetings/{mid}/votes").json()["votes"]
    assert all("source_id" in v for v in votes)


def test_compare_intersection_only(client):
    r = client.get("/api/v1/compare/reporters",
                   params={"a": "BBVA", "b": "Vanguard"}).json()
    assert r["common_disclosed_proposals"] > 0
    assert r["observed_agreement"] is not None
    assert "caveat" in r


def test_sources_reuse_status(client):
    srcs = client.get("/api/v1/sources").json()["sources"]
    vds = [s for s in srcs if s["source_type"] == "ISS_VDS"]
    assert all(s["reuse_status"] == "BLOCKED_PENDING_WRITTEN_PERMISSION"
               for s in vds)
    assert all(s["extraction_terms"] == "PROHIBITED_BY_TERMS" for s in vds)
