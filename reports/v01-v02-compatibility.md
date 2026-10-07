# v0.1 → v0.2 compatibility report (G10)

Generated locally from `data/gold/votes.duckdb` + `data/canonical/`.
Software 0.2.0-dev · schema 2.

## ID stability

```text
legacy proposal ids preserved:  YES — votes.proposal_id untouched;
                                5439 silver proposals, 5439
                                reachable via proposal_anchor_links
                                (0 unlinked)
vote ids preserved:             YES — 194167 votes / 194167 vote_ids;
                                the canonical layer reads, never writes
meeting ids preserved:          YES — 261 meetings
canonical ids deterministic:    YES — hash(meeting_id, item number,
                                order); title wording is not an input
```

## Relations

| relation | links |
|---|---|
| AMBIGUOUS | 76 |
| BUNDLES | 8 |
| NOISE | 4 |
| SAME | 5348 |
| UNMATCHED | 7 |

canonical proposals: 5369
identity_basis: {'SOURCE_CONSENSUS': 4862, 'OFFICIAL_AGENDA': 2, 'UNRESOLVED': 87}

## Invariants

```text
votes:                          194167 — canonical build is additive,
                                vote count/direction/shares untouched
canonical comparable votes:     193385 (information-only excluded) (SAME/SUBITEM_OF links only)
publication leak:               PASS — VOTES_PUBLISH_VOTE_SOURCES=sec_npx
```

## Regressions (canonical model)

```text
Inditex 2025 item 8:            MAPFRE FOR / BlackRock AGAINST — preserved
MAPFRE × BlackRock:             8 shared canonical proposals /
                                310 vote pairs / 2 divergent
Vanguard / State Street:        overlap preserved (see G10 exit notes)
```

## API

```text
v1 compatibility:   no endpoint changed semantics (ADR-002, option A)
endpoints added:    /api/v1/meetings/{id}/agenda
                    /api/v1/compare/canonical
fields removed:     none
breaking changes:   none
```

## Semantics changed (documented)

- "canonical proposal" now means the real meeting item — OFFICIAL_AGENDA
  anchored where evidence exists; SOURCE_CONSENSUS / UNRESOLVED elsewhere.
  The former `CanonicalProposal` is `SourceProposalCluster`.
- Bundle votes stay on the legacy proposal and are excluded from
  v_canonical_votes; they are never fanned out. G9-R's pair counts
  implicitly fanned votes across instance texts — v2 is stricter and
  reports comparable coverage only.
