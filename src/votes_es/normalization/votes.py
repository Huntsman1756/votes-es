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

from votes_es.domain.enums import (
    MgmtAlignment,
    MgmtRecommendation,
    VoteDirection,
)

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
    """A real management-recommendation DIRECTION (VDS MgtRecVote).
    None when the source gives no recommendation at all (empty/NA)."""
    k = _key(raw)
    if not k or k in {"NA", "N/A", "NONE REPORTED", "NO RECOMMENDATION"}:
        return MgmtRecommendation.NONE if k in {"N/A", "NA"} else None
    if k in _MGMT_MAP:
        return _MGMT_MAP[k]
    if _FREQ.match(k):
        return MgmtRecommendation.OTHER
    return MgmtRecommendation.OTHER


_ALIGNMENT_MAP = {
    "FOR": MgmtAlignment.FOR,
    "AGAINST": MgmtAlignment.AGAINST,
    "NONE": MgmtAlignment.NONE,        # mgmt made no recommendation (Item 1(l) i8)
    "N/A": MgmtAlignment.NONE,
    "NA": MgmtAlignment.NONE,
}


def normalize_mgmt_alignment(raw: str | None) -> MgmtAlignment | None:
    """SEC N-PX `managementRecommendation` element → alignment flag.

    Item 1(l): 'whether the vote was cast for or against management's
    recommendation'. This is NOT the recommendation's direction — the matrix
    is: vote FOR + alignment AGAINST ⇒ mgmt recommended AGAINST; vote AGAINST +
    alignment AGAINST ⇒ mgmt recommended FOR."""
    if raw is None:
        return None                      # element absent in the record
    k = _key(raw)
    if not k:
        return None
    return _ALIGNMENT_MAP.get(k, MgmtAlignment.OTHER)


def derive_alignment(direction: VoteDirection,
                     rec: MgmtRecommendation | None) -> MgmtAlignment | None:
    """For sources that state the recommendation direction (VDS MgtRecVote),
    derive the alignment flag for a uniform interface. NULL-safe."""
    if direction in (VoteDirection.UNKNOWN, VoteDirection.OTHER,
                     VoteDirection.DO_NOT_VOTE):
        return None
    if rec in (None, MgmtRecommendation.NONE, MgmtRecommendation.UNKNOWN,
               MgmtRecommendation.OTHER):
        return None
    if direction == VoteDirection.FOR and rec == MgmtRecommendation.FOR:
        return MgmtAlignment.FOR
    if direction == VoteDirection.AGAINST and rec == MgmtRecommendation.AGAINST:
        return MgmtAlignment.FOR
    if rec in (MgmtRecommendation.FOR, MgmtRecommendation.AGAINST):
        return MgmtAlignment.AGAINST
    return None


def compute_against_management(
    direction: VoteDirection,
    mgmt: MgmtRecommendation | None = None,
    alignment: MgmtAlignment | None = None,
    source_id: str | None = None,
) -> bool | None:
    """Source-aware dissent.

    sec_npx:  `managementRecommendation` is already the alignment flag —
              AGAINST means the filer voted AGAINST management's rec
              (independent of the vote's own direction). NEVER compare
              direction != alignment: that inverts dissent for AGAINST votes.
    iss_vds:  real MgtRecVote direction → compare against vote direction.
    NULL when the fact is not established — never default False."""
    if direction in (VoteDirection.UNKNOWN, VoteDirection.OTHER,
                     VoteDirection.DO_NOT_VOTE):
        return None
    if source_id == "sec_npx":
        if alignment == MgmtAlignment.AGAINST:
            return True
        if alignment == MgmtAlignment.FOR:
            return False
        return None
    # declared-recommendation sources
    if mgmt in (None, MgmtRecommendation.NONE, MgmtRecommendation.UNKNOWN,
                MgmtRecommendation.OTHER):
        return None
    same = direction.value == mgmt.value
    return not same
