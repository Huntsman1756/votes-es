# votes-es

Institutional voting at Spanish listed companies.

Search how asset managers and institutional investors publicly disclosed their
votes at shareholder meetings of Spanish issuers.

**Sources:** SEC Form N-PX (public release). Spanish asset-manager SRD II
disclosures (ISS VDS registers) are supported experimentally but their vote
rows are **not redistributed** in the public deployment while reuse
conditions remain under review — their metadata and source links are shown.

Coverage is source-dependent. An undisclosed vote does not mean that no vote
was cast.

## Status

`v0.1.0` — **LIVE at https://votes.h1756.es** · N-PX 2026 season ingested
through SEC index cutoff 2026-10-07: **165,544 canonical votes · 179
meetings · 4,416 proposals · 105/127 issuers resolved · 947 N-PX reporters ·
1,330 split components · 171 superseded amendments**. 11,952 filings
discovered, 0 ingest failures.

See [docs/G0-DECISION.md](docs/G0-DECISION.md) for gate evidence,
[PROJECT-STATUS.md](PROJECT-STATUS.md) for live state,
[docs/METHODOLOGY.md](docs/METHODOLOGY.md) for definitions.

## Quick start

```bash
uv pip install -e .
votes universe-build                       # issuer universe (OpenInstrument + seed)
votes ingest npx-file data/raw/sec/filings/<dir>
votes ingest vds iss_vds:caixabank-am --from 2026-01-01 --to 2026-10-06
votes build                                # bronze -> silver -> gold (DuckDB)
votes validate
votes coverage
votes meetings Iberdrola
votes meeting <id>                         # proposal x reporter pivot
votes compare "CaixaBank" "BBVA"
votes sources
votes export --format parquet              # OPEN_REUSE_CONFIRMED only
```

## Layout

```
src/votes_es/        domain + adapters + pipeline + CLI
scripts/             G0 probes & benchmarks
data/                raw/bronze/silver/gold artifacts (gitignored)
fixtures/            committed golden inputs (real-derived)
docs/                gates, methodology, source memos
tools/               pinned external binaries (sec-cli for discovery)
```

## Principles

- `NOT_OBSERVED` ≠ "did not vote" ≠ "abstain". Absence is preserved everywhere.
- `shares_voted` is never compared across source types.
- Disclosure level + significance criteria are first-class per reporter/season.
- Every fact carries provenance (source URL, document, retrieved_at, hash).

## License

Code MIT ([LICENSE](LICENSE)). **Data is not MIT** — see
[DATA-NOTICE.md](DATA-NOTICE.md).
