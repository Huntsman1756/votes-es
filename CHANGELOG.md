# Changelog

## [Unreleased] — G9-R: official-agenda anchoring

- Canonical proposal identity is re-anchored to **issuer/official meeting
  evidence** (BORME convocatoria, issuer AGM notices, CNMV OIR) instead of
  pairwise reporter wording. Fixes the N-PX over-fragmentation defect:
  Inditex 2025 had 35 wording clusters for an official agenda of 10 items.
- `data/reference/official_agendas/` — curated, evidence-stamped corpus
  covering all 26 MAPFRE×N-PX shared meetings: 435 agenda items
  (418 votable, 17 information-only, 206 sub-items), each with
  source_url/source_ref/retrieved_at. Builders: `scripts/fetch_borme.py`
  (BORME/CNMV/PDF agenda extraction, cp1252-safe, ordinal+sub-item parser)
  and `scripts/build_official_agendas.py` (transcribed items per meeting).
- `src/votes_es/reconcile/anchor.py` — source wording → official agenda
  item mapping. Methods: EXACT_OFFICIAL_ITEM / EXACT_OFFICIAL_TEXT /
  RULE_HIGH_CONFIDENCE / AMBIGUOUS / UNMATCHED. Bundled register rows
  anchor to their numbered primary item or stay AMBIGUOUS; Spanish
  roman-numeral agenda items normalized; person-name signal inside a
  meeting sharpens director elections; `ACCOUNTS_SOLO`/`ACCOUNTS_GROUP`
  are never mutually compatible; concept compat (allocation↔dividend,
  generic accounts) only counts when corroborated by the item number or
  a unique official candidate.
- `src/votes_es/reference/proposal_semantics.csv` — controlled concept
  lexicon (EN patterns, ordered specific→generic); no synonym sprawl in
  code.
- `report_anchor.py` + `votes reconcile anchors` →
  `reports/official_anchor_{mapfre,npx}.parquet` + review queue.
  Results: MAPFRE 278/278 auto-anchored; N-PX 352 wordings → 258 auto /
  82 ambiguous / 12 unmatched (custodian noise and genuinely bundled
  wordings preserved as unresolved — never forced).
- `scripts/g9_compare_anchors.py` — cross-source comparison on official
  items: MAPFRE×BlackRock 298 pairs (297 same, 1 divergence), Vanguard
  120 (was 0 under pairwise matching), State Street 96. Golden
  regression: Inditex 2025 item 8 remuneration — MAPFRE FOR vs
  BlackRock AGAINST — preserved.
- 15 new golden tests (`tests/golden/test_anchor.py`), 72/72 pass.
  Production v0.1.0 untouched; anchoring is sidecar-only.

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
