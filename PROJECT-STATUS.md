# PROJECT-STATUS — votes-es

Updated: 2026-10-07 · Phase: **G1+G2 complete → G3 (CLI hardening) / G4 (API)**

## Current state

```
G0 reconnaissance           PASS → GO_FULL
G1 canonical schema + N-PX  PASS (schema + provider + universe via OI gen-0004)
G2 Spanish source adapters  PASS (IssVdsAdapter live-verified, both customers)
G3 CLI                      IN PROGRESS (works; cosmetics pending)
G4 API                      pending
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

G3/G4: harden CLI (dissent/source subcommands output polish), FastAPI layer,
then frontend. Full-season N-PX bulk ingest is a scheduled/live job, not a
dev-blocking task.
