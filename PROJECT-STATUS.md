# PROJECT-STATUS — votes-es

Updated: 2026-10-07 · Phase: **G6 N-PX bulk semantics — in progress**

## Current state

```
G0 reconnaissance           PASS → GO_FULL
G1 canonical schema + N-PX  PASS
G2 Spanish source adapters  PASS
G3 CLI + QA                 PASS
G4 API                      PASS
G5 frontend                 PASS
G6 bulk semantics           IN PROGRESS
    semantic audit          PASS (alignment vs recommendation direction —
                                 see docs/findings/NPX-MANAGEMENT-SEMANTICS.md)
    amendments              PASS (RESTATEMENT supersedes / ADDITIVE adds;
                                 unknown stays flagged)
    split votes             PASS (components kept + is_split flag)
    joint reporting         PASS (manager refs resolved to names;
                                   series id→name from cover page)
    bulk 2026               PASS (11,952 filings discovered, 5,623 voting
                                   reports parsed = 25.48M components;
                                   0 failures; 19.0GB)
    coverage QA             PASS (all checks; new semantic gates green)
    reuse gate              DOCUMENTED (VOTES_PUBLISH_VOTE_SOURCES;
                                       VDS rows excluded by default)
G7 deploy                   SCAFFOLDED (Coolify/Traefik on h1756 VPS is the
                              target — see h1756.es baseline; wildcard
                              *.h1756.es already resolves. Not deployed.)
```

## What was built (this session)

- Full package `src/votes_es/`: domain enums+models, normalization
  (direction/categories/text), identity (OI snapshot adapter + universe +
  resolver w/ match evidence), sources (`sec_npx` streaming provider + EDGAR
  discovery; `iss_vds` client+adapter), storage (bronze/silver parquet +
  DuckDB gold), pipeline (ingest + silver build), quality checks, Typer CLI.
- Issuer universe: 132 instrument rows = XMAD-listed equities (OI
  generation-0004) ∪ seed CSV. Ferrovial NL / ArcelorMittal LU confirmed
  inside via venue rule.
- Golden fixtures (real-derived): both N-PX namespace variants, a 14A manager
  report + primary_doc, VDS api/4/14/7 payloads (BBVA×Iberdrola, 23 proposals).
- 20 tests green: unit / golden / contract / end-to-end integration.

## What was verified live

- `votes ingest vds iss_vds:caixabank-am` → 18,239 vote rows
  (77 ES-universe meetings, 1,207 api/7 calls, zero errors).
- `votes ingest vds iss_vds:bbva-am` → 9,348 vote rows (45 ES meetings).
- N-PX bronze from 7 real filings (incl. 185 MB BlackRock): 751K rows.
- `votes build`: 29,579 votes, 85 meetings, 78 issuers, 1,278 proposals;
  identity: 29,695 EXACT_ISIN, 0 unresolved-in-universe, 21 AMBIGUOUS votes.
- `votes validate`: all checks PASS (2 informative WARN).
- Iberdrola AGM 2026-05-29 pivot works across sources: CaixaBank AM + BBVA AM
  + BlackRock + Vanguard, 23 aligned proposals.

## Bugs found & fixed during G1

- VDS api/14 `SortByColumn=MeetingDate` returns `{}` on some customers →
  sort by CompanyName.
- VDS per-customer date window enforced server-side (`api/2` StartDate/
  EndDate) → client clamps from config.
- Identity resolver never cached misses → per-row DuckDB queries (28 ms/row);
  now negative-cached + bulk warm.
- Identical proposal texts with different ballot items (Iberdrola 2×
  "Approve Scrip Dividends") merged incorrectly → ballot-conflict guard.
- vote_id collisions on source-emitted duplicate rows → key now includes
  direction/raw/shares + exact-dup collapse (138 observed).
- Windows: `:` illegal in dirs → source dir names sanitized; cp1252 console
  → ASCII-only CLI output.

## Known limitations

- OI identifiers lack CUSIP scheme → CUSIP-resolution lane idle (ISIN coverage
  ~100% on ES issuers anyway).
- ~7 N-PX filings ingested (sampled giants); full-season (~8K filings) bulk
  download not yet run.
- Some OI-resolved issuers show ISIN as canonical_name (missing legal_name
  upstream) — cosmetic, alias layer covers search.
- VDS reuse remains PUBLIC_ACCESS_REUSE_UNCLEAR → exports/API emit
  SEC-sourced rows only for now (DATA-NOTICE).

## Data counts

| Source | Votes | Meetings | ES issuers | Dissent |
|---|---|---|---|---|
| SEC N-PX (7 filings) | 2,160 | 66 | 63 | 3 |
| CaixaBank AM (VDS live) | 18,071 | 75 | 72 | 2,042 |
| BBVA AM (VDS live) | 9,348 | 45 | 44 | 278 |
| **silver total** | **29,579** | **85** | **78** | |

Reporters/issuer observed: 16 issuers×1, 18×2, 14×3, 26×4, 3×5.

## Next decision

Remaining: full-season N-PX bulk ingest (scheduled/live job), real deploy
of votes.h1756.es (needs host + mounted gold), scheduled refresh automation,
more Spanish SGIIC VDS customers discovery. API surfaces: status, seasons,
issuers, issuer, meetings, meeting votes+pivot, reporters(+detail), compare,
categories, sources. compare CaixaBank vs BBVA live: 707 common proposals,
96.9% observed agreement.

- `docs/findings/ES-SOURCE-CENSUS.md` — G8 census of Spanish manager vote disclosures (A/B/C classification; MAPFRE itemized PDF + Amundi portal identified as group-A candidates; ISS VDS is the concentrated bottleneck).
