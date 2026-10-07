# PROJECT-STATUS — votes-es

Updated: 2026-10-07 · Phase: **G9-R official-agenda anchoring — core done**

## Current state

```text
G0 reconnaissance           PASS → GO_FULL
G1 canonical schema + N-PX  PASS
G2 Spanish source adapters  PASS
G3 CLI + QA                 PASS
G4 API                      PASS
G5 frontend                 PASS
G6 bulk semantics           PASS
G7 deploy                   PASS — https://votes.h1756.es live, v0.1.0
                              (Coolify/Traefik, atomic generations,
                              rollback verified)
G8 source census            PASS — docs/findings/ES-SOURCE-CENSUS.md
G8-B technical spikes       PASS — docs/findings/G8B-SPIKE.md
G8-C MAPFRE adapter         PASS — mapfre_am ingested locally, gated OFF
G9 reconciliation           DONE — matcher + golden corpus + review queue
G9-R agenda anchoring       DONE — 26/26 official agendas sourced; canonical
                              identity = issuer agenda, not reporter wording

N-PX core                   FREEZE — maintenance only
production                  MAINTENANCE — VOTES_PUBLISH_VOTE_SOURCES=sec_npx
NEXT                        v0.2.0 data layer when reuse unblocks MAPFRE
```

## Data counts (local build)

| Layer | Value |
|---|---|
| N-PX bronze (raw) | 25.48M component rows, 5,623 voting reports |
| VDS bronze | 27.4K rows — research only, publication blocked |
| MAPFRE bronze | 9,552 rows · 2023–2025 · 6 quarantined · 301 non-voting |
| Silver votes | 194,167 canonical (165.5K sec_npx + 27.4K vds + 964 mapfre) |
| Meetings | 261 canonical |
| Issuers | 143 in-universe (4 via HISTORICAL_OVERRIDE) |
| MAPFRE×N-PX shared meetings | 26 |
| Official agenda corpus | 26 meetings / 435 items (BORME+CNMV+issuer) |
| MAPFRE→official | 278/278 auto-anchored, 0 ambiguous, 0 unmatched |
| N-PX→official | 352 wordings → 258 auto / 82 ambiguous / 12 unmatched |

## Source rights model (four fields on `sources`)

```text
sec_npx      PUBLIC_DOCUMENT / extraction PERMITTED / OPEN
mapfre_am    PUBLIC_DOCUMENT / extraction UNKNOWN / PERMISSION_REQUIRED
iss_vds:*    PUBLIC_WEB_APP / PROHIBITED_BY_TERMS / PERMISSION_REQUIRED
             reuse = BLOCKED_PENDING_WRITTEN_PERMISSION (no new crawls)
```

Public production serves **sec_npx only**; release validation guards
restricted-source leakage.

## G9 artifacts

- `src/votes_es/reconcile/` — normalize / matcher / report (deterministic,
  one-to-one, margin-gated; `UNMATCHED` is a valid outcome)
- `reports/proposal_matches.parquet` — 278 MAPFRE instances, evidence per pair
- `reports/proposal-match-review.csv` — review queue, lowest confidence first
- `tests/golden/proposal_matching/reviewed_matches.csv` — 68 manually
  REVIEWED=SAME + 210 UNRESOLVED; auto-match precision on corpus = 100%
- `src/votes_es/reconcile/anchor.py` + `proposal_semantics.csv` +
  `report_anchor.py` — official-agenda anchoring layer (G9-R)
- `scripts/build_official_agendas.py` + `scripts/fetch_borme.py` — agenda
  corpus builder (26 meetings, `data/reference/official_agendas/`)
- `reports/official_anchor_{mapfre,npx}.parquet` + `official-anchor-review.csv`
- `scripts/g9_compare_anchors.py` → `docs/findings/G9R-COMPARISON.md` —
  anchored comparison: BlackRock 298 pairs / Vanguard 120 / State Street 96;
  Inditex-2025 item 8 divergence preserved (MAPFRE FOR, BlackRock AGAINST)
- `docs/PROPOSAL-IDENTITY.md` — the frozen match model
- `docs/prior-art/PROPOSAL-MATCHING.md` — baseline critique

## Key semantics (do not regress)

- N-PX `managementRecommendation` = alignment flag, not recommendation
  direction. MAPFRE carries the direction — comparable metric between them
  is `against_management`, never a reconstructed N-PX direction.
- MAPFRE `Non-Voting` = agenda entry, never a canonical vote; blank vote on
  a votable item = DO_NOT_VOTE (observed abstention-from-vote).
- Absence of data = NOT_OBSERVED, never inferred "did not vote".
- Amundi/Sabadell, Santander, Bankinter votes live behind ISS VDS and stay
  blocked; Amundi attribution is group-level only.

## Ops / files

- Rebuild: `votes build` (~10 min; 19 GB N-PX bronze — acceptable, no need
  to optimize). `votes reconcile proposals` runs in seconds over gold.
- Docs: ARCHITECTURE, METHODOLOGY, DATA-MODEL, PROVENANCE, DEPLOY,
  PROPOSAL-IDENTITY; findings under docs/findings/; permission drafts under
  docs/legal/ (unsent).
- Scratch: `F:\Temp\g8-census\` (spike scripts, MAPFRE PDFs — purgable).
- Identity gaps: universe is a *current-listing* photo — temporal overrides
  live in `src/votes_es/reference/historical_universe.csv` (evidence-
  stamped, not seed-blind).
