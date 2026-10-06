# PROJECT-STATUS — votes-es

Updated: 2026-10-06 · Phase: **G0 complete → GO_FULL decision**

## Current state

```
G0-A (N-PX coverage)        PASS
G0-B (Spanish disclosures)  PASS (CaixaBank ✓ BBVA ✓ Ibercaja summary-only)
Decision                    GO_FULL → G1 (canonical schema + ingest)
```

## What was built

- Repo skeleton (`src/votes_es`, `data/{raw,coverage}`, `docs`, `fixtures`).
- `scripts/bench_npx.py` — streaming N-PX proxyTable parser + benchmark.
- `scripts/coverage_probe.py` — Spanish-issuer coverage probe.
- `scripts/extract_spanish.py` — → `data/coverage/2026.parquet` (2,102 rows).
- `tools/sec.exe` — sec-cli v0.0.2 pinned (discovery only).
- Evidence captures: `data/raw/vds_*.json`, `data/raw/vds_capture.txt`,
  `data/coverage/npx_daily_count.jsonl`.

## What was verified

- N-PX XML schema in the wild (both `inf:`-prefixed and default-namespace
  variants; `VoteTableSchemaVersion:X0300`).
- Streaming parse at 60 MB/s bounded RSS (185 MB file → 38 MB peak).
- ISS VDS JSON API for CaixaBank AM (11006) and BBVA AM (7216): meetings list
  + per-fund per-proposal votes incl. management recommendation.
- Art. 47 ter Ley 35/2003 text (BOE consolidated): vote-direction disclosure
  mandatory, significance exclusion permitted.
- OpenInstrument local canonical dataset: ISIN→LEI resolution works.

## What failed / limitations

- sec-cli v0.0.2 unusable as N-PX parser (3 bugs — see SEC-CLI-SMOKE.md).
- Ibercaja: no itemized disclosure (image-PDF reports only).
- VDS API is undocumented/internal → adapter fragility risk.
- VDS reuse status `PUBLIC_ACCESS_REUSE_UNCLEAR` → derived-facts-only policy.
- FIGI absent in sampled 2026 N-PX filings.
- `howVoted` non-standard values exist (`1 YEAR`, `THREE YEARS`, `2.0`…).

## Data counts

- N-PX season-2026 filings: ≥8,000 (peak day 1,360).
- Sample: 2,102 ES-issuer vote records from 4 fund filings; 62 issuers.
- BBVA VDS: 7,053 meeting rows (2025–26), 504 ES meetings, 53 issuers.
- CaixaBank VDS: 2,812 meeting rows (2026 YTD), 71 ES meetings.

## Source/provenance status

| Source | reuse_status | adapter |
|---|---|---|
| SEC EDGAR N-PX | OPEN (public, UA-required) | own iterparse — G1 |
| ISS VDS (CaixaBank 11006) | PUBLIC_ACCESS_REUSE_UNCLEAR | IssVdsAdapter — G1 |
| ISS VDS (BBVA 7216) | PUBLIC_ACCESS_REUSE_UNCLEAR | IssVdsAdapter — G1 |
| Ibercaja | PUBLIC_ACCESS_REUSE_UNCLEAR | none (summary only) |

## Next decision

Proceed G1: domain model + canonical schema + NpxProvider + IssVdsAdapter +
issuer universe via OpenInstrument snapshot + golden fixtures.
