# G8 census — Spanish asset-manager vote disclosures

Status: RESEARCH (no ingest changes). Survey of how the main Spanish
SGIIC/managers comply with the SRD II disclosure duty (art. 47 ter LIIC /
art. 115 RD 1082/2012): publish the engagement policy, an annual application
report, and *el sentido del voto en las juntas generales*.

Legal frame: the disclosure obligation is on the **manager**, but the
publication infrastructure can be delegated to a third party. In practice
several large gestoras satisfy itemized disclosure exclusively through
**ISS Voting Disclosure Service (VDS)** — `vds.issgovernance.com` — while
others publish itemized or summary data on their own domains.

## Classification

```text
A-TECHNICAL   = proposal-level + own-domain source + deterministically
                extractable
A-PUBLISHABLE = A-TECHNICAL + reuse sufficiently defensible
B             = itemized detail only via ISS VDS
                → same bottleneck as CaixaBank/BBVA; do not ingest or
                  republish yet
C             = summary/qualitative only (annual PDF, CNMV reports)
                → keep as source metadata/rationale; not a vote record
```

## Matrix

| Manager | Group | Itemized? | Where | Evidence |
|---|---|---|---|---|
| MAPFRE AM | **A-TECHNICAL** | YES — per-meeting, per-item rows with `Proposed by / Vote / Management Recommendation / For-Against Management` | `mapfream.com` PDF, 181 pp, FY2025 (`ES-actividades-implicacion-y-ejercicio-politica-voto-2025.pdf`), annual series 2023–2025 | Anexo 2 = full vote detail; columns look like an ISS vote-record export but hosted by MAPFRE |
| Amundi group → Sabadell AM | **B** (not A) | YES via own "Proxy Voting Records" portal, votes published ~30d post-meeting; annual Voting Report + Appendix (significant votes + rationale) | `about.amundi.com/proxy-voting-records` | **Reclassified B (2026-10-07):** `about.amundi.com/proxy-voting-records`
is an iframe to `vds.issgovernance.com/vds/#/Mjg1OA==/` (VDS customer
2858) — same ISS bottleneck. Records are Amundi-consolidated: Sabadell AM
delegates voting to Amundi's central team, so `reporter=SABADELL_AM` is
**not demonstrable**; at best `reporter=AMUNDI, scope=GROUP_CONSOLIDATED`. |
| Santander AM + Santander Pensiones | B | detail only via VDS | `vds.issgovernance.com/vds/#/MTI3NzI=` (customer 12772) | annual report PDFs (own domain, summary only) point to VDS for detail |
| Bankinter Gestión | B | detail via VDS (observed) | bankinter.com "Información anual del voto" → VDS | user-verified; VDS customer id TBD (bankinter.com blocks non-browser fetch) |
| CaixaBank AM | B | VDS | `vds/#/MTEwMDY=` (11006) | already catalogued (G1–G6) |
| BBVA AM | B | VDS | `vds/#/NzIxNg==` (7216) | already catalogued |
| Nordea (ES site) | B | VDS | `vds/#/NzI0Nw==` (7247) | found during census — non-Spanish manager, noted for VDS population size |
| Mutuactivos | C+ | partial — annual Informe + per-fund CNMV semestral lists juntas attended and where they voted against council proposals (meeting-level, not per-proposal) | `mutua.es` PDFs + CNMV filings | e.g. Tubacex/Colonial against votes named in report text |
| Renta 4 Gestora | C | no — CNMV periodic reports state policy + whether they attended | CNMV | "sentido general a favor salvo…" qualitative |
| Kutxabank Gestión | C | no evidence of itemized public register; fund docs name attended juntas qualitatively | kutxabankgestion.es unreachable during survey; CNMV docs | revisit — 24bn AUM, worth a manual look |
| Bestinver | C | annual "Informe de implicación y voto" exists; CNMV semestral lists attended juntas with direction summary | bestinver.es | itemization level of informe unverified (JS site) |
| Cobas AM | C | annual informe; policy commits to publish "sentido del voto en las juntas más significativas" (≥1% threshold) | cobasam.com | threshold means coverage is selective, not complete |
| Magallanes | C | annual informe (5 pp) — qualitative; claims ~100% of meetings voted | magallanesvalue.com | summary only |
| EDM Gestión | C | "Informe Voto y Engagement" (11 pp) — qualitative | edm.es | summary only |
| GVC Gaesco Gestión | C+ | annual informe states 90 JGA voted, direction aggregates; separate informes for Gestión/Valores/Pensiones | inversion.gvcgaesco.es (hubfs) | aggregate stats; possible per-junta table worth re-checking |
| Gesconsult | ? | not found | gesconsult.com | docs site is PDF-driven; no public vote report located |
| Abante | ? | not found yet | abanteasociados.com | pending |
| Trea AM | C (restricted) | policy PDF exists; explicit clause: *"queda prohibido copiar, reproducir, distribuir… cualquier parte de este servicio sin autorización previa por escrito"* | treaam.com | even if detail existed, terms are hostile to reuse — deprioritize |
| Azvalor | C | annual "Informe de implicación" (5 pp) — qualitative; votes ≥1%/12m holdings | azvalor.com | summary only |
| Singular AM | C | annual informe PDF | singularam.es | summary only |
| Ibercaja Gestión | C | summary "las juntas" image-PDFs (already catalogued in project) | ibercaja.com | known from prior work |

## Findings

1. **ISS VDS is the disclosure bottleneck, not the obligation.** At least
   CaixaBank AM, BBVA AM, Santander AM, Santander Pensiones, Bankinter —
   plus non-ES managers like Nordea — satisfy the itemized duty purely via
   VDS links. Adding more gestoras without resolving VDS reuse mostly adds
   adapters that dead-end at the same terms problem.

2. **MAPFRE AM is the strongest immediate candidate.** They embed a full
   proposal-level vote annex (item, proposal text, proposer, vote,
   management recommendation, for/against-management flag) inside their own
   annual PDF — same information content as VDS, published on their own
   domain. Extraction = PDF table parsing (layout is mechanical, columns
   consistent across the 181 pages). Reuse: no explicit licence seen;
   check `mapfream.com` legal/aviso-legal terms before redistribution;
   vote facts themselves are not copyrightable subject matter, but EU/ES
   database-right caution applies — same conservative posture as before.

3. **Amundi covers Sabadell AM — but through VDS.** Amundi's public
   "Proxy Voting Records" portal is cosmetically own-domain but technically
   an ISS VDS embed (customer 2858); Amundi declares ~30-day post-meeting
   publication. Same reuse problem as the rest of group B, plus
   consolidated-group attribution (no per-entity Sabadell label).

4. **The long tail is summary-only.** Most boutiques (Magallanes, EDM,
   GVC, Azvalor, Singular, Renta 4, Mutuactivos…) publish qualitative
   annual PDFs or per-fund CNMV notes naming attended meetings — useful as
   *rationale/context* metadata, not as vote registers. Do not present
   them as comparable records.

5. **Terms matter per-manager.** Trea's document carries an explicit
   anti-reproduction clause; MAPFRE/others have no licence either way.
   "Legally required public disclosure" ≠ "redistributable" — each A-group
   candidate needs a one-paragraph reuse note before ingest.

## Recommended G8 continuation

1. Probe MAPFRE PDF parser feasibility (one meeting → structured rows).
2. ~~Probe Amundi records portal~~ DONE — it is ISS VDS (customer 2858)
   in an iframe; group-consolidated records only.
3. Write ISS VDS reuse analysis **once** — it unlocks ≥4 big gestoras at
   once (CaixaBank, BBVA, Santander, Bankinter) and the panel data already
   ingested locally; cover: VDS terms, whether manager-authorized
   republication of own votes via VDS grants downstream reuse, Spanish
   database-right application to normalized facts.
4. Bankinter: fetch the VDS customer id from a real browser (page blocks
   plain HTTP) — confirm it resolves like the others.
5. Keep C-group entries as `sources` metadata (rationale context), not
   vote rows.
