from votes_es.domain.enums import MgmtRecommendation, VoteDirection
from votes_es.normalization.votes import (
    compute_against_management,
    normalize_direction,
    normalize_mgmt_rec,
)


def test_direction_canonical():
    assert normalize_direction("FOR") == VoteDirection.FOR
    assert normalize_direction("for") == VoteDirection.FOR
    assert normalize_direction("Against") == VoteDirection.AGAINST
    assert normalize_direction("ABSTAIN") == VoteDirection.ABSTAIN
    assert normalize_direction("Withhold") == VoteDirection.WITHHOLD
    assert normalize_direction("Do Not Vote") == VoteDirection.DO_NOT_VOTE


def test_direction_frequency_votes():
    # say-on-pay frequency answers are real data, not parse errors → OTHER
    for raw in ("1 YEAR", "ONE YEAR", "2 YEARS", "THREE YEARS", "3.0"):
        assert normalize_direction(raw) == VoteDirection.OTHER


def test_direction_unknown_and_empty():
    assert normalize_direction("") == VoteDirection.UNKNOWN
    assert normalize_direction(None) == VoteDirection.UNKNOWN
    assert normalize_direction("SOME FUTURE VALUE") == VoteDirection.OTHER


def test_mgmt_rec():
    assert normalize_mgmt_rec("For") == MgmtRecommendation.FOR
    assert normalize_mgmt_rec("") is None
    assert normalize_mgmt_rec(None) is None
    assert normalize_mgmt_rec("NONE") == MgmtRecommendation.NONE


def test_against_management_semantics():
    assert compute_against_management(VoteDirection.AGAINST,
                                      MgmtRecommendation.FOR) is True
    assert compute_against_management(VoteDirection.FOR,
                                      MgmtRecommendation.FOR) is False
    assert compute_against_management(VoteDirection.WITHHOLD,
                                      MgmtRecommendation.FOR) is True
    # missing/unclear sides → NULL, never False
    assert compute_against_management(VoteDirection.FOR, None) is None
    assert compute_against_management(VoteDirection.OTHER,
                                      MgmtRecommendation.FOR) is None
    assert compute_against_management(VoteDirection.DO_NOT_VOTE,
                                      MgmtRecommendation.FOR) is None
