"""Canonical enums. All are str-valued so they serialize cleanly to Parquet/JSON.

Rule: never coerce an unparseable raw value into a confident enum. Keep the raw
string alongside (vote_raw, management_recommendation_raw) and use UNKNOWN.
Absence is NOT_OBSERVED territory and is modelled by the *absence of a row*,
never by a direction value.
"""
from __future__ import annotations

from enum import StrEnum


class VoteDirection(StrEnum):
    FOR = "FOR"
    AGAINST = "AGAINST"
    ABSTAIN = "ABSTAIN"
    WITHHOLD = "WITHHOLD"
    DO_NOT_VOTE = "DO_NOT_VOTE"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"


class MgmtRecommendation(StrEnum):
    FOR = "FOR"
    AGAINST = "AGAINST"
    ABSTAIN = "ABSTAIN"
    WITHHOLD = "WITHHOLD"
    NONE = "NONE"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"


class ReportType(StrEnum):
    FUND = "FUND"                      # N-PX "FUND VOTING REPORT" — full proxy record
    INSTITUTIONAL_MANAGER = "INSTITUTIONAL_MANAGER"  # N-PX IM report — Section 14A scope


class ReporterType(StrEnum):
    REGISTERED_FUND = "REGISTERED_FUND"
    INSTITUTIONAL_MANAGER = "INSTITUTIONAL_MANAGER"
    SGIIC = "SGIIC"                    # Spanish asset manager (47 ter disclosure)
    EGFP = "EGFP"                      # pension-fund manager
    OTHER = "OTHER"


class UnitType(StrEnum):
    FUND_SERIES = "FUND_SERIES"        # N-PX voteSeries / registrant series
    FUND = "FUND"                      # VDS fundID vehicle
    REPORTER_SELF = "REPORTER_SELF"    # no sub-unit disclosed


class DisclosureLevel(StrEnum):
    ITEMIZED = "ITEMIZED"              # per-proposal votes published
    SIGNIFICANT_ONLY = "SIGNIFICANT_ONLY"
    SUMMARY_ONLY = "SUMMARY_ONLY"      # narrative/aggregate reports only
    NONE_PUBLISHED = "NONE_PUBLISHED"
    UNKNOWN = "UNKNOWN"


class ReuseStatus(StrEnum):
    OPEN_REUSE_CONFIRMED = "OPEN_REUSE_CONFIRMED"
    PUBLIC_ACCESS_REUSE_UNCLEAR = "PUBLIC_ACCESS_REUSE_UNCLEAR"
    DISPLAY_ONLY = "DISPLAY_ONLY"
    RESTRICTED = "RESTRICTED"
    UNKNOWN = "UNKNOWN"


class SourceType(StrEnum):
    SEC_NPX = "SEC_NPX"
    ISS_VDS = "ISS_VDS"
    SGIIC_DIRECT = "SGIIC_DIRECT"
    MANUAL = "MANUAL"


class MatchMethod(StrEnum):
    """Evidence trail for identity/proposal matching. Only identifier-based
    methods auto-promote; NAME_* and FUZZY stay suspect until reviewed."""
    EXACT_ISIN = "EXACT_ISIN"
    EXACT_CUSIP = "EXACT_CUSIP"        # resolved via identifier map, still identifier-grade
    EXACT_FIGI = "EXACT_FIGI"
    KNOWN_ALIAS = "KNOWN_ALIAS"
    EXACT_PROPOSAL_NUMBER = "EXACT_PROPOSAL_NUMBER"
    EXACT_NORMALIZED_TEXT = "EXACT_NORMALIZED_TEXT"
    RULE_BASED = "RULE_BASED"
    FUZZY_REVIEWED = "FUZZY_REVIEWED"  # accepted only with review_status=MANUAL
    NAME_SUSPECT = "NAME_SUSPECT"      # never promoted to canonical
    MANUAL = "MANUAL"
    UNRESOLVED = "UNRESOLVED"


class ReviewStatus(StrEnum):
    EXACT = "EXACT"                    # identifier-grade; no review needed
    HIGH_CONFIDENCE = "HIGH_CONFIDENCE"
    AMBIGUOUS = "AMBIGUOUS"            # surfaced in QA
    UNRESOLVED = "UNRESOLVED"
    MANUAL = "MANUAL"


class MeetingType(StrEnum):
    ANNUAL = "ANNUAL"
    SPECIAL = "SPECIAL"
    ANNUAL_SPECIAL = "ANNUAL_SPECIAL"
    EXTRAORDINARY = "EXTRAORDINARY"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"


class SponsorType(StrEnum):
    MANAGEMENT = "MANAGEMENT"
    SHAREHOLDER = "SHAREHOLDER"
    OTHER = "OTHER"
    UNKNOWN = "UNKNOWN"


class HighLevelCategory(StrEnum):
    """VOTES_ES high-level taxonomy — deterministic crosswalk only."""
    DIRECTOR_ELECTION = "DIRECTOR_ELECTION"
    EXECUTIVE_COMPENSATION = "EXECUTIVE_COMPENSATION"
    AUDIT = "AUDIT"
    CAPITAL = "CAPITAL"
    SHAREHOLDER_RIGHTS = "SHAREHOLDER_RIGHTS"
    GOVERNANCE = "GOVERNANCE"
    ENVIRONMENT = "ENVIRONMENT"
    SOCIAL = "SOCIAL"
    ACCOUNTS_REPORTS = "ACCOUNTS_REPORTS"
    STATUTORY = "STATUTORY"
    OTHER = "OTHER"


class IngestStatus(StrEnum):
    OK = "OK"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
