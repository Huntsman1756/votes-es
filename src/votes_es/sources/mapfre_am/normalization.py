"""MAPFRE-specific raw → canonical normalization.

The ISS Vote Summary carries three separate management cells — richer
than N-PX:

    Vote                        -> direction (blank on a votable item =
                                   observed no-vote -> DO_NOT_VOTE)
    Management Recommendation   -> real recommendation DIRECTION
    For/Against Management      -> explicit alignment flag

Dates print as '30-May-2025'; meeting types as 'Annual General Meeting' /
'ExtraOrdinary General Meeting' / 'Special ...'.
"""
from __future__ import annotations

from datetime import date
from time import strptime

from votes_es.domain.enums import (
    MgmtAlignment,
    MgmtRecommendation,
    MeetingType,
    VoteDirection,
)
from votes_es.normalization.votes import (
    derive_alignment,
    normalize_direction,
    normalize_mgmt_alignment,
    normalize_mgmt_rec,
)


def parse_mapfre_date(raw: str | None) -> date | None:
    s = (raw or "").strip()
    for fmt in ("%d-%b-%Y", "%d %b %Y"):
        try:
            d = strptime(s, fmt)
            return date(d.tm_year, d.tm_mon, d.tm_mday)
        except ValueError:
            continue
    return None


def mapfre_meeting_type(raw: str | None) -> MeetingType:
    t = (raw or "").strip().upper()
    if "EXTRAORDINARY" in t:
        return MeetingType.EXTRAORDINARY
    if "ANNUAL/SPECIAL" in t or "SPECIAL AND ANNUAL" in t:
        return MeetingType.ANNUAL_SPECIAL
    if "ANNUAL" in t:
        return MeetingType.ANNUAL
    if "SPECIAL" in t:
        return MeetingType.SPECIAL
    return MeetingType.UNKNOWN if not t else MeetingType.OTHER


def mapfre_direction(vote_raw: str | None, proposed_by_raw: str | None
                     ) -> VoteDirection | None:
    """Canonical direction for a MAPFRE item row.

    Returns None for rows that must not become canonical votes:
    - 'Non-Voting' items are agenda entries, not ballot positions.
    A blank Vote cell on a *votable* item (Management/Shareholder
    proposal) is an observed no-vote on a held ballot -> DO_NOT_VOTE,
    consistent with the VDS convention for an empty ClientVoteList.
    """
    if (proposed_by_raw or "").strip() == "Non-Voting":
        return None
    if not (vote_raw or "").strip():
        return VoteDirection.DO_NOT_VOTE
    return normalize_direction(vote_raw)


def mapfre_mgmt(raw: str | None) -> MgmtRecommendation | None:
    return normalize_mgmt_rec(raw)


def mapfre_alignment(direction: VoteDirection,
                     rec: MgmtRecommendation | None,
                     for_against_raw: str | None) -> MgmtAlignment | None:
    """Prefer the source's own alignment column; derive only when blank."""
    a = normalize_mgmt_alignment(for_against_raw)
    if a is not None:
        return a
    return derive_alignment(direction, rec)


def mapfre_against(direction: VoteDirection,
                   rec: MgmtRecommendation | None,
                   alignment: MgmtAlignment | None) -> bool | None:
    """Dissent: explicit alignment column wins; else compare direction vs
    the declared recommendation (MAPFRE declares real directions)."""
    if alignment == MgmtAlignment.AGAINST:
        return True
    if alignment == MgmtAlignment.FOR:
        return False
    if direction in (VoteDirection.FOR, VoteDirection.AGAINST) \
            and rec in (MgmtRecommendation.FOR, MgmtRecommendation.AGAINST):
        return direction.value != rec.value
    return None
