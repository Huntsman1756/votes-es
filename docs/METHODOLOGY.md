# METHODOLOGY — votes-es

## What this dataset is

Publicly disclosed institutional votes at shareholder meetings of
Spanish-listed companies, normalized across heterogeneous sources with full
provenance. It is **observed disclosure**, not total voting behaviour.

## Sources

### SEC Form N-PX (source_id `sec_npx`)

US-registered funds file N-PX annually (period Jul 1–Jun 30, filed by Aug 31)
reporting every proxy vote they cast — including on foreign issuers. Two
report types exist and are kept strictly separate:

- `FUND VOTING REPORT` — full proxy record (funds: Vanguard, iShares, SPDR…)
- `INSTITUTIONAL MANAGER VOTING REPORT` — Section 14A scope only
  (say-on-pay/frequency for US issuers; near-zero Spanish coverage)

Season 2026 = reporting period ending 2026-06-30. Parsing: streaming
`iterparse`, local-name namespace handling, schema version logged
(`VoteTableSchemaVersion:X0300`).

### ISS VDS registers (`iss_vds:<reporter>`)

Spanish SGIICs that disclose through ISS Voting Disclosure Service publish
fund×meeting×proposal records: direction, management recommendation, ballot
item numbers, significance flags. Verified: CaixaBank AM (customer 11006),
BBVA AM (7216). Legal basis: Ley 35/2003 art. 47 ter (SRD II).

`VotedList "(Blanks)"` rows carry an empty `ClientVoteList` = observed
"fund did not vote" → `DO_NOT_VOTE`. A fund absent from the meeting row =
NOT_OBSERVED (no row emitted).

### MAPFRE AM (source_id `mapfre_am`)

MAPFRE AM's annual engagement report embeds an ISS "Vote Summary" annex —
per-meeting itemized records on the manager's own domain: company, ISIN,
meeting, item, proposal, proposer, **vote**, **management-recommendation
direction** and the source's own **For/Against-Management** alignment flag
(richer than N-PX, which declares only alignment). Annual publications:
2023/2024/2025; reporting unit is consolidated MAPFRE AM vote execution
(`REPORTER_SELF`) — the register does not decompose by fund/mandate.

Semantics:

- `Non-Voting` items are agenda entries, never canonical votes (kept in
  bronze only).
- Blank `Vote` on a votable item = observed no-vote → `DO_NOT_VOTE`
  (same convention as VDS blank ClientVoteList).
- `management_alignment` prefers the source's explicit For/Against column;
  when blank it derives from direction vs declared recommendation.
- Contradicting vote/rec/alignment triples and vocabulary violations
  (header bleed) → quarantined in bronze, never canonicalized.

Publication: `PERMISSION_REQUIRED` — the site legal notice restricts
reproduction; rows stay out of the public build pending written
permission (see docs/legal/MAPFRE-PERMISSION-REQUEST.md).

### Ibercaja

Summary-only image PDFs; no itemized disclosure. Reporter profile exists with
`disclosure_level=SUMMARY_ONLY`; no votes ingested.

## Universe definition

Spanish-listed issuer universe = **equity instruments (CFI E*) with a live
XMAD listing** per OpenInstrument canonical data ∪ committed seed entries
(`src/votes_es/reference/issuer_seed.csv`). This deliberately is NOT
`isin LIKE 'ES%'`: Ferrovial (NL ISIN) and ArcelorMittal (LU ISIN) are in;
the rule also admits any future foreign-ISIN XMAD-listed issuer automatically.

ES-ISIN foreign-operating issuers (e.g. EDP Renováveis) stay in the universe
with their true jurisdiction — universe membership is about the *Spanish
listing venue*, not nationality rhetoric.

## Normalization

- `direction`: see `normalization/votes.py` mapping table; frequency answers → OTHER; raw preserved always.
- `management_recommendation`: NULL when the source gives none — never fabricate.
- `management_alignment` (N-PX only): whether the cast vote was FOR or AGAINST *management's recommendation* — the SEC field `managementRecommendation` is this alignment flag, NOT the recommendation direction (see docs/findings/NPX-MANAGEMENT-SEMANTICS.md). Displayed as "Relative to management".
- `against_management`: source-aware — for N-PX it equals `management_alignment == AGAINST`; for VDS it compares direction vs the declared recommendation. NULL whenever either side is non-meaningful (never false-by-default).
- `proposal_categories`: source verbatim + VOTES_ES deterministic high-level crosswalk (keyword rules on normalized text, listed in `normalization/categories.py`).

## Amendments

N-PX/A `amendmentType`: `RESTATEMENT` supersedes earlier filings of the same
(filer CIK, period); `NEW PROXY` adds entries alongside. Unknown/absent types
stay flagged, never guessed. Superseded rows remain in bronze but do not
enter silver (`npx_filings.materialization`).

## Split votes

A filer may report several vote records per (series, proposal) — pass-through
sub-lots or ballot splits. Every component row is preserved; `is_split` is
set when >1 real position (FOR/AGAINST/ABSTAIN/WITHHOLD) appears for one
unit+proposal+observation. Never collapsed to a single direction.

## Joint reporting

N-PX joint filings list other included managers on the summary page and
per-record `voteManager`/`otherManagers` refs. `voting_managers` resolves
refs to `number:name`; units get series names from the cover page.

## Dissent

`against_management` is defined per source (above). NULL for OTHER/UNKNOWN
sides, DO_NOT_VOTE, missing recommendations, or missing alignment.

## Significance filtering

SRD II lets managers exclude non-significant votes. Disclosure level +
documented significance criteria are first-class per reporter×season
(`disclosure_seasons`). BBVA AM documents criteria (attendance premium, >1%
delegated holdings, IBEX-35, >0.07% EU/NA, >€12M, strategic >0.04%/€10M).
Higher disclosed-vote counts must never be read as "more active".

## Comparability rules

- Reporter-vs-reporter metrics computed on observed intersections only
  (same issuer + meeting + proposal + both disclosed).
- No cross-source share-weighted aggregates (N-PX share units vs VDS units are
  not proven comparable).
- `shares_voted`/`shares_on_loan` are nullable by design.

## Publication lag

`source_lag_days` / `published_at` tracked where the source gives dates;
VDS publication lag derives from register observation, not legal deadlines.

## Known limitations

- N-PX `figi` absent in sampled 2026 filings; OI lacks CUSIP identifiers today.
- VDS is an undocumented internal API — adapter fragility is the main
  operational risk (contract tests + thin client mitigate).
- Meeting identity across sources keys on issuer+date; a postponed meeting
  reported on different days would split (QA surfaces, manual merge possible).
- UNRESOLVED/AMBIGUOUS buckets are intentional product surfaces, not errors.
