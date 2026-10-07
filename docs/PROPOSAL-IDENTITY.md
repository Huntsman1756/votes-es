# PROPOSAL-IDENTITY — votes-es (G9 model)

How two differently-worded source descriptions become the same proposal.
Precision-first: `UNMATCHED` is a valid, preferred outcome over any
uncertain join.

## Entities

```text
source_proposal        one source-native proposal description
                       (N-PX voteDescription, VDS proposal text,
                        MAPFRE agenda item)
proposal_variant       a distinct wording of a proposal inside a source —
                       N-PX filers phrase the same item differently
canonical_proposal     the meeting's real agenda item — a silver
                       `proposal_id` shared across sources by clustering
proposal_match         an auditable assertion:
                       source_proposal ↔ canonical_proposal
```

Meetings are canonical on `(issuer_id, meeting_date)`. Source meeting
blocks (MAPFRE prints several `Security` blocks on the same day; SEC
filers each carry their own rows) are *evidence for* a canonical meeting,
not meetings themselves. Two genuinely different juntas on the same day
(different meeting types/securities) would need a distinguishing key —
currently flagged manually rather than auto-split.

## Match methods

```text
EXACT_ITEM_AND_TEXT     ballot/item number + identical normalized text
EXACT_ITEM              agenda item numbers agree (mapfre item ↔ ballot)
EXACT_TEXT              identical normalized text
RULE_HIGH_CONFIDENCE    composite score >= bar AND margin >= bar
REVIEWED                a human/agent verified it (evidence recorded)
AMBIGUOUS               above floor, below promotion bar — kept unresolved
UNMATCHED               no candidate above the floor
```

Each match stores: `match_method`, `score`, `margin` (best −
second-best), `evidence` (per-signal breakdown), `review_status`,
`matcher_version`.

## Scoring (transparent, no learned parameters)

```text
text      = max over N-PX variants of max(token-Jaccard, containment)
            on normalized wording
category  = Jaccard over category sets when both sides declare them
            (different taxonomies never produce a negative)
proponent = hard veto on MANAGEMENT↔SHAREHOLDER mismatch
sequence  = agenda-position agreement when both sides carry numbers
```

Promotion requires absolute strength AND separation from the runner-up:

```text
text >= 0.85                      (wording alone is convincing)
    OR (score >= 0.72 AND text >= 0.60)
AND margin >= 0.12
```

## Source precedence and asymmetry

- The N-PX cluster set derives from full-proxy-record reporters; 14A-only
  (Section 14A scope) filers never shrink the canonical universe.
- MAPFRE supplies agenda item numbers — a stronger signal than anything
  N-PX offers, and the reason VDS ballots (also present in the shared
  clusters) help bridge numbers.
- Vote direction is NEVER a matching signal (circularity).
- N-PX provides alignment only; MAPFRE provides the recommendation
  direction. No comparison derives an N-PX recommendation direction.

## Limitations

- Recall is deliberately unoptimized: the corpus shows ~25% auto-match;
  the rest stays AMBIGUOUS/UNMATCHED in the review queue.
- Proposal texts in two languages or deep paraphrase stay unmatched —
  that's intended.
- Same-meeting dedup of N-PX variants is still greedy order-stable
  clustering in silver; the matcher sits on top and never writes back.
