"""Golden: real-derived N-PX vote-table fixtures, both namespace variants."""
from pathlib import Path

from votes_es.sources.sec_npx.filing import is_fund_report, parse_primary_doc, season_of
from votes_es.sources.sec_npx.parser import parse_file

FIX = Path(__file__).parent.parent.parent / "fixtures" / "npx"


def test_fund_default_namespace():
    tables = list(parse_file(FIX / "fund_default_ns.xml"))
    assert len(tables) == 6                  # 2 proposals × Santander/Ferrovial/Iberdrola
    t = tables[0]
    assert t.isin == "ES0113900J37"          # Santander
    assert t.cusip == "E19790109"
    assert t.meeting_date_raw == "03/26/2026"
    assert t.categories == ["CORPORATE GOVERNANCE"]
    assert t.vote_series == "S000022482"
    assert t.vote_records[0].how_voted_raw == "FOR"
    assert t.vote_records[0].management_recommendation_raw == "FOR"


def test_fund_inf_namespace():
    tables = list(parse_file(FIX / "fund_inf_ns.xml"))
    assert len(tables) == 4
    t = tables[0]
    assert t.issuer_name_raw == "BANCO SANTANDER SA"
    assert t.other_managers == ["21"]
    assert t.vote_records and t.vote_records[0].shares_voted_raw == "3220604"


def test_foreign_isin_issuer_present():
    """Ferrovial (NL ISIN) must survive parsing — the ES-prefix failure mode."""
    isins = {t.isin for t in parse_file(FIX / "fund_default_ns.xml")}
    assert "NL0015001FS8" in isins


def test_manager_14a_fixture():
    tables = list(parse_file(FIX / "manager_14a.xml"))
    assert len(tables) == 42                       # Kingdon IM report, all 14A
    assert all("SECTION 14A" in c for t in tables for c in t.categories)


def test_primary_doc_meta():
    meta = parse_primary_doc(FIX / "primary_doc.xml",
                             accession="0001000097-26-000008", cik="1000097")
    assert meta.report_type == "INSTITUTIONAL MANAGER VOTING REPORT"
    assert meta.reporting_person == "KINGDON CAPITAL MANAGEMENT, L.L.C."
    assert meta.reporting_person_lei == "9EV9M07GEQXRWF831Q10"
    assert season_of(meta) == 2026
    assert not is_fund_report(meta)
