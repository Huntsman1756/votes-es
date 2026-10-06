# SOURCE-MEMO — Ibercaja Gestión

| Field | Value |
|---|---|
| Source name | Ibercaja Gestión, S.G.I.I.C., S.A.U. |
| Official owner | Ibercaja Gestión (Grupo Ibercaja) |
| Legal basis | Ley 35/2003 art. 47 ter (SRD II / Ley 5/2021) |
| Public URL | `https://www.ibercajagestion.com/` → "Política de implicación" section |
| Years available | Informe de Implicación 2023, 2024, 2025 (PDFs on cdn.ibercaja.es) |
| Current season | 2025 report published (`informe-implicacion-ibercaja-gestion-2025.pdf`) |

## What is published

| Aspect | Observation |
|---|---|
| Publication format | **PDF reports only** — `informe-implicacion-*.pdf` (full, 15 pp) + `resumen-implicacion-voto-engagement-*.pdf` (summary, 37 pp) |
| Granularity | **summary/narrative** — aggregate voting stats, engagement actions, examples; NO per-meeting/per-proposal itemized votes observed |
| Itemized vote direction | **NO** — not found in any published artifact |
| Machine-readability | PDFs are **image-based** (2025 full report: 236 extractable chars in 15 pages — text is rasterized/vector graphics); OCR required even for aggregates |
| Fund-level data | No |
| Management recommendation | No |
| Shares voted | No |

## Verified (2026-10-06)

- `informe-implicacion-ibercaja-gestion-2025.pdf` — 2.9 MB, 15 pages, ~236 chars
  extractable (pure image PDF).
- `resumen-implicacion-voto-engagement-ibercaja-gestion-2025.pdf` — 7.4 MB,
  37 pages, same characteristic.
- No ISS VDS link, no JSON/XLSX endpoint, no vote register page on
  ibercajagestion.com. Only policy documents + narrative reports.
- Fund prospectuses (`*_AC.pdf` docs) state voting approach: proxy advisor
  support, distance voting, abstention on conflicts of interest — policy only.

## Legal note

Art. 47 ter.3 requires publishing "el sentido de su voto en las juntas
generales" — Ibercaja's narrative PDFs are arguably thin compliance vs the
itemized VDS disclosures of CaixaBank AM / BBVA AM. Their PRI transparency
report claims they "publish the votes cast at shareholders' meetings" on the
corporate website — the PDFs are what that claim resolves to in practice.

## Access & reuse

| Check | Result |
|---|---|
| robots.txt | cdn.ibercaja.es serves static PDFs; no restriction observed |
| Authentication | none |
| Terms | standard corporate site; PDFs publicly linked |

**Reuse assessment: `PUBLIC_ACCESS_REUSE_UNCLEAR`** — content is a regulatory
disclosure but extracting facts requires OCR of image PDFs with layout risk.
Even with OCR, granularity stays at narrative/aggregate level — not
proposal-level.

## Recommended ingestion

**None for itemized votes.** Optional later:
- OCR pass on annual reports for aggregate metrics (meetings voted, % for/against)
  → reporter profile enrichment only, flagged `disclosure_level=SUMMARY_ONLY`.
- Re-check each season — they may adopt VDS or structured disclosure later.

## Gate assessment

`FAIL` for itemized vote ingestion (meeting→proposal→direction not published).
Not blocking: G0-B needs ≥2 of 3 managers itemized — satisfied by CaixaBank AM
+ BBVA AM.

**Date checked:** 2026-10-06 · **Evidence:** pypdf extraction runs, site crawl.
