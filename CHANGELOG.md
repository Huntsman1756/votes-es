# Changelog

## [Unreleased] — G8-C: MAPFRE AM adapter + source rights gates

- New `mapfre_am` source adapter (`sources/mapfre_am/`): deterministic
  pdfplumber parser for the ISS "Vote Summary" annex embedded in MAPFRE
  AM's annual reports — document-level vocabulary calibration absorbs the
  ~10pt column drift between the 2023/2024/2025 prints; handles bundled
  director sub-items, vertically-centred markers, page-break rows and
  header-bleed artifacts (quarantine, never silent repair).
- Semantics: MAPFRE carries vote + declared management-recommendation
  direction + explicit For/Against-Management alignment — richer than
  N-PX. Non-Voting items never canonicalize; blank vote on a votable item
  = DO_NOT_VOTE; contradictions quarantine; new quality check
  `mapfre_management_semantics`.
- Reuse model split into four fields on `sources`: `technical_access`,
  `extraction_terms`, `publication_status`, `reuse_status`. VDS sources
  reclassified `BLOCKED_PENDING_WRITTEN_PERMISSION`
  (PROHIBITED_BY_TERMS extraction) after the ISS ToS review; no new
  automated VDS acquisitions. MAPFRE: PUBLIC_DOCUMENT / PERMISSION_REQUIRED
  — rows ingested locally, excluded from the public build.
- Registry: `iss_vds:santander-am` (customer 12772) and `iss_vds:amundi`
  (customer 2858, group-consolidated records) catalogued as metadata.
- Ingested 2023/2024/2025 publications: 9,552 bronze rows, 221/246/220
  meeting blocks, 6 quarantined, 301 non-voting items → 964 canonical
  votes on 35 ES issuers / 98 meetings. Identity finding: 8 ES-ISIN
  meetings dropped = universe gaps (GCO, Applus, Olimpo, Funespaña) +
  legit out-of-universe (EDP Renováveis, old Ferrovial ES ISIN).
- G9 preview corpus: 26 shared MAPFRE×N-PX meetings
  (reports/g9-reconciliation-corpus.parquet).
- Permission-request drafts: docs/legal/{MAPFRE,ISS-VDS}-PERMISSION-REQUEST.md
  (not sent).
- Fixture `fixtures/mapfre/vote_summary_sample.pdf` (synthetic) + golden
  tests for every hard layout case.

## [0.1.0a1] - 2026-10-07 — G1/G2: canonical pipeline + both source tracks working

- Package `votes_es`: domain, normalization, identity, sources, storage,
  pipeline, quality, CLI (`votes`).
- N-PX: streaming parser (both namespace variants), primary_doc metadata,
  EDGAR daily-index discovery + download, manifest-fallback ingest.
- ISS VDS: shared adapter for CaixaBank AM (11006) + BBVA AM (7216);
  live pulls verified end-to-end (27K vote rows over ES universe).
- Identity: universe = XMAD-listed equities (OpenInstrument gen-0004) ∪ seed;
  resolver with match_method/review_status evidence; negative caching.
- Silver: deterministic proposal clustering (ballot > text > Jaccard≥0.6,
  ballot-conflict guard), dissent NULL-safe, dedup, disclosure_seasons.
- `votes validate` — FK/enum/provenance/identity checks → reports/data-quality/.
- Tests: 20 passing (unit + golden + VDS contract + end-to-end integration).
- Docs: ARCHITECTURE, DATA-MODEL, METHODOLOGY, PROVENANCE.

## [0.0.1] - 2026-10-06 — G0 reconnaissance

- N-PX streaming parse proven (185 MB → 3 s / 38 MB RSS).
- sec-cli v0.0.2 evaluated: FAIL as parser, kept for discovery.
- ISS VDS verified end-to-end for CaixaBank AM (cust 11006) + BBVA AM (7216).
- Ibercaja: summary-only image PDFs; not itemized.
- Coverage probe: 62 ES issuers, 2,102 votes from 4 sampled filings.
- Decision: GO_FULL.

## 2026-10-07 — G6-NPX-BULK-SEMANTICS

- Semantic fix (blocking): N-PX `managementRecommendation` is an alignment
  flag, not the rec direction — new `management_alignment` column; N-PX
  `management_recommendation` stays NULL; source-aware dissent (real dissent
  on N-PX rose 3 → 9,275 with full semantics).
- Amendments: `npx_filings` table; RESTATEMENT supersedes same-(CIK,period)
  filings, "NEW PROXY" additive; unknown never flattened; 171 superseded.
- Split votes: every component preserved + `is_split`; pass-through sub-lots
  kept (validated vs proxy-voting-panel which drops them).
- Joint reporting: `voting_managers` resolved number→name via summary-page
  list; units named from `idOfSeries`/`nameOfSeries` map.
- Bulk: quarterly `form.idx` manifest (11,952 filings), bounded-concurrency
  resumable ingest, ~19GB, 0 failures, 25.48M components.
- Differential validation vs proxy-voting-panel: 96,200 matched keys, 0
  direction/alignment disagreements.
- VDS reuse gate: `VOTES_PUBLISH_VOTE_SOURCES` filters served vote rows.
- API+UI: alignment-aware labels, SPLIT chips, `/votes/:id` explain view.
- 38 tests, ruff+mypy clean, all QA gates PASS.
