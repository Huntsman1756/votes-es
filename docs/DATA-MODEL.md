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
vote_raw, management_recommendation(+_raw) — the *declared* recommendation
direction, NULL unless the source states one (VDS only; N-PX never declares
it); management_alignment — N-PX Item 1(l) flag (FOR/AGAINST/NONE);
against_management — source-aware derived flag, NULL when undefined;
is_split — reporting unit divided shares across >1 direction for this
proposal+observation (component rows all preserved); voting_managers —
joint-reporting manager refs; shares_voted / shares_on_loan (nullable
Decimal), rationale, source_observation_id, source_id, report_type,
match_method/review_status/match_evidence (identity evidence).

`npx_filings` — one row per N-PX accession: submission_type (N-PX/N-PX/A),
report_type, reporting_person(+lei), period_of_report, amendment_no,
amendment_type (RESTATEMENT / NEW PROXY),
other_managers_json (summary-page joint-reporting list),
materialization = EFFECTIVE | SUPERSEDED (decided at silver build).

Amendment materialization: within one (filer CIK, period_of_report), the
latest RESTATEMENT supersedes every earlier filing (its bronze rows remain
for audit but do not enter silver); NEW PROXY adds rows
alongside; N-PX/A without a parseable amendment_type is kept as additive and
flagged in build warnings.

`ingest_runs` — run metadata per ingestion (records seen/parsed/rejected,
errors, warnings, adapter_version).

## Enums

VoteDirection: FOR / AGAINST / ABSTAIN / WITHHOLD / DO_NOT_VOTE / OTHER /
UNKNOWN. Say-on-pay frequency values (`1 YEAR`, `THREE YEARS`, `1.0`…) →
OTHER. Raw always preserved.

MgmtRecommendation: FOR / AGAINST / ABSTAIN / WITHHOLD / NONE / OTHER /
UNKNOWN (+ NULL when the source gives none). This is the direction
management recommended — populated only by sources that declare it (VDS).

MgmtAlignment: FOR / AGAINST / NONE / OTHER / UNKNOWN. N-PX Item 1(l):
whether the *vote* was cast for/against management's recommendation — an
alignment flag, NOT the rec direction. See
docs/findings/NPX-MANAGEMENT-SEMANTICS.md for the evidence and the inversion
bug this prevents.

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

No row = NOT_OBSERVED. `against_management` is source-aware and NULL when
undefined — N-PX: `alignment == 'AGAINST'`; VDS: `direction != mgtRec` when
both are meaningful. `DO_NOT_VOTE` only when the source explicitly shows
the unit did not vote (VDS blank ClientVoteList on an attached fund).
