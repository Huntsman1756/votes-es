"""Vote-direction and management-recommendation normalization.

Raw values are always preserved by callers; this layer only produces the
canonical enum. Unknown non-empty values map to UNKNOWN/OTHER — never guessed.

N-PX wild values observed (SEC-CLI-SMOKE): FOR, AGAINST, ABSTAIN, WITHHOLD,
'1 YEAR', 'ONE YEAR', '2 YEARS', '3 YEARS', 'THREE YEARS', '1.0'..(say-on-pay
frequency) → OTHER.
VDS wild values: For, Against, Abstain, Withhold, 'Do Not Vote', '', 'None'.
"""
from __future__ import annotations

import re

from votes_es.domain.enums import MgmtRecommendation, VoteDirection

_WS = re.compile(r"\s+")


def _key(raw: str | None) -> str:
    return _WS.sub(" ", (raw or "").strip()).upper()


_DIRECTION_MAP = {
    "FOR": VoteDirection.FOR,
    "AGAINST": VoteDirection.AGAINST,
    "ABSTAIN": VoteDirection.ABSTAIN,
    "ABSTENTION": VoteDirection.ABSTAIN,
    "WITHHOLD": VoteDirection.WITHHOLD,
    "WITHHELD": VoteDirection.WITHHOLD,
    "DO NOT VOTE": VoteDirection.DO_NOT_VOTE,
    "DO_NOT_VOTE": VoteDirection.DO_NOT_VOTE,
    "DID NOT VOTE": VoteDirection.DO_NOT_VOTE,
    "NOT VOTED": VoteDirection.DO_NOT_VOTE,
    "NO VOTE": VoteDirection.DO_NOT_VOTE,
}

_MGMT_MAP = {
    "FOR": MgmtRecommendation.FOR,
    "AGAINST": MgmtRecommendation.AGAINST,
    "ABSTAIN": MgmtRecommendation.ABSTAIN,
    "ABSTENTION": MgmtRecommendation.ABSTAIN,
    "WITHHOLD": MgmtRecommendation.WITHHOLD,
    "NONE": MgmtRecommendation.NONE,
    "N/A": MgmtRecommendation.NONE,
}

_FREQ = re.compile(r"^(ONE|TWO|THREE|1|2|3|1\.0|2\.0|3\.0)\s*(YEAR|YEARS|\.0)?$")


def normalize_direction(raw: str | None) -> VoteDirection:
    """Canonical direction for a non-null raw vote value.

    Callers decide what empty means (VDS empty ClientVoteList = fund did not
    vote → pass explicit DO_NOT_VOTE; N-PX empty howVoted → UNKNOWN)."""
    k = _key(raw)
    if not k:
        return VoteDirection.UNKNOWN
    if k in _DIRECTION_MAP:
        return _DIRECTION_MAP[k]
    if _FREQ.match(k):                      # say-on-pay frequency values
        return VoteDirection.OTHER
    return VoteDirection.OTHER              # keep raw; never UNKNOWN-for-data


def normalize_mgmt_rec(raw: str | None) -> MgmtRecommendation | None:
    """None when the source gives no recommendation at all (empty/NA)."""
    k = _key(raw)
    if not k or k in {"NA", "N/A", "NONE REPORTED", "NO RECOMMENDATION"}:
        return MgmtRecommendation.NONE if k in {"N/A", "NA"} else None
    if k in _MGMT_MAP:
        return _MGMT_MAP[k]
    if _FREQ.match(k):
        return MgmtRecommendation.OTHER
    return MgmtRecommendation.OTHER


def compute_against_management(
    direction: VoteDirection,
    mgmt: MgmtRecommendation | None,
) -> bool | None:
    """Dissent is only defined when BOTH sides carry a real value.

    NULL is the honest answer when either is missing — never default False.
    Frequency-style OTHER comparisons are also NULL (semantics unclear)."""
    if mgmt in (None, MgmtRecommendation.NONE, MgmtRecommendation.UNKNOWN,
                MgmtRecommendation.OTHER):
        return None
    if direction in (VoteDirection.UNKNOWN, VoteDirection.OTHER):
        return None
    if direction == VoteDirection.DO_NOT_VOTE:
        return None
    # FOR vs FOR → False; anything else vs a management rec → True.
    same = direction.value == mgmt.value
    # WITHHOLD vs FOR is a real divergence (director elections).
    return not same
