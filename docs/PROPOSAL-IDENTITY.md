# PROPOSAL-IDENTITY — votes-es (v2 model, post G9-R)

How two differently-worded source descriptions become the same proposal.
Precision-first: `UNMATCHED` is a valid, preferred outcome over any
uncertain join.

## The four concepts (never conflate them)

```text
source observation   raw vote row from a filing (N-PX, MAPFRE, VDS)
source wording       a distinct reporter phrasing of a proposal —
                     voteDescription / MAPFRE proposal text
legacy proposal      silver proposal_id — the v0.1 wording-cluster
                     identity. Stable, never rewritten; votes hang off it
canonical proposal   the REAL meeting voting item, preferably anchored
                     to official AGM agenda evidence
```

A `distinct wording` is never a canonical proposal. What G9 called
`CanonicalProposal` is now named `SourceProposalCluster` in code —
it is wording-cluster identity, not real-world proposal identity.

## Official agenda item (authority)

```text
official_agenda_items   durable entity; the issuer's own convocatoria
                        (BORME / CNMV OIR / issuer AGM notice), each row
                        carrying item_number, parent_item, order,
                        votable_status and source provenance
agenda_item_id          hash(meeting_id, normalized item number,
                        structural order) — title text is NOT in the ID
```

`votable_status`: VOTABLE / INFORMATION_ONLY / NOT_PUT_TO_VOTE / UNKNOWN.
An INFORMATION_ONLY item never becomes a votable canonical proposal —
it gets one only when filers actually reported votes on it (e.g.
Inditex 2025 item 10).

## Canonical proposal

```text
canonical_proposals
-------------------
canonical_proposal_id   deterministic, independent of legacy IDs
meeting_id
official_agenda_item_id nullable
canonical_number / canonical_title
sponsor_type / votable_status
identity_basis / identity_confidence
```

`identity_basis`:

```text
OFFICIAL_AGENDA    anchored to issuer evidence (the goal for the 26
                   G9-R meetings)
SOURCE_CONSENSUS   meetings without an official agenda yet — the
                   silver cluster stays the identity, clearly labelled
REVIEWED           a reviewed override (recorded; never generalizes)
UNRESOLVED         covered meeting, source proposal couldn't be
                   anchored reliably — the vote is preserved but its
                   official identity is unresolved
```

## The bridge

```text
proposal_anchor_links
---------------------
legacy_proposal_id     (v0.1 identity — preserved)
canonical_proposal_id  nullable
agenda_item_id         nullable
relation_type
match_method / score / margin / review_status / evidence /
matcher_version
```

`relation_type`:

```text
SAME          legacy proposal == the official item (one target)
BUNDLES       source row covers several official items — one link per
              target, vote is NOT fanned out
SUBITEM_OF    source row is a sub-item of a canonical parent
AMBIGUOUS     unresolved between >=2 official items
UNMATCHED     no reliable official item
NOISE         custodian/instruction rows filed as proposals
```

Rule for bundles: if a source declares one vote over a bundle covering
`1.a + 1.b`, the vote stays at bundle level on the legacy proposal. It is
NOT copied to both canonical proposals — that would fabricate
granularity. Bundle-level votes are excluded from proposal-level
comparisons.

## Comparable view

`v_canonical_votes` joins votes to canonical proposals only through
`relation_type IN (SAME, SUBITEM_OF)` — the denominator for
agreement/divergence metrics. BUNDLES / AMBIGUOUS / UNMATCHED / NOISE
stay visible in the bridge but out of comparisons.

## Match methods (anchor, G9-R)

```text
EXACT_OFFICIAL_ITEM     source item number + concept agree
EXACT_OFFICIAL_TEXT     normalized wording == official title
RULE_HIGH_CONFIDENCE    concept-equal AND score >= bar AND margin >= bar,
                        or the concept exists on exactly one agenda item
AMBIGUOUS / UNMATCHED   as above
```

Matcher quality statement (honest): **0 strict concept mismatches
observed among 536 automatically anchored relationships audited in the
G9-R corpus.** Rules were iteratively refined on part of this corpus;
this is not a fully independent estimate of future-sample precision.
Validation will come from new meetings not seen during calibration —
when they arrive, auto-anchors are audited before promotion, and rules
are not recalibrated silently on production data.

## Backward compatibility (v0.1)

```text
votes.proposal_id        unchanged — legacy identity, stable forever
/api/v1/*                unchanged semantics
canonical fields         additive only (new endpoints/columns)
```

G10 adds `official_agenda_items`, `canonical_proposals`,
`proposal_anchor_links` and `v_canonical_votes` as derived artifacts
under `data/canonical/` + gold DuckDB. Nothing destructive.

## Source precedence and asymmetry (unchanged)

- N-PX full-proxy reporters define observed coverage; 14A-only filers
  never shrink the universe.
- MAPFRE item numbers are a stronger signal than N-PX phrasing but
  anchor to OFFICIAL numbering, not to each other.
- Vote direction is NEVER a matching signal (circularity).
