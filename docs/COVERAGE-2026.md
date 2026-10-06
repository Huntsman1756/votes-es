# N-PX Coverage Probe — Season 2026

Date: 2026-10-06. Method: download selected 2026-season N-PX vote tables from
EDGAR, stream-parse, filter records whose ISIN is in the known Spanish-issuer
set or starts with `ES` (identifier match only — name matches treated as
suspect, see below). Output artifact: `data/coverage/2026.parquet`.

## Filing universe (season 2026)

Daily master-index scan (`sec daily --form N-PX`), 2026-08-01 → 2026-10-06:

- **≥8,000 N-PX filings** observed (peak days: 8/27: 1,080 · 8/28: 1,215 ·
  8/31: 1,360 — deadline week; earlier days capped at first pass).
- ≥6,700 distinct registrant names (many trusts file once per series bundle).
- Two report types confirmed in the wild: `FUND VOTING REPORT` (registered
  funds — full proxy record) and `INSTITUTIONAL MANAGER VOTING REPORT`
  (Section 14A scope only, e.g. Kingdon Capital: 42 records, all category
  `SECTION 14A SAY-ON-PAY VOTES`).

## Sampled files (subset — 6 of ~8,000 filings)

| Registrant | Accession | Vote table | Spanish records |
|---|---|---|---|
| iShares Trust (BlackRock) | 0001438934-26-002278 | 184.8 MB | 724 |
| iShares Trust (BlackRock) | 0001438934-26-002282 | 70.6 MB | 433 |
| Vanguard Intl Equity Index Funds | 0001104659-26-101952 | 122.1 MB | 894 |
| Vanguard Index Funds | 0001104659-26-102001 | 18.5 MB | 0 (US-only bundle) |
| SPDR Series Trust (State Street) | 0001193125-26-351549 | 105.8 MB | 51 |
| Kingdon Capital (mgr report) | 0001000097-26-000008 | 42 KB | 0 |

## Results from sample only

- **2,102 Spanish-issuer vote records**; **~62 distinct issuer labels**; 65
  issuer-meeting pairs; mostly 2025/2026 AGMs (meeting window Jul-2025→Jun-2026
  per N-PX reporting period).
- Reporters-per-issuer within this tiny sample: 1→34 issuers, 2→15, 3→12,
  4→1 (BBVA seen in all 4 non-empty filings).
- Largest covered issuers (votes observed): Iberdrola 138, CaixaBank 102,
  Santander 88, BBVA 85, Merlin 76, Sabadell 74, Repsol 68, Redeia 65,
  Colonial 60, Endesa 60, Telefónica 60, ArcelorMittal 57, Naturgy 56,
  Mapfre 56, Cellnex 56.
- Field coverage on extracted rows: `shares_voted` 100%, `isin`/`cusip` 100%,
  `figi` 0% (not reported in sampled 2026 filings), categories 100% (incl.
  multi-category rows), `otherManagers` on BlackRock/Kingdon, `voteSeries` on
  BlackRock/Vanguard.
- Dissent signal exists: observed AGAINST/divergence concentrated in
  `ENVIRONMENT OR CLIMATE`, `CORPORATE GOVERNANCE` (e.g. Colonial 7/30,
  Naturgy 12/26, Elecnor 8/15 divergent votes in sample).
- Vanguard 122MB filing covered **57 ES issuers** alone — long-tail Spanish
  mid-caps appear (Neinor, Puig, Almirall, Unicaja, Pharma Mar, Meliá, Elecnor,
  Grenergy, Vidrala, Prosegur, Línea Directa, Cirsa, Gestamp, Ence…).

## Identity findings (this is the hard part, as expected)

- `ISIN startswith ES` alone is **necessary but not sufficient** — Ferrovial
  (`NL0015001FS8`) and ArcelorMittal (`LU1598757687`) matched only via the
  known-ISIN set; both real Spanish-market issuers.
- ES-ISIN ≠ "Spanish company" in the colloquial sense: `EDP RENOVAVEIS SA`
  (ES0127797019, PT group), `AMREST HOLDINGS SE` (ES0105375002) are
  ES-incorporated foreign-operating issuers — keep as universe members, flag
  jurisdiction properly via LEI/OpenInstrument.
- Name matching is a minefield and must stay evidence-only: regex hits pulled
  `TELEFONICA BRASIL`, `BANCO SANTANDER-CHILE`, `BANCO BBVA PERU`,
  `SANTANDER BANK POLSKA`, `HIDROVIAS DO BRASIL` — all foreign subsidiaries.
  Name match must never promote to canonical without identifier or manual
  review (`match_method` + `review_status` in the model).
- Issuer-name alias noise is real (`Unicaja Banco SA` vs `UNICAJA BANCO S.A.`,
  CAF variants) → canonical issuer keyed by ISIN→LEI via OpenInstrument,
  aliases stored verbatim.
- `voteSeries` granularity: BlackRock files per-series rows — dedup key must
  include series/reporting-unit, not just (issuer, meeting, proposal).
- OpenInstrument canonical dataset (local, v0.3.0 alpha) resolves all 6 test
  ISINs to LEI; 100,623 ES-ISIN instruments present; usable as identity
  backend — needs an equity/listings filter (FIRDS venue = BME MICs) for the
  "Spanish listed" universe definition, which also captures NL/LU ISINs listed
  on XMAD.

## Gate assessment (G0-A)

Sampled **4 full-proxy filings + 1 manager filing** already yield ≥3 fund-level
reporters on ~12 Spanish issuers — and the season contains ~8,000 filings.
Full-proxy coverage is demonstrably abundant for IBEX-35-scale issuers and
meaningful well into mid-caps.

**Verdict: PASS** (parser proven, identity resolvable, coverage gate exceeded
by inspection of 4 files — projected coverage after full ingest is far above
the 10–15 issuer × ≥3 reporter bar).
