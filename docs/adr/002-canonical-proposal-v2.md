# ADR-002 — Canonical proposal v2: additive bridge, no destructive migration

Status: accepted (G10)

## Decision

Keep the v0.1 `proposal_id` (silver wording-cluster identity) as the
stable join key everywhere it already exists — votes, API, frontend,
tests — and introduce canonical identity as a **separate, additive
layer**:

```text
official_agenda_items   issuer/official evidence (435 items, 26 meetings)
canonical_proposals     real meeting voting item
proposal_anchor_links   many-to-many bridge: legacy → canonical with
                        relation_type SAME / BUNDLES / SUBITEM_OF /
                        AMBIGUOUS / UNMATCHED / NOISE
v_canonical_votes       view joining votes via SAME/SUBITEM_OF links only
```

## Why not `proposals.official_agenda_item_id` as a 1:1 FK

G9-R proved the relationship is not functional: silver clusters can
bundle several official items (e.g. an Inditex cluster containing both
"Approve Standalone Financial Statements" → item 1.a and "Approve
Consolidated Financial Statements" → item 2). A 1:1 column would force
silent information loss or fabricated granularity.

## Bundle rule

A source that declares ONE vote over a bundle never fans that vote out
to multiple canonical proposals. Vote-level attribution is allowed only
when the vote's own filing row (observation + unit series + wording)
uniquely identifies the item — that is evidence, not fan-out. In
practice this currently resolves few votes: silver collapsed distinct
ballot rows into shared clusters and does not preserve a
vote→bronze-row FK (documented as a future v0.3 data-model item).

## API decision: option A

`/api/v1` remains compatible. Canonical fields arrive additively:

- `GET /api/v1/meetings/{id}/agenda` — official agenda + coverage
- `GET /api/v1/compare/canonical` — same-official-item comparison with
  explicit excluded_by_relation coverage

No `/api/v2` — no contract was broken, so a version bump would be
cosmetic.

## Consequences

- Production v0.1.0 unchanged; the canonical layer is derived data
  (`data/canonical/*.parquet` → gold tables on `build_gold`).
- Cross-source comparisons become *stricter* than G9-R's instance-level
  joins: G9-R's 298 MAPFRE×BlackRock pairs implicitly fanned cluster
  votes across instance texts; v2 reports comparable coverage only.
- Terminology fixed: silver `CanonicalProposal` renamed
  `SourceProposalCluster`; "canonical proposal" is now reserved for
  real meeting items.
