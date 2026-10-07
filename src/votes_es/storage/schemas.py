"""Parquet schemas. Bronze = source-native (raw fields kept verbatim);
silver = canonical model from §16 of the project spec."""
from __future__ import annotations

import pyarrow as pa

# ------------------------------------------------------------------- bronze

BRONZE_NPX = pa.schema([
    ("observation_id", pa.string()),
    ("accession", pa.string()),
    ("cik", pa.string()),
    ("reporter_name_raw", pa.string()),
    ("reporter_lei", pa.string()),
    ("report_type", pa.string()),
    ("period_of_report", pa.string()),
    ("issuer_name_raw", pa.string()),
    ("cusip", pa.string()),
    ("isin", pa.string()),
    ("figi", pa.string()),
    ("meeting_date_raw", pa.string()),
    ("proposal_text_raw", pa.string()),
    ("vote_source", pa.string()),
    ("categories_raw", pa.string()),
    ("other_managers", pa.string()),
    ("vote_series", pa.string()),
    ("how_voted_raw", pa.string()),
    ("shares_voted_raw", pa.string()),
    ("shares_on_loan_raw", pa.string()),
    ("management_recommendation_raw", pa.string()),
    ("row_index", pa.int64()),
])

BRONZE_VDS = pa.schema([
    ("observation_id", pa.string()),
    ("reporter_key", pa.string()),
    ("source_meeting_id", pa.string()),
    ("fund_id", pa.int64()),
    ("fund_name_raw", pa.string()),
    ("issuer_name_raw", pa.string()),
    ("isin", pa.string()),
    ("cusip", pa.string()),
    ("meeting_date_raw", pa.string()),
    ("meeting_type_raw", pa.string()),
    ("seq_number", pa.int64()),
    ("item_on_agenda_id", pa.int64()),
    ("ballot_item_number", pa.string()),
    ("proposal_text_raw", pa.string()),
    ("shareholder_proposal", pa.bool_()),
    ("how_voted_raw", pa.string()),
    ("voted_flag", pa.string()),
    ("management_recommendation_raw", pa.string()),
    ("shares_voted_raw", pa.string()),
    ("shares_on_loan_raw", pa.string()),
    ("categories_raw", pa.string()),
    ("significant_proposal", pa.bool_()),
    ("notes", pa.string()),
])

BRONZE_MAPFRE = pa.schema([
    ("observation_id", pa.string()),
    ("publication_year", pa.int64()),
    # meeting block (ISS "Vote Summary" print)
    ("company_raw", pa.string()),
    ("security_raw", pa.string()),
    ("isin", pa.string()),
    ("ticker_raw", pa.string()),
    ("meeting_date_raw", pa.string()),
    ("meeting_type_raw", pa.string()),
    ("agenda_number", pa.string()),
    ("record_date_raw", pa.string()),
    ("vote_deadline_raw", pa.string()),
    ("city_country_raw", pa.string()),
    # item row
    ("item_raw", pa.string()),              # effective item, incl. "5.2" sub-items
    ("parent_item_raw", pa.string()),       # parent when derived from a sub-row
    ("proposal_text_raw", pa.string()),
    ("proposed_by_raw", pa.string()),
    ("vote_raw", pa.string()),
    ("management_recommendation_raw", pa.string()),
    ("for_against_raw", pa.string()),       # explicit alignment column
    # provenance + quality
    ("page", pa.int64()), ("row_top", pa.float64()), ("page_end", pa.int64()),
    ("quarantined", pa.bool_()),
    ("quarantine_reason", pa.string()),
])

BRONZE_FILINGS = pa.schema([
    ("accession", pa.string()),
    ("cik", pa.string()),
    ("submission_type", pa.string()),        # N-PX / N-PX/A
    ("report_type", pa.string()),
    ("reporting_person", pa.string()),
    ("reporting_person_lei", pa.string()),
    ("period_of_report", pa.string()),
    ("amendment_no", pa.int64()),
    ("amendment_type", pa.string()),         # RESTATEMENT / NEW PROXY
    ("other_managers_json", pa.string()),    # joint-reporting manager list
    ("retrieved_at", pa.string()),
])

# ------------------------------------------------------------------- silver

SOURCES = pa.schema([
    ("source_id", pa.string()), ("source_type", pa.string()),
    ("name", pa.string()), ("base_url", pa.string()),
    ("reuse_status", pa.string()), ("terms_checked_at", pa.string()),
    ("robots_checked_at", pa.string()), ("adapter_version", pa.string()),
    # reuse model (four separate questions — see SourceDef)
    ("technical_access", pa.string()),
    ("extraction_terms", pa.string()),
    ("publication_status", pa.string()),
    ("aggregation_scope", pa.string()),
])

OBSERVATIONS = pa.schema([
    ("observation_id", pa.string()), ("source_id", pa.string()),
    ("accession", pa.string()), ("source_document", pa.string()),
    ("source_url", pa.string()), ("published_at", pa.string()),
    ("retrieved_at", pa.string()), ("raw_reference", pa.string()),
    ("parser_version", pa.string()), ("content_hash", pa.string()),
])

REPORTERS = pa.schema([
    ("reporter_id", pa.string()), ("canonical_name", pa.string()),
    ("country", pa.string()), ("reporter_type", pa.string()),
    ("parent_group", pa.string()), ("lei", pa.string()),
    ("source_identifiers_json", pa.string()),
])

REPORTING_UNITS = pa.schema([
    ("unit_id", pa.string()), ("reporter_id", pa.string()),
    ("unit_type", pa.string()), ("source_identifier", pa.string()),
    ("canonical_name", pa.string()),
])

ISSUERS = pa.schema([
    ("issuer_id", pa.string()), ("canonical_name", pa.string()),
    ("country", pa.string()), ("lei", pa.string()),
    ("cnmv_id", pa.string()), ("in_universe", pa.bool_()),
    ("universe_basis", pa.string()),
])

INSTRUMENTS = pa.schema([
    ("instrument_id", pa.string()), ("issuer_id", pa.string()),
    ("isin", pa.string()), ("cusip", pa.string()), ("figi", pa.string()),
    ("ticker", pa.string()), ("instrument_type", pa.string()),
    ("valid_from", pa.string()), ("valid_to", pa.string()),
])

ISSUER_ALIASES = pa.schema([
    ("issuer_id", pa.string()), ("alias", pa.string()),
    ("alias_type", pa.string()), ("source", pa.string()),
])

DISCLOSURE_SEASONS = pa.schema([
    ("reporter_id", pa.string()), ("season", pa.int64()),
    ("coverage_start", pa.string()), ("coverage_end", pa.string()),
    ("published_at", pa.string()), ("disclosure_level", pa.string()),
    ("significance_criteria_documented", pa.bool_()),
    ("significance_criteria_text", pa.string()),
    ("significance_criteria_source", pa.string()),
    ("aggregation_scope", pa.string()), ("update_frequency", pa.string()),
    ("source_lag_days", pa.int64()), ("reuse_status", pa.string()),
    ("source_url", pa.string()),
])

MEETINGS = pa.schema([
    ("meeting_id", pa.string()), ("issuer_id", pa.string()),
    ("meeting_date", pa.date32()), ("meeting_type", pa.string()),
    ("source_meeting_ids", pa.string()),  # |-joined source meeting ids
])

PROPOSALS = pa.schema([
    ("proposal_id", pa.string()), ("meeting_id", pa.string()),
    ("proposal_number", pa.string()),
    ("proposal_title_normalized", pa.string()),
    ("sponsor_type", pa.string()),
])

PROPOSAL_INSTANCES = pa.schema([
    ("proposal_id", pa.string()), ("source_id", pa.string()),
    ("text_raw", pa.string()), ("match_method", pa.string()),
    ("match_confidence", pa.float64()), ("review_status", pa.string()),
    ("categories_raw", pa.string()),
])

PROPOSAL_CATEGORIES = pa.schema([
    ("proposal_id", pa.string()), ("taxonomy", pa.string()),
    ("category", pa.string()),
])

VOTES = pa.schema([
    ("vote_id", pa.string()), ("proposal_id", pa.string()),
    ("reporting_unit_id", pa.string()), ("reporter_id", pa.string()),
    ("direction", pa.string()), ("vote_raw", pa.string()),
    # real management-recommendation direction — NULL unless the source
    # declares one (VDS). N-PX carries alignment instead.
    ("management_recommendation", pa.string()),
    ("management_recommendation_raw", pa.string()),
    # N-PX Item 1(l): vote cast for/against mgmt's recommendation
    ("management_alignment", pa.string()),
    # derived, source-aware: N-PX → alignment=='AGAINST';
    # VDS → direction != mgtRec. NULL = not defined.
    ("against_management", pa.bool_()),
    # TRUE when the unit split this vote across >1 direction; the components
    # are the individual rows sharing (proposal, unit, observation)
    ("is_split", pa.bool_()),
    # joint reporting: other-manager refs declared on the proxyTable
    ("voting_managers", pa.string()),
    ("shares_voted", pa.decimal128(38, 6)), ("shares_on_loan", pa.decimal128(38, 6)),
    ("rationale", pa.string()), ("source_observation_id", pa.string()),
    ("source_id", pa.string()), ("report_type", pa.string()),
    ("match_method", pa.string()), ("review_status", pa.string()),
    ("match_evidence", pa.string()),
])

NPX_FILINGS = pa.schema([
    ("accession", pa.string()), ("cik", pa.string()),
    ("submission_type", pa.string()), ("report_type", pa.string()),
    ("reporting_person", pa.string()), ("reporting_person_lei", pa.string()),
    ("period_of_report", pa.string()),
    ("amendment_no", pa.int64()), ("amendment_type", pa.string()),
    ("other_managers_json", pa.string()),
    # materialization state decided at silver build: EFFECTIVE | SUPERSEDED
    ("materialization", pa.string()),
])

INGEST_RUNS = pa.schema([
    ("run_id", pa.string()), ("source_id", pa.string()),
    ("started_at", pa.string()), ("finished_at", pa.string()),
    ("records_seen", pa.int64()), ("records_parsed", pa.int64()),
    ("records_matched", pa.int64()), ("records_rejected", pa.int64()),
    ("errors", pa.string()), ("warnings", pa.string()),
    ("adapter_version", pa.string()), ("status", pa.string()),
])

SILVER_SCHEMAS = {
    "sources": SOURCES, "observations": OBSERVATIONS,
    "reporters": REPORTERS, "reporting_units": REPORTING_UNITS,
    "issuers": ISSUERS, "instruments": INSTRUMENTS,
    "issuer_aliases": ISSUER_ALIASES, "disclosure_seasons": DISCLOSURE_SEASONS,
    "meetings": MEETINGS, "proposals": PROPOSALS,
    "proposal_instances": PROPOSAL_INSTANCES,
    "proposal_categories": PROPOSAL_CATEGORIES, "votes": VOTES,
    "npx_filings": NPX_FILINGS, "ingest_runs": INGEST_RUNS,
}
