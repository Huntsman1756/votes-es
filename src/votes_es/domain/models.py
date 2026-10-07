"""Pydantic domain models — validation layer between source-native records and
canonical silver tables. Nullable fields are nullable because the *sources*
permit absence; no NOT NULL is imposed where regulation allows a gap."""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from votes_es.domain.enums import (
    DisclosureLevel,
    MatchMethod,
    MeetingType,
    MgmtAlignment,
    MgmtRecommendation,
    ReporterType,
    ReuseStatus,
    ReviewStatus,
    SourceType,
    SponsorType,
    UnitType,
    VoteDirection,
)


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_assignment=False)


# ---------------------------------------------------------------- provenance


class Source(Strict):
    source_id: str
    source_type: SourceType
    name: str
    base_url: str = ""
    reuse_status: ReuseStatus = ReuseStatus.UNKNOWN
    terms_checked_at: date | None = None
    robots_checked_at: date | None = None
    adapter_version: str = ""


class Observation(Strict):
    """Provenance envelope: where a fact came from."""
    observation_id: str
    source_id: str
    accession: str | None = None          # SEC accession number
    source_document: str | None = None    # document name / api endpoint
    source_url: str
    published_at: datetime | None = None
    retrieved_at: datetime
    raw_reference: str | None = None      # e.g. proxyTable index, MeetingID/BallotID
    parser_version: str = ""
    content_hash: str | None = None


# ------------------------------------------------------------------- parties


class Reporter(Strict):
    reporter_id: str
    canonical_name: str
    country: str | None = None
    reporter_type: ReporterType
    parent_group: str | None = None
    lei: str | None = None
    source_identifiers: dict[str, str] = Field(default_factory=dict)  # e.g. cik, vds_customer


class ReportingUnit(Strict):
    unit_id: str
    reporter_id: str
    unit_type: UnitType
    source_identifier: str        # voteSeries / fundID / "self"
    canonical_name: str


class Issuer(Strict):
    issuer_id: str                # lei:<LEI> or xh:<hash>
    canonical_name: str
    country: str | None = None    # incorporation jurisdiction
    lei: str | None = None
    cnmv_id: str | None = None
    in_universe: bool = True      # Spanish-listed-universe member
    universe_basis: str | None = None   # e.g. "XMAD_LISTED", "SEED"


class Instrument(Strict):
    instrument_id: str            # isin when present
    issuer_id: str
    isin: str | None = None
    cusip: str | None = None
    figi: str | None = None
    ticker: str | None = None
    instrument_type: str | None = None
    valid_from: date | None = None
    valid_to: date | None = None


class IssuerAlias(Strict):
    issuer_id: str
    alias: str
    alias_type: str               # LEGAL_NAME / FILER_LABEL / TICKER / MANUAL
    source: str


class DisclosureSeason(Strict):
    reporter_id: str
    season: int
    coverage_start: date | None = None
    coverage_end: date | None = None
    published_at: datetime | None = None
    disclosure_level: DisclosureLevel
    significance_criteria_documented: bool = False
    significance_criteria_text: str | None = None
    significance_criteria_source: str | None = None
    aggregation_scope: str | None = None
    update_frequency: str | None = None
    source_lag_days: int | None = None
    reuse_status: ReuseStatus = ReuseStatus.UNKNOWN
    source_url: str | None = None


# ------------------------------------------------------------------ meetings


class Meeting(Strict):
    meeting_id: str
    issuer_id: str
    meeting_date: date
    meeting_type: MeetingType = MeetingType.UNKNOWN
    source_meeting_ids: list[str] = Field(default_factory=list)  # e.g. ISS MeetingID


class Proposal(Strict):
    proposal_id: str
    meeting_id: str
    proposal_number: str | None = None     # ballot/item number when the source gives one
    proposal_title_normalized: str
    sponsor_type: SponsorType = SponsorType.UNKNOWN


class ProposalInstance(Strict):
    """One source-native proposal description linked to a canonical proposal."""
    proposal_id: str
    source_id: str
    text_raw: str
    match_method: MatchMethod
    match_confidence: float
    review_status: ReviewStatus
    categories: list[str] = Field(default_factory=list)  # source taxonomy verbatim


class ProposalCategory(Strict):
    proposal_id: str
    taxonomy: str                 # SEC / VOTES_ES / VDS
    category: str


class Vote(Strict):
    vote_id: str
    proposal_id: str
    reporting_unit_id: str
    reporter_id: str
    direction: VoteDirection
    vote_raw: str
    # actual management-recommendation direction — NULL unless the source
    # declares one (VDS MgtRecVote). N-PX provides alignment instead.
    management_recommendation: MgmtRecommendation | None = None
    management_recommendation_raw: str | None = None
    # N-PX Item 1(l): "was the vote cast for/against management's
    # recommendation" — the field is an alignment flag, not a direction.
    management_alignment: MgmtAlignment | None = None
    against_management: bool | None = None   # source-aware; NULL = not defined
    is_split: bool = False            # unit split shares across directions
    voting_managers: str | None = None  # joint-reporting manager refs
    shares_voted: Decimal | None = None
    shares_on_loan: Decimal | None = None
    rationale: str | None = None
    source_observation_id: str


class IngestRun(Strict):
    run_id: str
    source_id: str
    started_at: datetime
    finished_at: datetime | None = None
    records_seen: int = 0
    records_parsed: int = 0
    records_matched: int = 0
    records_rejected: int = 0
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    adapter_version: str = ""
    status: str = "RUNNING"


# ------------------------------------------------------- source-native (bronze)


class NpxFilingMeta(Strict):
    """Metadata parsed from an N-PX primary document."""
    accession: str
    cik: str
    submission_type: str = "N-PX"           # N-PX / N-PX/A
    registrant_type: str | None = None      # IM / fund filing
    report_type: str | None = None          # FUND VOTING REPORT / INSTITUTIONAL MANAGER VOTING REPORT
    reporting_person: str | None = None
    reporting_person_lei: str | None = None
    period_of_report: date | None = None
    report_calendar_year: int | None = None
    file_number: str | None = None
    series_ids: list[str] = Field(default_factory=list)
    # N-PX/A amendment semantics (cover-page amendmentInfo block)
    amendment_no: int | None = None
    amendment_type: str | None = None       # RESTATEMENT / ADDS_NEW_PROXY_VOTING_ENTRIES
    # joint reporting (summary page): managers whose voting is included
    other_included_managers: list[dict] = Field(default_factory=list)


class NpxVoteRecord(Strict):
    """One <voteRecord> — a single series' vote on a proxyTable row."""
    how_voted_raw: str
    shares_voted_raw: str | None = None
    management_recommendation_raw: str | None = None


class NpxProxyTable(Strict):
    """Source-native parse of one <proxyTable> block (issuer × proposal)."""
    issuer_name_raw: str
    cusip: str | None = None
    isin: str | None = None
    figi: str | None = None
    meeting_date_raw: str
    vote_description_raw: str
    vote_source: str | None = None
    shares_voted_raw: str | None = None
    shares_on_loan_raw: str | None = None
    vote_series: str | None = None
    categories: list[str] = Field(default_factory=list)
    other_managers: list[str] = Field(default_factory=list)
    vote_records: list[NpxVoteRecord] = Field(default_factory=list)


class VdsFund(Strict):
    fund_id: int
    fund_name: str
    fund_family_id: int | None = None
    fund_family_name: str | None = None


class VdsMeetingRow(Strict):
    meeting_id: int                         # ISS global meeting object
    company_name: str
    isin: str | None = None
    cusip: str | None = None
    ticker: str | None = None
    country: str | None = None
    meeting_date: date | None = None
    meeting_type: str | None = None
    fund_ids: list[int] = Field(default_factory=list)
    ballot_ids: list[int] = Field(default_factory=list)
    voted_flags: list[str] = Field(default_factory=list)
    significant_meeting: bool | None = None


class VdsVoteRow(Strict):
    meeting_id: int
    fund_id: int | None = None
    fund_name: str | None = None
    seq_number: int | None = None
    item_on_agenda_id: int | None = None
    ballot_item_number: str | None = None
    proposal_raw: str
    shareholder_proposal: bool | None = None
    mgt_rec_raw: str | None = None
    client_vote_raw: str | None = None      # empty string = fund did not vote (per VDS)
    shares_voted_raw: str | None = None
    proposal_category: str | None = None
    proposal_subcategory: str | None = None
    npx_category: str | None = None
    significant_proposal: bool | None = None
    notes: str | None = None
    company_name: str | None = None
    isin: str | None = None
    meeting_date: date | None = None
    meeting_type: str | None = None
