# FINDINGS — N-PX failure taxonomy & known ambiguities (2026-10-07)

Every failure mode observed across G0 smoke tests, real-filing analysis, and
the 2026 bulk run. "Handling" = current behavior; all are test-gated or
QA-visible — none are silent.

## Structural

| # | Mode | Handling | Fixture |
|---|---|---|---|
| S1 | Two XML namespaces (`…/npxproxy/informationtable` vs `…/npxproxy/informationtabletype`) | parser iterates by local-name; both covered | `fund_default_ns.xml`, `fund_inf_ns.xml` |
| S2 | Filer-chosen vote-table names (`proxytable.xml`, `ProxyVotingTable.xml`, `BRDWLB_*.xml`) | `pick_vote_table` heuristic + index.json listing | real files |
| S3 | `<vote>` block without `<voteRecord>` children | emits one row with empty `howVoted` → `UNKNOWN` direction, never dropped | kingdon real XML |
| S4 | Giant vote tables (185 MB observed) | `iterparse` + `elem.clear()` streaming — 60 MB/s, ~38 MB RSS | `blackrock_ishares_185mb.xml` smoke |
| S5 | `primary_doc.xml` missing | `manifest.json` fallback carries accession/CIK/report_type | test-covered |

## Semantic

| # | Mode | Handling |
|---|---|---|
| M1 | `managementRecommendation` is an **alignment flag**, not a direction | `management_alignment`; `management_recommendation` stays NULL for N-PX — see NPX-MANAGEMENT-SEMANTICS.md |
| M2 | Alignment `NONE` = "management made no recommendation" | `MgmtAlignment.NONE`, `against_management=NULL` |
| M3 | Empty/missing alignment element | `management_alignment=NULL`, dissent NULL |
| M4 | Say-on-pay frequency pseudo-directions (`1 YEAR`, `2.0`, `THREE YEARS`) | `direction=OTHER`, dissent NULL |
| M5 | Empty `howVoted` | `UNKNOWN`, never ABSTAIN |
| M6 | Split votes: one unit, multiple directions over share lots | every component kept as a row + `is_split=TRUE`; UI shows SPLIT |
| M7 | N-PX/A `amendmentType` absent on an amendment | kept additive + build warning; never guessed |

## Entity / joint reporting

| # | Mode | Handling |
|---|---|---|
| J1 | `voteManager>otherManagers>otherManager` numeric refs (Vanguard: thousands) | `voting_managers` column preserves refs verbatim |
| J2 | Summary-page `otherManagersManager` list (number/name/CIK) | `npx_filings.other_managers_json` |
| J3 | filer ≠ reporting person ≠ fund ≠ series ≠ included manager | reporter=filing entity; unit=voteSeries; manager refs stored; never collapsed |
| J4 | `voteSeries` absent in single-fund filings | `reporting_unit=REPORTER_SELF` |
| J5 | institutional-manager vs fund report types | `report_type` column; coverage never mixes them |

## Identity

| # | Mode | Handling |
|---|---|---|
| I1 | Row without ISIN (CUSIP-only) | CUSIP lane via OpenInstrument; else UNRESOLVED |
| I2 | ISIN not in universe | row counted out-of-universe; not materialized |
| I3 | Name-only resemblance | `NAME_SUSPECT` → AMBIGUOUS, QA-visible, never auto-promoted |
| I4 | Same proposal text twice in one meeting (Iberdrola "Approve Scrip Dividends") | ballot-conflict guard + ballot/index in proposal_id hash |
| I5 | Exact duplicate source rows (emitters repeat series×proposal) | deterministic vote_id incl. direction/raw/shares; dedup counted in warnings |

## Filing lifecycle

| # | Mode | Handling |
|---|---|---|
| L1 | `N-PX/A` RESTATEMENT | supersedes all earlier filings for (CIK, period); silver materialization=EFFECTIVE/SUPERSEDED |
| L2 | `N-PX/A` ADDS_NEW_PROXY_VOTING_ENTRIES | adds rows alongside; all remain EFFECTIVE |
| L3 | NOTICE / non-voting reports | filing recorded, zero votes — OK, not FAILED |
| L4 | Same accession re-ingested | bronze path keyed by accession (overwrite); observations dedup by id |
| L5 | SEC rate limiting / 403/429/5xx | global limiter + exponential backoff + Retry-After |

## Known ambiguities (surfaced, not resolved)

- `otherManager` numbers are filing-local indices into the summary page —
  they attribute votes to managers *within* a filing only; resolving the
  number → manager name requires the primary_doc list (kept in
  `other_managers_json` for later attribution work).
- `management_recommendation` direction is algebraically derivable for
  FOR/AGAINST N-PX votes but deliberately left NULL (declared-facts rule).
- Report-type `COMBINATION` filings (fund + manager coverage in one filing)
  are treated as voting reports; a single report_type label can't express
  mixed scope — kept verbatim for future split.
