# G8-B spike — MAPFRE PDF extraction + Amundi portal reconnaissance

Date: 2026-10-07. Scope: technical feasibility only, no ingest changes.

## MAPFRE AM — technical extraction: PASS

### Source

Annual report PDFs on `mapfream.com` embed an **ISS "Vote Summary"**
record — per-meeting blocks with `Item / Proposal / Proposed by / Vote /
Management Recommendation / For/Against Management`. Richer than N-PX:
carries the actual management *recommendation direction*, not only
alignment.

### Layout findings (answers to the gate questions)

- **Meetings auto-detected**: `Security` label line at left margin after a
  caps company-name line; header carries ISIN, ticker, meeting date/type,
  agenda number, record date, vote deadline, country.
- **Rows**: item markers `\d+[A-Za-z]?\.?` in the item margin.
- **Sub-items**: bundled elections print numbered sub-rows inside the
  proposal column with their own trailing values (e.g. `1 Anne H. Chow`);
  split rule works (`item` → `1.1`-style ids).
- **Vertically-centred markers** (2023 print): the marker line can sit
  ~1pt *below* the proposal's first line and carry no proposal words —
  rule: marker line without proposal-band words merges into the open row.
- **Merged cells**: none — purely positional.
- **Wrapped proposals**: proposal-band-only lines append; ~22–25 rows/year
  span a page break — handled.
- **Column drift between years**: ~10pt shift between the 2023 and 2025
  prints. Solved by **document-level calibration**: histogram the x0 of a
  closed cell vocabulary (`Management/Shareholder/Non-Voting/For/Against/
  Abstain/Withheld/None/*Years*`), take the 4 dominant peaks as column
  left-edges. No per-year code.
- **Headers repeat per meeting** — skipped by closed word-set match.

### Extraction stats (spike parser, deterministic, ~200 lines)

| year | rows | meetings | missing proposal | missing company | empty vote | artifacts |
|---|---|---|---|---|---|---|
| 2023 | 3,239 | 218 | 1 | 8 | 104 | 3 |
| 2024 | 3,392 | 241 | 0 | 10 | 74 | 0 |
| 2025 | 2,921 | 217 | 0 | 28 | 109 | 3 |

Empty votes are *legitimate*: `Non-Voting` agenda items and items MAPFRE
did not vote (mgmt rec present, vote blank) — maps to NOT_OBSERVED, never
invented. Artifacts = column-header bleed on 1–4 lines/year; detectable
(non-vocabulary trailing values) → quarantine rule, not silent pass.

### Spanish coverage (the rows that matter)

| year | ES rows | ES issuers |
|---|---|---|
| 2023 | 353 | 34 (Iberdrola, Inditex, Santander, BBVA, CaixaBank, Repsol…) |
| 2024 | 329 | 36 |
| 2025 | 314 | 31 |

≈ **1,000 proposal-level rows on Spanish issuers over 3 seasons** —
enough for a real comparison column. Note: 2025 narrative claims 220
meetings voted vs 217 meeting blocks parsed — small delta to reconcile in
the adapter (meetings with zero votable items vs parse misses).

### Provenance per row

`source_document` + `source_sha256` + `page` + `row_top` (+`page_end`),
raw `item`, raw proposal text, raw vote/mgmt-rec/for-against strings.
Parser version pinning needed in the real adapter (layout-drift code).

### Reuse status

**A-TECHNICAL, not yet A-PUBLISHABLE.** No explicit licence on the PDF.
Mitigating factors vs VDS: the data is embedded in MAPFRE's *own* legally
required disclosure document on its own domain — republication of vote
facts is more defensible than scraping ISS's service; but a one-paragraph
reuse assessment (incl. EU database-right caveat) is required before
publication.

## AMUNDI — endpoint discovery: CLOSED (it is ISS VDS)

`about.amundi.com/proxy-voting-records` is an iframe:

```text
src="https://vds.issgovernance.com/vds/#/Mjg1OA==/"   → VDS customer 2858
```

- data endpoint: ISS VDS SPA (same app already probed for
  CaixaBank/BBVA) — no Amundi-owned API/download found
- publication lag: Amundi states ~30 days post-meeting
- **published unit: AMUNDI consolidated.** Voting is exercised by
  Amundi's central Voting & Corporate Governance team for the group,
  including delegated entities. Sabadell AM is inside that perimeter, but
  **no per-record Sabadell attribution exists** → at best
  `reporter=AMUNDI, reporting_scope=GROUP_CONSOLIDATED`; labelling
  `SABADELL_AM` would be fabrication.
- reuse: inherits the VDS problem → group **B**.

## G8-B EXIT

```text
MAPFRE
------
technical extraction:      PASS
2023 compatibility:        PASS (same parser, doc-level calibration)
2024 compatibility:        PASS
2025 compatibility:        PASS
proposal-level coverage:   ~99.9% rows; 217–241 meetings/yr
provenance:                doc sha256 + page + row offset, raw strings
reuse status:              REVIEW REQUIRED (own-domain PDF, no licence)

AMUNDI
------
data endpoint discovered:  vds.issgovernance.com (iframe, customer 2858)
machine-readable:          via VDS SPA only
historical coverage:       per VDS store
publication lag:           ~30 days post-meeting (stated)
published reporting unit:  AMUNDI consolidated
Sabadell attribution:      NOT demonstrable
proposal-level:            yes (inside VDS)
rationale:                 not in VDS rows; annual report appendix only
reuse status:              BLOCKED (same as other VDS customers)

DECISION
--------
MAPFRE_ADAPTER   → proceed (adapter + reuse note), G9-ready candidate
AMUNDI_ADAPTER   → blocked by VDS reuse, same as CaixaBank/BBVA/
                   Santander/Bankinter
```

## Strategic consequence

The ISS-VDS reuse question is now confirmed as **the** coverage lever:
CaixaBank AM, BBVA AM, Santander AM+Pensiones, Bankinter and
Amundi/Sabadell all dead-end at the same service. Resolving it once
(VDS terms analysis + whether manager-authorized republication enables
downstream reuse of normalized facts) unlocks the whole Spanish-manager
layer. Meanwhile the next A-TECHNICAL hunts should target other managers
who self-publish itemized registers (the MAPFRE pattern), not more
policy-PDF gestoras.
