# votes-es

Institutional voting at Spanish listed companies.

Search how asset managers and institutional investors publicly disclosed their
votes at shareholder meetings of Spanish issuers.

**Sources:** SEC Form N-PX · Spanish asset-manager SRD II disclosures
(ISS VDS registers).

Coverage is source-dependent. An undisclosed vote does not mean that no vote
was cast.

## Status

`v0.0.1` — **G0 reconnaissance complete; decision GO_FULL.**

See [docs/G0-DECISION.md](docs/G0-DECISION.md) for the gate evidence and
[PROJECT-STATUS.md](PROJECT-STATUS.md) for the live state.

## What exists today

- `data/coverage/2026.parquet` — 2,102 vote records on 62 Spanish issuers
  extracted from sampled N-PX 2026 filings (provenance per row).
- Verified ingestion paths: streaming N-PX parser (60 MB/s, bounded memory),
  ISS VDS API adapter pattern for CaixaBank AM + BBVA AM.
- `tools/sec.exe` v0.0.2 pinned for EDGAR daily-index discovery.

## Layout

```
src/votes_es/        domain + adapters + pipeline (G1)
scripts/             G0 probes & benchmarks
data/raw/            source artifacts (not committed)
data/coverage/       coverage artifacts
docs/              gates, methodology, source memos
tools/               pinned external binaries
```

## Principles

- `NOT_OBSERVED` ≠ "did not vote" ≠ "abstain". Absence is preserved everywhere.
- `shares_voted` is never compared across source types.
- Disclosure level + significance criteria are first-class per reporter/season.
- Every fact carries provenance (source URL, document, retrieved_at, hash).
