"""Golden tests for the MAPFRE PDF adapter — synthetic fixture only.

The fixture reproduces every hard layout case found in the real 2023-2025
annexes: wrapped proposals, bundled director sub-items, a vertically
-centred item marker, a Non-Voting item, a blank vote on a votable item,
a page break mid-row, and a header-bleed artifact that must quarantine.
"""
from pathlib import Path

import pytest

from votes_es.sources.mapfre_am.parser import parse_pdf
from votes_es.sources.mapfre_am.normalization import (
    mapfre_against,
    mapfre_alignment,
    mapfre_direction,
    mapfre_mgmt,
    parse_mapfre_date,
)
from votes_es.domain.enums import MgmtAlignment, MgmtRecommendation, VoteDirection

FIXTURE = Path(__file__).resolve().parents[2] / "fixtures" / "mapfre" / \
    "vote_summary_sample.pdf"


@pytest.fixture(scope="module")
def rows():
    data, stats = parse_pdf(FIXTURE)
    assert stats.meetings == 2
    assert stats.quarantined == 1
    return {r.item_raw + "|" + r.company_raw: r for r in data}


def _get(rows, item, company):
    return rows[item + "|" + company]


def test_wrapped_proposal_joins(rows):
    r = _get(rows, "1.", "IBERDROLA SA")
    assert r.proposal_text_raw == "ANNUAL FINANCIAL STATEMENTS 2024"
    assert r.vote_raw == "For" and r.management_recommendation_raw == "For"
    assert r.for_against_raw == "For"


def test_director_sub_items(rows):
    a = _get(rows, "2.1", "IBERDROLA SA")
    b = _get(rows, "2.2", "IBERDROLA SA")
    assert a.parent_item_raw == "2." and b.parent_item_raw == "2."
    assert "ANA COLONQUES" in a.proposal_text_raw
    assert "JUAN GONZALEZ" in b.proposal_text_raw
    assert b.for_against_raw == "Against"


def test_marker_offset_merge(rows):
    # 2023-print pattern: proposal+vote on one line, marker+proposer+mgmt
    # on the next — one logical row.
    r = _get(rows, "2.", "MERLIN PROPERTIES")
    assert r.proposal_text_raw == "REMUNERATION POLICY"
    assert r.proposed_by_raw == "Management"
    assert r.vote_raw == "Abstain"
    assert r.management_recommendation_raw == "For"
    assert r.for_against_raw == "Against"


def test_page_break_row(rows):
    r = _get(rows, "6.", "IBERDROLA SA")
    assert r.proposal_text_raw.endswith("UP TO 10 PERCENT")
    assert r.page == 1 and r.page_end == 2
    assert r.vote_raw == ""                     # blank vote on votable item


def test_non_voting_item(rows):
    r = _get(rows, "5.", "IBERDROLA SA")
    assert r.proposed_by_raw == "Non-Voting"


def test_header_bleed_quarantined(rows):
    r = _get(rows, "8.", "IBERDROLA SA")
    assert r.quarantined
    assert "non_vocabulary_cell_text" in r.quarantine_reason


def test_meeting_transition(rows):
    r = _get(rows, "3.", "MERLIN PROPERTIES")
    assert r.isin == "ES0105025003"
    assert r.meeting_date_raw == "28-Apr-2025"


def test_normalization_semantics(rows):
    # blank vote on votable item -> observed no-vote, never abstain
    assert mapfre_direction("", "Management") == VoteDirection.DO_NOT_VOTE
    assert mapfre_direction("", "Non-Voting") is None
    assert mapfre_direction("For", "Management") == VoteDirection.FOR
    # alignment: explicit column wins; derivation only when blank
    assert mapfre_alignment(VoteDirection.FOR, MgmtRecommendation.FOR,
                            "Against") == MgmtAlignment.AGAINST
    assert mapfre_alignment(VoteDirection.ABSTAIN, MgmtRecommendation.FOR,
                            None) == MgmtAlignment.AGAINST
    assert mapfre_against(VoteDirection.FOR, MgmtRecommendation.AGAINST,
                          MgmtAlignment.AGAINST) is True
    assert mapfre_against(VoteDirection.FOR, MgmtRecommendation.FOR,
                          MgmtAlignment.FOR) is False
    assert mapfre_against(VoteDirection.DO_NOT_VOTE, None, None) is None
    assert mapfre_mgmt("Withheld") == MgmtRecommendation.WITHHOLD


def test_date_parsing():
    assert parse_mapfre_date("30-May-2025").isoformat() == "2025-05-30"
    assert parse_mapfre_date("") is None
    assert parse_mapfre_date("garbage") is None
