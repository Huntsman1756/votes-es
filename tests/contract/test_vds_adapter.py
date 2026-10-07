"""Contract: VDS adapter against captured real payloads (BBVA × Iberdrola)."""
import json
from pathlib import Path

from votes_es.sources.iss_vds.adapter import (
    parse_funds,
    parse_meetings,
    parse_votes,
    votes_to_bronze,
)

FIX = Path(__file__).parent.parent.parent / "fixtures" / "vds"


def _load(name):
    return json.loads((FIX / name).read_text(encoding="utf-8"))


def test_funds():
    funds = parse_funds(_load("funds.json"))
    assert len(funds) == 3
    assert funds[0].fund_id == 67114
    assert funds[0].fund_family_id == 1211


def test_meetings():
    ms = parse_meetings(_load("meetings.json"))
    assert len(ms) == 1
    m = ms[0]
    assert m.meeting_id == 2055129
    assert m.isin == "ES0144580Y14"
    assert m.fund_ids == [59154]
    assert str(m.meeting_date) == "2026-05-29"


def test_votes_iberdrola_bbva():
    rows = parse_votes(_load("votes_iberdrola_bbva.json"))
    assert len(rows) == 23
    r0 = rows[0]
    assert r0.meeting_id == 2055129
    assert r0.fund_name == "BBVA DURB INTL EUROPEAN EQUITY FUND"
    assert r0.seq_number == 1
    assert r0.proposal_raw == "Approve Consolidated and Standalone Financial Statements"
    assert r0.client_vote_raw == "For"
    assert r0.mgt_rec_raw == "For"
    assert r0.item_on_agenda_id == 17969546
    assert r0.shareholder_proposal is False


def test_bronze_conversion():
    ms = parse_meetings(_load("meetings.json"))
    rows = parse_votes(_load("votes_iberdrola_bbva.json"))
    bronze, obs = votes_to_bronze(
        rows, source_id="iss_vds:bbva-am", reporter_key="bbva-am",
        meeting_row=ms[0], source_url="https://vds.issgovernance.com/vds/#/NzIxNg==")
    assert len(bronze) == 23
    b = bronze[0]
    assert b["isin"] == "ES0144580Y14"       # backfilled from meeting row
    assert b["reporter_key"] == "bbva-am"
    assert b["source_meeting_id"] == "2055129"
    assert b["fund_name_raw"] == "BBVA DURB INTL EUROPEAN EQUITY FUND"
    assert obs.source_id == "iss_vds:bbva-am"
    assert obs.content_hash
