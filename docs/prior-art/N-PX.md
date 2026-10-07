# Prior art — SEC N-PX bulk pipelines

Reviewed 2026-10-07 for `G6-NPX-BULK-SEMANTICS`. Repos cloned to
`F:\Temp\prior-art\` (not committed).

| Repo | License | Useful idea | We reuse | We reject / why |
|---|---|---|---|---|
| `AshokReddy010/fund-proxy-voting` | MIT | Quarterly `full-index/{year}/QTR{n}/form.idx` discovery (no scraping); resumable accession skip-list; `.part`→rename atomicity; PAUSE+backoff fair access; `records or [{}]` degenerate-row fallback | `form.idx` quarterly discovery; per-accession atomic file rename; filings manifest as skip-list | Their dbt treats `N-PX/A` as just `is_amendment` — no RESTATEMENT vs ADDITIVE distinction; our filings table + superseded semantics fixes that. They keep zero joint-reporting/split detail beyond raw text. |
| `slriggss/proxy-voting-panel` | MIT (MIT LICENSE in repo) | Correctly documents the alignment trap: "`managementRecommendation` records whether the vote was FOR or AGAINST management's recommendation"; `split_vote` flag on multi-position records; per-series×period newest-wins amendment handling; `1 YEAR`/`ONE YEAR`/`1.0` normalization; NOT_A_POSITION bucket ("TAKE NO ACTION") | Confirmed our semantics fix independently; split flag concept; frequency-value normalization already in `normalize_direction` | They collapse splits to main-position-by-shares for the UI and pick "the flag that goes with the main position" — we preserve all components and per-component alignment instead. Amendment override ignores restatement-vs-additive (newest always wins per series). |
| `Kamran06/proxy-voting-analysis` | none stated (public repo) | Per-CIK submissions.json discovery for known filers; file-size heuristic to find the vote table (`size > 10000`) | size heuristic as secondary vote-table signal | Only fixed 3 institutions; regex-free local-name handling already ours; no provenance layer |
| `tianrking/sec-cli` (pinned tool) | MIT | `daily` index listing, EFTS search | Discovery/debugging aid | Parser unusable for N-PX (wrong document, wrong tags) — see docs/SEC-CLI-SMOKE.md |
| `jadchaar/sec-edgar-downloader` | MIT | submissions.json per-CIK path; filing-dir download | — (quarterly index is cheaper for bulk season) | Per-filer scope, not season-wide |
| `dgunning/edgartools` | MIT | Full EDGAR object model | Noted for future hardening if we need more form types | Heavy dependency for one form type; our streaming parser already faster than needed |

## Net decisions taken

1. **Discovery**: quarterly `form.idx` over daily indexes or submissions.json —
   single file per quarter lists every N-PX/N-PX-A with CIK+date+accession.
2. **Amendments**: our `filings` table keeps `amendment_no`/`amendment_type`;
   silver materializes RESTATEMENT as superseding prior filings of the same
   (CIK, period); ADDITIVE stays additive. Neither prior repo does this.
3. **Split votes**: preserved as component rows + `is_split` flag (stronger
   than proxy-voting-panel's single collapse).
4. **Alignment semantics**: our `management_alignment` column carries the
   flag verbatim; `management_recommendation` stays NULL for N-PX.
5. **Joint reporting**: `voteManager>otherManagers` refs + summary-page
   manager list captured; votes keep `voting_managers` refs.
