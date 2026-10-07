# NORMALIZED-FACTS-POLICY — the legal model of votes-es

G11, 2026-10-07. **Analysis document, not legal advice.** The definitive
review should come from counsel specialised in IP/database law before the
model is relied on at scale — but the design goal is that the product
stands on defensible acts, not on hundreds of individual licences.

## The premise change

`votes-es` is **not** a document aggregator. It is a *facts-with-rights*
system: we read public/disclosed records and emit our own normalized
rows — issuer, meeting, agenda item, reporter, direction, provenance.
The public product is a new database with our schema; source documents,
layouts and expressive texts stay out of it.

```text
ANTES (rejected)
    "No explicit licence" → do not publish anything

AHORA
    "No explicit licence" → classify the actual act:
        access? extraction? individual factual reuse?
        bulk database reproduction? expressive text reproduction?
        contract/ToS restriction?
    → publish only the layer that is defensible
```

## Rights model — four independent questions

Per `SourceDef` in `src/votes_es/sources/registry.py`:

| field | values |
|---|---|
| `technical_access` | PUBLIC_DOCUMENT · PUBLIC_DATASET · PUBLIC_WEB_APP · AUTHENTICATED · BLOCKED |
| `extraction_terms` | PERMITTED · PERMITTED_FACTS_ONLY · UNKNOWN · PROHIBITED_BY_TERMS |
| `publication_status` | OPEN · NORMALIZED_FACTS_ALLOWED · METADATA_ONLY · PERMISSION_REQUIRED · PROHIBITED |
| `text_reuse` | FULL · SHORT_LABELS · NONE |

## Legal anchors (Spanish/EU)

- **art. 47 ter LIIC** — SGIICs must disclose annually how they voted,
  including (for significant votes) the direction. The facts are destined
  for public knowledge by law. The statute does not grant an open-data
  licence — hence facts-only, not document republication.
- **LSC** — listed issuers must disseminate convocatorias through CNMV +
  issuer web + BORME or a national newspaper. The official agenda is
  obtainable from regulator/official channels; issuer sites are fallback.
- **LPI art. 12** — database copyright protects original *selection or
  arrangement*; the protection does not automatically cover the
  contents. Our schema, ordering and identifiers are ours.
- **sui generis right (LPI arts. 133-137)** — a substantial investment in
  obtaining/verifying/presenting contents can vest a sui generis right;
  lawful users may extract insubstantial parts; systematic exploitation
  harming the maker is restricted. An itemized annual disclosure is a
  small fixed register — using *facts* for a different product is the
  conservative-but-arguable act; copying the whole document is not.
- **Ley 37/2007 (PSI re-use)** — public-sector documents reusable
  (commercial or not) subject to conditions; BORME/BOE reuse is expressly
  offered by AEBOE with attribution. See OFFICIAL-AGENDA-REUSE.md.

## Source classes, not per-issuer negotiations

| class | example | policy |
|---|---|---|
| public-sector reuse regime | BORME/BOE | ingest + publish per conditions; AEBOE attribution |
| regulator disclosure | CNMV, SEC EDGAR | per-source policy, once per platform |
| mandatory private disclosure | SGIIC PDFs (MAPFRE…) | PERMITTED_FACTS_ONLY → NORMALIZED_FACTS_ALLOWED |
| third-party platform | ISS VDS | PROHIBITED_BY_TERMS → blocked *from that source* |
| issuer website | JGA agenda | fallback only; METADATA_ONLY |

A blocked *platform* does not block the *facts*: if a manager later
publishes the same register as its own PDF/CSV/CNMV filing, a new adapter
targets that acquisition chain — same fact, different provenance.

## What the product must never publish

- source PDFs/HTML, logos, layouts
- full wording of private proposals verbatim
- copied 1:1 registers presented as the original
- editorial text or full rationales of a manager

Source wording is preserved in bronze/silver as provenance; the public
surface shows canonical titles + short factual labels.

## Individual decisions

- **MAPFRE AM** — `NORMALIZED_FACTS_ALLOWED`, facts-only, attribution +
  source link required. A written confirmation request is drafted and
  should be sent, but the reply is **not** a publication dependency.
  Enabling still requires `VOTES_PUBLISH_VOTE_SOURCES` — an explicit
  operator decision, not a silent side-effect.
- **ISS VDS** — `PROHIBITED_BY_TERMS` / `PERMISSION_REQUIRED`; no
  extraction. Metadata + source links only.
- **SEC N-PX** — `OPEN_REUSE_CONFIRMED` (US government work).
