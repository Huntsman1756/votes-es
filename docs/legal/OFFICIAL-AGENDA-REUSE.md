# OFFICIAL-AGENDA-REUSE — rights gate for the official agenda corpus

G11, 2026-10-07. Governs what may leave the repository in the public
product. Legal model: `NORMALIZED-FACTS-POLICY.md`.

## Source preference (policy going forward)

```text
1 BORME/BOE     AEBOE expressly offers reuse (attribution required)
2 CNMV          regulator channel; reuse under PSI framework —
                REVIEW_REQUIRED until the document-level notice is checked
3 issuer-site   fallback only — METADATA_ONLY for titles
```

## Class conditions

| class | publication | conditions |
|---|---|---|
| BORME/BOE | **ATTRIBUTION_REQUIRED** | "Basado en datos de la Agencia Estatal Boletín Oficial del Estado"; no desnaturalizar el contenido; mark adaptations; no endorsement implied — votes-es is not an official AEBOE product |
| CNMV | **REVIEW_REQUIRED** | hosted under the EU/ES PSI framework; the specific conditions for the two agenda documents were not individually confirmed — treat as METADATA_ONLY until reviewed |
| issuer-site | **METADATA_ONLY** | item number + our normalized factual title + source link; do not republish the verbatim official wording |
| issuer-site (Airbus SE) | **METADATA_ONLY** | Dutch SE; no BORME/CNMV equivalent — issuer notice is the authority |

## Identity ≠ content republication

The canonical identity (`meeting + item number` → `agenda_item_id`,
`canonical_proposal_id`) and the structural fact (votable vs
information-only) are facts usable in every class. What changes by class
is only the *title wording shown* — APIs can serve
`official_item_number` + `source_url` with `title=null` under
METADATA_ONLY without touching IDs.

## Per-meeting matrix (26)

| isin | meeting | source | class |
|---|---|---|---|
| ES0105025003 | 2024-05-08 Merlin | ISSUER | METADATA_ONLY |
| ES0105066007 | 2024-04-25 Cellnex | ISSUER | METADATA_ONLY |
| ES0109067019 | 2024-06-05 Amadeus | CNMV | REVIEW_REQUIRED |
| ES0109067019 | 2025-06-03 Amadeus | BORME-C-2025-1470 | ATTRIBUTION_REQUIRED |
| ES0113211835 | 2024-03-14 BBVA | ISSUER | METADATA_ONLY |
| ES0113211835 | 2024-07-04 BBVA EGM | BORME-C-2024-3268 | ATTRIBUTION_REQUIRED |
| ES0113211835 | 2025-03-20 BBVA | ISSUER | METADATA_ONLY |
| ES0113900J37 | 2024-03-21 Santander | BORME-C-2024-548 | ATTRIBUTION_REQUIRED |
| ES0113900J37 | 2025-04-03 Santander | BORME-C-2025-618 | ATTRIBUTION_REQUIRED |
| ES0118900010 | 2024-04-11 Ferrovial | ISSUER (CNMV OIR copy located) | METADATA_ONLY |
| ES0118900010 | 2025-04-24 Ferrovial | CNMV | REVIEW_REQUIRED |
| ES0121975009 | 2024-06-15 CAF | BORME-C-2024-2142 | ATTRIBUTION_REQUIRED |
| ES0125220311 | 2025-06-25 Acciona | ISSUER | METADATA_ONLY |
| ES0140609019 | 2024-03-21 CaixaBank | ISSUER | METADATA_ONLY |
| ES0140609019 | 2025-04-10 CaixaBank | BORME-C-2025-547 (migrated G11) | ATTRIBUTION_REQUIRED |
| ES0144580Y14 | 2024-05-17 Iberdrola | BORME-C-2024-957 | ATTRIBUTION_REQUIRED |
| ES0144580Y14 | 2025-05-30 Iberdrola | BORME-C-2025-994 | ATTRIBUTION_REQUIRED |
| ES0148396007 | 2023-07-11 Inditex | BORME-C-2023-3863 | ATTRIBUTION_REQUIRED |
| ES0148396007 | 2024-07-09 Inditex | BORME-C-2024-3451 | ATTRIBUTION_REQUIRED |
| ES0148396007 | 2025-07-15 Inditex | BORME-C-2025-3443 | ATTRIBUTION_REQUIRED |
| ES0173093024 | 2024-06-03 Redeia | ISSUER (CNMV OIR copy noted) | METADATA_ONLY |
| ES0173516115 | 2024-05-09 Repsol | BORME-C-2024-983 | ATTRIBUTION_REQUIRED |
| ES0173516115 | 2025-05-29 Repsol | BORME-C-2025-1032 (migrated G11) | ATTRIBUTION_REQUIRED |
| ES0178430E18 | 2024-04-11 Telefónica | ISSUER (CNMV OIR copy located) | METADATA_ONLY |
| NL0000235190 | 2024-04-10 Airbus | ISSUER | METADATA_ONLY |
| NL0000235190 | 2025-04-15 Airbus | ISSUER | METADATA_ONLY |

**Counts**: BORME 13 · CNMV 2 · ISSUER 11 → publishable verbatim
(BORME) 13 meetings; metadata-only 11; CNMV review 2.

Migration: CaixaBank 2025 and Repsol 2025 moved ISSUER→BORME in G11
(verified item-by-item). CNMV OIR copies of the issuer convocatorias
exist (mandatory filing) — located for Telefónica and Ferrovial; the
remaining ISSUER meetings keep the issuer transcription as evidence and
serve metadata-only titles until migrated.

## Publication rule for the API

- `source_type=BORME` → `official_title` verbatim + AEBOE attribution.
- `source_type=CNMV` → pending review: verbatim allowed if the PSI
  conditions check out; else metadata-only.
- `source_type=ISSUER` → `official_item_number` + short factual label
  (our own wording) + `source_url`; never the verbatim notice text.
