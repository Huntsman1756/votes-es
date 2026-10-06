# G0 DECISION — votes-es

**Decision: `GO_FULL`**

Date: 2026-10-06. Scope of evidence: `docs/SEC-CLI-SMOKE.md`,
`docs/COVERAGE-2026.md`, `docs/sources/*/SOURCE-MEMO.md`,
`data/coverage/2026.parquet`, `data/raw/sec/` captures, `data/raw/vds_*.json`.

## Verdicts

| Track | Verdict | Basis |
|---|---|---|
| G0-A N-PX | **PASS** | Parser solved (streaming, bounded, 60 MB/s); coverage proven |
| G0-B Spain | **PASS** | 2/3 managers itemized via ISS VDS API (verified end-to-end); Ibercaja summary-only |

## N-PX verdict

- ~8,000 filings in season 2026 (Aug–Oct), ≥6,700 filers; deadline clustering
  means bulk-download windowing is easy.
- Real vote tables reach **185 MB** (BlackRock iShares, 200K proxyTables).
  stdlib `iterparse` handles it in ~3 s / ~38 MB RSS → production-safe on the
  8 GB VPS.
- sec-cli v0.0.2 **fails as parser** (wrong document, wrong tags, missing
  fields, broken submissions JSON). Retained only for `daily`/`efts`
  discovery, pinned. Own `NpxProvider` streaming adapter is the plan — a
  small, honest surface; documented in SEC-CLI-SMOKE.
- edgartools evaluated: correct model, MIT, but whole-tree parse (~16× memory)
  and pulls pandas; not needed for ingest. Reference only.
- SEC access is public data with documented bulk-download policy; reuse
  effectively open (attribution + UA identification required).

## Spanish disclosure verdict

- **CaixaBank AM + BBVA AM disclose itemized votes through ISS VDS** — a real
  JSON API (`getVdsData/{4,2,15,14,7}`), verified end-to-end down to
  fund×proposal×direction (Iberdrola 2026 AGM: 23 proposals each).
- One `IssVdsSourceAdapter` serves both — and is reusable for any other
  manager on the same platform (several EU managers are).
- **Ibercaja: summary-only image PDFs** → no itemized votes. It enters the
  product as a reporter with `disclosure_level=SUMMARY_ONLY` profile only.
- BBVA significance criteria are documented in their policy (1% / IBEX-35 /
  0.07% EU-NA / €12M / 0.04%-€10M strategic) — significance metadata model is
  required and already designed into `disclosure_seasons`.
- Reuse status: `PUBLIC_ACCESS_REUSE_UNCLEAR` for both VDS sources. Data is
  their mandatory 47-ter.3 public disclosure; platform is ISS's. Policy for
  V0.1: store derived facts + provenance, link back to VDS; no raw
  republication; pursue written confirmation.

## Coverage metrics (sample: 4 fund filings)

- 62 Spanish-issuer labels, 2,102 vote records, ~1 meeting per issuer (AGM
  season), 10–35 proposals per meeting.
- 12 issuers already at ≥3 fund reporters in-sample; universe scan projects
  ≫15 issuers at ≥3 reporters across the season.
- Vanguard intl filing alone: 57 ES issuers incl. mid-caps.

## Identity findings

- Universe = issuer-centric, identifier-driven (ISIN known-set ∪ ES prefix ∪
  BME-listed foreign ISINs). Ferrovial NL / ArcelorMittal LU confirmed.
- OpenInstrument canonical parquet (local v0.3.0) resolves ISIN→LEI; use it
  via snapshot adapter. Name matching = suspect lane only, never auto-promote.

## Estimated maintenance burden

- N-PX: annual bulk season (Aug–Oct) + trickle; streaming parser stable,
  schema versioned (`VoteTableSchemaVersion:X0300` header).
- VDS: undocumented internal JSON API — biggest technical risk; mitigate via
  thin adapter + contract tests + Playwright fallback for session flow.
- Identity: mostly static once built; CNMV/BME universe refresh quarterly.

## Risks

1. VDS API fragility (undocumented) — medium; fallback = browser capture.
2. Reuse ambiguity on VDS — medium; mitigated by derived-facts-only policy.
3. N-PX institutional-manager reports are 14A-only — must never be merged
   with fund reports in coverage math.
4. Ibercaja gap → set expectations: partial-manager coverage is the product's
   documented reality.

## Recommendation

Proceed to G1: canonical schema + NPX provider (streaming iterparse) +
ISS-VDS adapter (CaixaBank, BBVA) + issuer universe via OpenInstrument
snapshot. Frontend after data correctness gates.
