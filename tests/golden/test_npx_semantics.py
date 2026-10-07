"""Golden semantics tests — N-PX Item 1(l) alignment flag, split votes,
amendment materialization, joint reporting. All offline."""
import json
import shutil
from pathlib import Path

import pyarrow.parquet as pq

from votes_es.domain.enums import (
    MgmtAlignment,
    MgmtRecommendation,
    VoteDirection,
)
from votes_es.normalization.votes import (
    compute_against_management,
    derive_alignment,
    normalize_mgmt_alignment,
)
from votes_es.sources.sec_npx.filing import parse_primary_doc
from votes_es.sources.sec_npx.parser import parse_file

FIX = Path(__file__).parent.parent.parent / "fixtures" / "npx"


class TestAlignmentSemantics:
    """Item 1(l): `managementRecommendation` = did the vote go with/against
    management's recommendation — NOT the recommendation direction."""

    def test_against_vote_aligned_is_not_dissent(self):
        # vote AGAINST + field AGAINST → filer opposed mgmt's rec (which was FOR)
        assert compute_against_management(
            VoteDirection.AGAINST,
            alignment=normalize_mgmt_alignment("AGAINST"),
            source_id="sec_npx") is True

    def test_for_vote_aligned(self):
        assert compute_against_management(
            VoteDirection.FOR,
            alignment=normalize_mgmt_alignment("FOR"),
            source_id="sec_npx") is False

    def test_against_vote_following_mgmt(self):
        # vote AGAINST + field FOR → filer followed mgmt's AGAINST rec
        assert compute_against_management(
            VoteDirection.AGAINST,
            alignment=normalize_mgmt_alignment("FOR"),
            source_id="sec_npx") is False

    def test_none_means_no_recommendation(self):
        assert normalize_mgmt_alignment("NONE") == MgmtAlignment.NONE
        assert compute_against_management(
            VoteDirection.WITHHOLD,
            alignment=normalize_mgmt_alignment("NONE"),
            source_id="sec_npx") is None

    def test_absent_field_is_null_alignment(self):
        assert normalize_mgmt_alignment(None) is None
        assert compute_against_management(
            VoteDirection.FOR, alignment=None, source_id="sec_npx") is None

    def test_vds_direction_compare(self):
        assert compute_against_management(
            VoteDirection.FOR, mgmt=MgmtRecommendation.AGAINST,
            source_id="iss_vds:x") is True
        assert compute_against_management(
            VoteDirection.FOR, mgmt=MgmtRecommendation.FOR,
            source_id="iss_vds:x") is False

    def test_vds_derived_alignment(self):
        assert derive_alignment(VoteDirection.FOR, MgmtRecommendation.FOR) \
            == MgmtAlignment.FOR
        assert derive_alignment(VoteDirection.FOR, MgmtRecommendation.AGAINST) \
            == MgmtAlignment.AGAINST
        assert derive_alignment(VoteDirection.ABSTAIN, MgmtRecommendation.FOR) \
            == MgmtAlignment.AGAINST
        assert derive_alignment(VoteDirection.FOR, None) is None


class TestSemanticsFixture:
    def test_parse(self):
        tables = list(parse_file(FIX / "semantics.xml"))
        assert len(tables) == 7
        split = tables[4]
        assert len(split.vote_records) == 2
        assert {v.how_voted_raw for v in split.vote_records} == {"FOR", "AGAINST"}
        joint = tables[5]
        assert joint.other_managers == ["1", "2"]
        no_ids = tables[6]
        assert no_ids.isin is None and no_ids.figi is None

    def test_end_to_end_semantics(self, tmp_path, monkeypatch):
        import votes_es.config as cfg
        import votes_es.pipeline.ingest as ing
        import votes_es.storage.bronze as bz
        monkeypatch.setattr(cfg, "BRONZE_DIR", tmp_path / "bronze")
        monkeypatch.setattr(cfg, "RAW_DIR", tmp_path / "raw")
        monkeypatch.setattr(bz, "BRONZE_DIR", tmp_path / "bronze")
        monkeypatch.setattr(bz, "RAW_DIR", tmp_path / "raw")
        monkeypatch.setattr(ing, "RAW_DIR", tmp_path / "raw")

        from tests.integration.conftest import seed_universe, make_filing_dir
        from votes_es.pipeline.ingest import ingest_npx_dir
        from votes_es.pipeline.silver import build_silver

        uni = tmp_path / "reference" / "universe.parquet"
        seed_universe(uni)
        d = make_filing_dir(tmp_path, str(FIX / "semantics.xml"), {
            "accession": "0000000000-26-000001", "cik": "999999",
            "reporting_person": "SEMANTIC TEST FUND",
            "report_type": "FUND VOTING REPORT",
            "period_of_report": "2026-06-30"})
        run = ingest_npx_dir(d)
        assert run.status == "OK"
        stats = build_silver(uni, tmp_path / "silver", use_oi=False)
        votes = pq.read_table(tmp_path / "silver" / "votes.parquet").to_pylist()

        by_title = {v["proposal_id"]: v for v in votes}
        props = {p["proposal_id"]: p["proposal_title_normalized"]
                 for p in pq.read_table(
                     tmp_path / "silver" / "proposals.parquet").to_pylist()}

        def find(sub):
            for pid, title in props.items():
                if sub in title:
                    return by_title[pid]
            raise AssertionError(f"proposal '{sub}' not found")

        # aligned AGAINST vote → NOT dissent (previously inverted!)
        v1 = find("consolidated annual accounts")
        assert v1["direction"] == "AGAINST"
        assert v1["management_alignment"] == "AGAINST"
        assert v1["against_management"] is True
        assert v1["management_recommendation"] is None   # never fabricated

        # FOR vote against mgmt rec → dissent
        v2 = find("remuneration report")
        assert v2["against_management"] is True

        # AGAINST vote following mgmt AGAINST rec → NOT dissent
        v3 = find("transition plan")
        assert v3["direction"] == "AGAINST"
        assert v3["management_alignment"] == "FOR"
        assert v3["against_management"] is False

        # NONE → alignment NONE, dissent NULL
        v4 = find("contested director")
        assert v4["management_alignment"] == "NONE"
        assert v4["against_management"] is None

        # split vote: two components, both flagged
        splits = [v for v in votes if "elect director" in props[v["proposal_id"]]]
        assert len(splits) == 2
        assert all(v["is_split"] for v in splits)
        assert {v["direction"] for v in splits} == {"FOR", "AGAINST"}
        assert {v["shares_voted"] for v in splits} == {1500, 1000}

        # joint reporting refs preserved
        v6 = find("remuneration policy")
        assert v6["voting_managers"] == "1|2"

        # frequency → OTHER; no identifiers → out of universe entirely
        # (CUSIP-only US-style row; seed universe has no match → dropped)


class TestAmendments:
    def test_amendment_parsing(self):
        m = parse_primary_doc(FIX / "primary_doc_amendment_restatement.xml",
                              accession="0000000000-26-000100")
        assert m.submission_type == "N-PX/A"
        assert m.amendment_no == 1
        assert m.amendment_type == "RESTATEMENT"
        assert len(m.other_included_managers) == 2
        assert m.other_included_managers[0]["number"] == "1"

        m2 = parse_primary_doc(FIX / "primary_doc_amendment_additive.xml",
                               accession="0000000000-26-000200")
        assert m2.amendment_type == "ADDS_NEW_PROXY_VOTING_ENTRIES"

    def test_restatement_supersedes(self, tmp_path, monkeypatch):
        """Original + RESTATEMENT: only restatement rows are effective."""
        import votes_es.config as cfg
        import votes_es.pipeline.ingest as ing
        import votes_es.storage.bronze as bz
        monkeypatch.setattr(cfg, "BRONZE_DIR", tmp_path / "bronze")
        monkeypatch.setattr(cfg, "RAW_DIR", tmp_path / "raw")
        monkeypatch.setattr(bz, "BRONZE_DIR", tmp_path / "bronze")
        monkeypatch.setattr(bz, "RAW_DIR", tmp_path / "raw")
        monkeypatch.setattr(ing, "RAW_DIR", tmp_path / "raw")

        from tests.integration.conftest import seed_universe, make_filing_dir
        from votes_es.pipeline.ingest import ingest_npx_dir
        from votes_es.pipeline.silver import build_silver

        uni = tmp_path / "reference" / "universe.parquet"
        seed_universe(uni)

        # original filing (only fund_default_ns content, Iberdrola meeting)
        d1 = make_filing_dir(tmp_path / "f1", str(FIX / "fund_default_ns.xml"), {
            "accession": "0000000000-26-000001", "cik": "857489",
            "reporting_person": "AMEND TEST FUND", "submission_type": "N-PX",
            "report_type": "FUND VOTING REPORT",
            "period_of_report": "2026-06-30"})
        assert ingest_npx_dir(d1).status == "OK"

        # restatement — same filer+period, different accession
        xml2 = tmp_path / "restated.xml"
        shutil.copy(FIX / "semantics.xml", xml2)
        d2 = tmp_path / "f2"
        d2.mkdir()
        shutil.copy(xml2, d2 / "proxytable.xml")
        (d2 / "manifest.json").write_text(json.dumps({
            "accession": "0000000000-26-000099", "cik": "857489",
            "reporting_person": "AMEND TEST FUND", "submission_type": "N-PX/A",
            "report_type": "FUND VOTING REPORT", "period_of_report": "2026-06-30",
            "amendment_no": 1, "amendment_type": "RESTATEMENT"}))
        assert ingest_npx_dir(d2).status == "OK"

        stats = build_silver(uni, tmp_path / "silver", use_oi=False)
        filings = pq.read_table(tmp_path / "silver" / "npx_filings.parquet").to_pylist()
        states = {f["accession"]: f["materialization"] for f in filings}
        assert states["0000000000-26-000001"] == "SUPERSEDED"
        assert states["0000000000-26-000099"] == "EFFECTIVE"

        # only restatement rows materialized
        obs = {o["accession"] for o in
               pq.read_table(tmp_path / "silver" / "observations.parquet").to_pylist()}
        votes = pq.read_table(tmp_path / "silver" / "votes.parquet").to_pylist()
        assert votes, "restatement produced no votes"
        for v in votes:
            o = [x for x in pq.read_table(
                tmp_path / "silver" / "observations.parquet").to_pylist()
                if x["observation_id"] == v["source_observation_id"]][0]
            assert o["accession"] == "0000000000-26-000099"

    def test_additive_keeps_both(self, tmp_path, monkeypatch):
        """Original + ADDS_NEW_PROXY_VOTING_ENTRIES: both effective."""
        import votes_es.config as cfg
        import votes_es.pipeline.ingest as ing
        import votes_es.storage.bronze as bz
        monkeypatch.setattr(cfg, "BRONZE_DIR", tmp_path / "bronze")
        monkeypatch.setattr(cfg, "RAW_DIR", tmp_path / "raw")
        monkeypatch.setattr(bz, "BRONZE_DIR", tmp_path / "bronze")
        monkeypatch.setattr(bz, "RAW_DIR", tmp_path / "raw")
        monkeypatch.setattr(ing, "RAW_DIR", tmp_path / "raw")

        from tests.integration.conftest import seed_universe, make_filing_dir
        from votes_es.pipeline.ingest import ingest_npx_dir
        from votes_es.pipeline.silver import build_silver

        uni = tmp_path / "reference" / "universe.parquet"
        seed_universe(uni)
        d1 = make_filing_dir(tmp_path / "f1", str(FIX / "fund_default_ns.xml"), {
            "accession": "0000000000-26-000001", "cik": "857489",
            "reporting_person": "AMEND TEST FUND", "submission_type": "N-PX",
            "report_type": "FUND VOTING REPORT",
            "period_of_report": "2026-06-30"})
        d2 = tmp_path / "f2"
        d2.mkdir()
        shutil.copy(FIX / "semantics.xml", d2 / "proxytable.xml")
        (d2 / "manifest.json").write_text(json.dumps({
            "accession": "0000000000-26-000099", "cik": "857489",
            "reporting_person": "AMEND TEST FUND", "submission_type": "N-PX/A",
            "report_type": "FUND VOTING REPORT", "period_of_report": "2026-06-30",
            "amendment_no": 1,
            "amendment_type": "ADDS_NEW_PROXY_VOTING_ENTRIES"}))
        assert ingest_npx_dir(d1).status == "OK"
        assert ingest_npx_dir(d2).status == "OK"
        build_silver(uni, tmp_path / "silver", use_oi=False)
        filings = pq.read_table(tmp_path / "silver" / "npx_filings.parquet").to_pylist()
        assert all(f["materialization"] == "EFFECTIVE" for f in filings)
        votes = pq.read_table(tmp_path / "silver" / "votes.parquet")
        assert votes.num_rows >= 10     # both filings' rows present


class TestReportTypes:
    def test_notice_report_is_clean_zero_row_ingest(self, tmp_path, monkeypatch):
        import votes_es.config as cfg
        import votes_es.storage.bronze as bz
        monkeypatch.setattr(cfg, "BRONZE_DIR", tmp_path / "bronze")
        monkeypatch.setattr(cfg, "RAW_DIR", tmp_path / "raw")
        monkeypatch.setattr(bz, "BRONZE_DIR", tmp_path / "bronze")
        monkeypatch.setattr(bz, "RAW_DIR", tmp_path / "raw")

        from votes_es.pipeline.ingest import ingest_npx_dir
        d = tmp_path / "notice"
        d.mkdir()
        shutil.copy(FIX / "primary_doc_notice.xml", d / "primary_doc.xml")
        run = ingest_npx_dir(d)
        assert run.status == "OK" and run.records_parsed == 0
        filings = bz.load_filings("sec_npx")
        assert filings and filings[0]["report_type"] == "NOTICE REPORT"
