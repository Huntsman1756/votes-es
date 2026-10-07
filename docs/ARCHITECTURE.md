# ARCHITECTURE — votes-es

Pipeline-first design: ingestion and serving are strictly separated. The
frontend (later) never touches upstream sources; the CLI reads the same gold
DuckDB the API will serve.

## Data flow

```
SEC EDGAR N-PX                     ISS VDS registers (SGIIC)
        │                                    │
  NpxProvider                       IssVdsAdapter / VdsClient
  (streaming iterparse,             (getVdsData 4/2/14/7,
   ~60 MB/s, bounded RSS)            1 req/s, declared UA)
        │                                    │
        └────────────── bronze ──────────────┘   source-native rows + observations
                       │
                 build_silver()                identity resolve → issuer/meeting/
                       │                       proposal/vote canonicalization
                 silver Parquet                deterministic IDs
                       │
                 build_gold() → DuckDB         serving + QA + coverage
                       │
              ┌────────┴────────┐
            `votes` CLI      FastAPI (G4)
```

## Layout

| Path | Contents |
|---|---|
| `src/votes_es/domain/` | enums + pydantic models (strict) |
| `src/votes_es/normalization/` | vote direction, categories, text/dates/numbers |
| `src/votes_es/identity/` | OpenInstrument snapshot adapter, universe builder, resolver |
| `src/votes_es/sources/sec_npx/` | streaming parser, primary_doc meta, EDGAR discovery, provider |
| `src/votes_es/sources/iss_vds/` | VDS client + adapter (shared by all VDS customers) |
| `src/votes_es/storage/` | pyarrow schemas, bronze/gold IO |
| `src/votes_es/pipeline/` | ingest + silver build |
| `src/votes_es/quality/` | `votes validate` checks |
| `data/{raw,bronze,silver,gold,reference,coverage}` | artifacts (gitignored except coverage samples) |
| `fixtures/{npx,vds}` | committed golden inputs (real-derived) |
| `docs/sources/*/SOURCE-MEMO.md` | per-source reconnaissance (required before crawlers) |

## Key decisions (and why)

- **Own streaming N-PX parser** (not sec-cli): sec-cli v0.0.2 picks the wrong
  document, wrong tags, drops fields — evidence in `docs/SEC-CLI-SMOKE.md`.
  The schema is flat; stdlib `iterparse` with local-name matching handles both
  namespace variants at 60 MB/s bounded memory. sec-cli stays for `daily`
  index discovery only.
- **Local-name XML matching**: filers use `inf:`-prefixed, default-namespace,
  and mixed variants of the same namespace URI.
- **Bronze rows are source-native**, one file per accession (N-PX) or per
  ingest run (VDS). VDS files are per-run, not per-meeting — per-meeting files
  created a small-files problem and duplicate rows on re-pulls.
- **Deterministic IDs**: `sha256` truncations of stable inputs — rebuilds are
  reproducible; votes dedup by content key.
- **Silver drops non-universe rows but counts them** (`out_of_universe`);
  ambiguous name-suspects land in `unr:` pseudo-issuers, visible to QA.
- **DuckDB gold is disposable**: rebuild from silver parquets any time.

## OpenInstrument integration

Read-only consumption of the sibling project's pinned read generation
(`data/read/CURRENT` → `generation-0004`). Universe = equity CFIs with live
`XMAD` listing ∪ committed seed CSV. `OPENINSTRUMENT_ROOT` env var relocates
the snapshot; absent → seed-only mode (CI/tests).

Known gap: OI `identifiers` carries no CUSIP scheme today, so CUSIP→ISIN
resolution is a no-op. ISIN coverage in N-PX is effectively 100% for Spanish
issuers, so impact is minimal; logged as limitation.

## Failure modes

| Failure | Behaviour |
|---|---|
| OpenInstrument absent | seed-only universe (35 ISINs), resolver degrades gracefully |
| VDS API contract change | adapter contract tests fail; thin client isolates blast radius |
| N-PX schema bump | `VoteTableSchemaVersion` header check + golden tests |
| Huge XML | streaming parser, bounded RSS (185 MB → 38 MB) |
| Re-ingestion | N-PX keyed by accession (idempotent); VDS per-run files + content dedup |
