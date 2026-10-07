# FINDING — N-PX `managementRecommendation` is an ALIGNMENT flag, not a direction

Date: 2026-10-07 · Status: **corrected in code** (this commit)

## The bug

Silver originally computed:

```
against_management = (vote_direction != managementRecommendation)
```

That treats `managementRecommendation` as *the direction management
recommended*. It is not. Form N-PX Item 1(l) requires the filer to state:

> "whether the vote was cast for or against management's recommendation"

i.e. the field is a **vote↔recommendation alignment flag**.

## Evidence

- Form N-PX (sec.gov/files/formnpx.pdf), Item 1(l) + instruction 8:
  "If management did not make a recommendation … respond 'none'".
- 87 FR 78770 final rule: "disclose whether a vote was for or against
  management's recommendation" — deliberately instead of requiring the
  recommendation itself (commenters noted this ambiguity).
- directEDGAR field-guide correction (2024-09) — same finding.
- Real data (BlackRock 185 MB filing): values seen are only
  `FOR` / `AGAINST` / `NONE` — consistent with an alignment flag.

## Why the old formula silently inverted AGAINST votes

| howVoted | field (real meaning) | true dissent | old formula `dir != field` |
|---|---|---|---|
| FOR | FOR | no (followed mgmt FOR) | False ✓ |
| FOR | AGAINST | yes (mgmt said AGAINST) | True ✓ (by accident) |
| AGAINST | AGAINST | yes (mgmt said FOR) | False ✗ **inverted** |
| AGAINST | FOR | no (mgmt said AGAINST) | True ✗ **inverted** |

ABSTAIN/WITHHOLD votes with alignment FOR/AGAINST were likewise wrong.

Real-data impact: with only ~2K in-universe N-PX rows the delta was
dissent 3 → **110**. At season scale (~thousands of filings) the corruption
would have been material.

## Corrected model

| canonical column | N-PX | VDS |
|---|---|---|
| `direction` | howVoted | ClientVoteList |
| `management_alignment` | `managementRecommendation` → FOR/AGAINST/NONE | derived: direction vs MgtRecVote |
| `management_recommendation` | **NULL** — not declared by N-PX | MgtRecVote (declared direction) |
| `against_management` | alignment==AGAINST | direction ≠ rec (both defined) |

We do **not** back-fill `management_recommendation` for N-PX even though the
direction is algebraically derivable when direction∈{FOR,AGAINST} —
derivability is shown in the matrix above and the note remains available to
any analyst; the canonical field carries only declared facts.

## Verification

- `tests/golden/test_npx_semantics.py` covers all four matrix cells + NONE +
  absent element + VDS counterparts (37 tests total green).
- `votes validate` now gates:
  - `npx_no_mgmt_rec_direction`: N-PX rows must not carry a fabricated rec;
  - `against_semantics`: source-aware rule — N-PX `against_management`
    must equal `alignment == 'AGAINST'` (NULL when NONE/absent/OTHER).
- Fixture `fixtures/npx/semantics.xml` exercises every matrix cell.
