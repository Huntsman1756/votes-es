# DATA MODEL — votes-es

## Layers

| Layer | Store | Content |
|---|---|---|
| raw | `data/raw/` | source artifacts + capture JSON (ephemeral for large XMLs) |
| bronze | `data/bronze/<source>/` | source-native parsed rows + `_observations.jsonl` + `_runs.jsonl` |
| silver | `data/silver/*.parquet` | canonical tables (below) |
| gold | `data/gold/votes.duckdb` | serving DB + views; rebuildable from silver |

## Canonical tables (silver)

`sources` — source_id, source_type, name, base_url, reuse_status,
terms/robots checked dates, adapter_version.

`observations` — provenance envelope per ingested unit:
observation_id, source_id, accession, source_document, source_url,
published_at, retrieved_at, raw_reference, parser_version, content_hash.

`reporters` — reporter_id, canonical_name, country, reporter_type
(REGISTERED_FUND / INSTITUTIONAL_MANAGER / SGIIC / EGFP), parent_group, lei,
source_identifiers_json (cik, vds_customer…).

`reporting_units` — unit_id, reporter_id, unit_type (FUND_SERIES / FUND /
REPORTER_SELF), source_identifier (voteSeries / fundID), canonical_name.

`issuers` — issuer_id (`lei:<LEI>` preferred, `xh:<hash>` fallback,
`unr:<hash>` for ambiguous name-suspects), canonical_name, country, lei,
cnmv_id, in_universe, universe_basis (XMAD_LISTED / SEED / SEED_OVERRIDE /
OI_XMAD / NAME_SUSPECT).

`instruments` — instrument_id (=ISIN), issuer_id, isin/cusip/figi/ticker,
instrument_type, validity.

`issuer_aliases` — issuer_id, alias, alias_type (LEGAL_NAME, NORMALIZED_NAME,
FILER_LABEL, MANUAL), source.

`disclosure_seasons` — reporter_id × season: disclosure_level
(ITEMIZED / SIGNIFICANT_ONLY / SUMMARY_ONLY / NONE_PUBLISHED),
significance_criteria_documented/text/source, reuse_status, source_url.
*Populated from published policies, never inferred.*

`meetings` — meeting_id, issuer_id, meeting_date, meeting_type,
source_meeting_ids (ISS MeetingID, accession — `|`-joined).

`proposals` — proposal_id, meeting_id, proposal_number (ballot when known),
proposal_title_normalized, sponsor_type.

`proposal_instances` — per-source raw texts linked to canonical proposals with
match_method (EXACT_PROPOSAL_NUMBER / EXACT_NORMALIZED_TEXT / RULE_BASED /
NAME_SUSPECT / UNRESOLVED / MANUAL), match_confidence, review_status,
categories_raw.

`proposal_categories` — proposal_id × taxonomy (SEC verbatim / VDS verbatim /
VOTES_ES high-level crosswalk) × category. 1:N by design.

`votes` — vote_id, proposal_id, reporting_unit_id, reporter_id, direction,
vote_raw, management_recommendation(+_raw), against_management (NULL when
either side absent), shares_voted / shares_on_loan (nullable Decimal),
rationale, source_observation_id, source_id, report_type,
match_method/review_status/match_evidence (identity evidence).

`ingest_runs` — run metadata per ingestion (records seen/parsed/rejected,
errors, warnings, adapter_version).

## Enums

VoteDirection: FOR / AGAINST / ABSTAIN / WITHHOLD / DO_NOT_VOTE / OTHER /
UNKNOWN. Say-on-pay frequency values (`1 YEAR`, `THREE YEARS`, `1.0`…) →
OTHER. Raw always preserved.

MgmtRecommendation: FOR / AGAINST / ABSTAIN / WITHHOLD / NONE / OTHER /
UNKNOWN (+ NULL when the source gives none).

## Identity resolution order

1. ISIN in universe → EXACT_ISIN
2. ISIN → OpenInstrument → XMAD-listed → EXACT_ISIN (HIGH_CONFIDENCE)
3. CUSIP → OI identifiers → ISIN → universe → EXACT_CUSIP
4. normalized name == known alias → NAME_SUSPECT (never auto-promoted;
   surfaces as AMBIGUOUS in QA)
5. else UNRESOLVED → row counted, not materialized in silver

## Proposal matching within a meeting

Deterministic: ballot-number equality > exact normalized text > token-Jaccard
≥ 0.60. Conflicting ballot numbers prevent merge (real case: two Iberdrola
"Approve Scrip Dividends" items). Every instance keeps method + confidence.

## Absence semantics

No row = NOT_OBSERVED. `against_management=NULL` when vote or management
recommendation is missing. `DO_NOT_VOTE` only when the source explicitly shows
the unit did not vote (VDS blank ClientVoteList on an attached fund).
