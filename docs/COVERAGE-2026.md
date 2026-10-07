# Coverage — N-PX season 2026 (bulk run 2026-10-07)

## EDGAR manifest (`data/raw/manifests/npx-2026.jsonl`)

| Metric | Count |
|---|---:|
| Filings discovered (2026Q3–2027Q1 `form.idx`) | **11,952** |
| N-PX originals | 11,811 |
| N-PX/A amendments | 141 (126 RESTATEMENT, 15 NEW PROXY) |
| Voting/combination reports parsed | **5,623** |
| Notice reports (no vote table) | 6,329 |
| Download failures | **0** |
| Raw vote components parsed | **25,481,059** |
| Bytes downloaded | ~19.0 GB |

Report-type split: 3,556 INSTITUTIONAL MANAGER VOTING, 1,916 FUND VOTING,
152 COMBINATION, 5,134 IM NOTICE, 1,194 FUND NOTICE.

## Canonical (silver/gold) — Spanish-listed universe only

| Metric | Count |
|---|---:|
| Canonical votes (in-universe) | **192,963** |
| — SEC N-PX | 165,544 |
| — CaixaBank AM (VDS) | 18,071 |
| — BBVA AM (VDS) | 9,348 |
| Meetings | 179 |
| Proposals | 4,416 |
| Issuers (universe members covered) | 105 of 127 |
| N-PX reporters | 947 |
| Reporting units (funds/series) | 2,061 |
| Split-vote component rows preserved | 1,330 |
| Filings superseded by restatement | 171 |
| N-PX dissent observations (alignment=AGAINST) | 9,275 |
| Identity: EXACT_ISIN / AMBIGUOUS / out-of-universe | 202,338 / 2,441 / 23.85M |

Out-of-universe rows are expected: N-PX covers global holdings; the product
materializes only Spanish-listed issuers (~0.8% of N-PX volume).

## Revalidated headline metric

CaixaBank AM vs BBVA AM on observed common proposals: **698 common,
96.8% agreement** — consistent with the earlier 707/96.9% (delta from
restatement supersession + proposal-cluster dedup).

## Caveats

- `against_management` for N-PX derives from the alignment flag — see
  docs/findings/NPX-MANAGEMENT-SEMANTICS.md.
- 10 issuers remain unresolved (WARN); 1,939 votes on AMBIGUOUS identity.
- VDS rows present in dev gold; public deploy gates them via
  `VOTES_PUBLISH_VOTE_SOURCES`.
