# ADR-001 — N-PX bulk ingest strategy: primary-doc gate, full-universe bronze

Status: decided 2026-10-07 (G6)

## Options measured

A. **Two-phase prefilter** — discover → cheap metadata → candidate Spanish
   matches → download only relevant vote tables.
B. **Full ingest** — download every voting filing, parse everything, filter
   at silver.

## Measured evidence (200-filing sample, 2026 manifest)

- 200 filings: 122 voting reports, 78 NOTICE reports (skipped their tables),
  0.90 GB downloaded, ~4 min single-worker.
- Extrapolated season: ~11,952 filings, ~4,500–5,500 voting reports,
  ~50–60 GB raw XML.

## Decision: B with a primary_doc gate

Spanish content cannot be detected without the vote table — the only
identifiers (ISIN/CUSIP) live inside it. A two-phase prefilter would only
avoid downloads if EFTS full-text search reliably indexed vote-table XML
(unverified, fragile). What IS safely skippable is the vote table of
NOTICE/non-voting reports — the primary_doc gate does that already
(~40–45% of season filings, mostly IMs that never voted).

Full-universe bronze is kept deliberately: it preserves auditability,
enables differential validation against third-party datasets, and costs
~2 GB parquet/season — trivial vs the download.

Concurrency: 4 download workers share one token-bucket rate limiter
(≤5 req/s, under SEC's 10/s ceiling); rate, not bandwidth, is the SEC
constraint.

## Consequences

- Season ingest ≈ 1.5–2 h at 4 workers (measured pace ~130–170 filings/min
  in notice-heavy regions, slower on giant fund filings).
- Resume is free: manifest status + per-accession bronze.
- Vote-table XML deleted after parse (content hash in observation →
  re-fetchable); primary_doc + manifest.json retained.
