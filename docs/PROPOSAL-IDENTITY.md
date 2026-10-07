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

## G9-R — official-agenda anchoring (supersedes pairwise canonicalization)

G9 showed the pairwise N-PX clustering over-fragments: Inditex 2025
carried 35 wording clusters against an official agenda of 10 items
(1.a, 1.b, 2–9 votable + 10 information-only). Canonical proposal
identity is therefore re-anchored to **issuer/official meeting evidence**
(BORME convocatoria, issuer AGM notice, CNMV OIR) — never inferred from
how two reporters happened to phrase an item.

```text
official_agenda_item   item from the issuer's own convocatoria —
                       carries item_number, parent_item, order,
                       votable_status and full provenance
                       (source_url, source_ref, retrieved_at)
source_wording         a distinct reporter phrasing (N-PX
                       voteDescription, MAPFRE proposal text)
anchor                 source_wording → official_agenda_item
                       assertion with method/score/margin/evidence
```

What G9 called `canonical_proposal` was really `source proposal variants /
wording clusters`; after G9-R, canonical proposals anchored on
`official_agenda_item_id` are the only OFFICIAL_AGENDA-backed identities.

### Anchor methods (src/votes_es/reconcile/anchor.py)

```text
EXACT_OFFICIAL_ITEM     source item number + concept agree
EXACT_OFFICIAL_TEXT     normalized wording == official title
RULE_HIGH_CONFIDENCE    concept-equal AND score >= bar AND margin >= bar,
                        or the concept exists on exactly one agenda item
AMBIGUOUS               unresolved between >=2 official items
                        (bundled wordings, repeated concepts)
UNMATCHED               noise / not on the official agenda
```

Key semantics: bundled rows (multi-concept segments, e.g. MAPFRE's
`SECURITIES:`-separated blobs) anchor to their *numbered primary item*
or stay AMBIGUOUS — never forced; `ACCOUNTS_SOLO` and `ACCOUNTS_GROUP`
are never treated as compatible; director elections additionally use
deterministic person-name signals inside the meeting.

Corpus: `data/reference/official_agendas/` — 26 shared meetings, 435
items, each item evidence-stamped (BORME/CNMV/issuer URL + ref +
retrieved_at). Builder: `scripts/build_official_agendas.py`;
BORME/CNMV fetcher: `scripts/fetch_borme.py`.
