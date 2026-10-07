# N-PX differential validation — votes-es vs `slriggss/proxy-voting-panel`

Date: 2026-10-07 · Harness: `scripts/diff_panel.py` ·
Reference dataset: `proxy-voting-panel/data/votes.csv.gz` (303,589 rows,
59 accessions, 22 fund families, seasons 2024–2026).

## Method

Per matched key `(accession, series_id, cusip, meeting_date, normalized
proposal text)` we compare:

- **direction** — canonical main position (largest-share component), with
  frequency pseudo-directions normalized (`ONE YEAR` ⇔ `1 YEAR`, …)
- **shares_voted** — sum over distinct components
- **vs_mgmt / management_alignment** — the N-PX `managementRecommendation`
  element (alignment flag), on the main component
- **split presence** — panel `split_vote='Y'` vs our multi-direction rows

Identical component rows emitted twice by the filer (same
series×proposal block repeated with different `categoryType` — observed in
BlackRock filings) are deduplicated before comparison, matching our silver
`vote_id` semantics.

## Result (post bulk-2026 ingest — full overlap)

```
panel rows:              303,589 (59 accessions, seasons 2024-2026)
our filings overlapping: 20 accessions parsed in bronze
matched keys:            96,200  (accession × series × cusip × meeting_date
                                  × normalized proposal)
direction disagreements: 0
vs_mgmt disagreements:   3   (explained below — panel fallback heuristic)
shares disagreements:    12,821 (all in Vanguard-type pass-through filings)
split disagreements:     6,116  (same filings — panel drops real components)
```

## Every disagreement found — investigated

### direction: 0 real diffs

During development, 3 rows showed `TAKENOACTION` vs `TAKE NO ACTION`
(panel normalizes; we keep raw) and 69 `ONE YEAR` vs `1 YEAR` — both
normalized in the harness. **Zero semantic direction disagreements.**

### shares + split: Vanguard pass-through sub-lots (our model is richer)

Filings like `0001104659-26-101970` emit **the same (series, proposal)
across multiple proxyTable blocks with different share amounts** —
sub-lot/pass-through voting. Example (AFLAC "independent board chairman",
series S000002839):

```
AGAINST 10,405,883  FOR    (main lot)
AGAINST    22,772.8 FOR
FOR        11,992.07 AGAINST
FOR           115    AGAINST
ABSTAIN         4    AGAINST
AGAINST       485    FOR
```

The panel keeps only the first block per key (`seen` set) — losing 6 real
components and misreporting split_vote=N. **We keep every component** and
flag `is_split`. Every one of the 12,821 share diffs decomposes this way
(sum of all lots vs first lot only). Verdict: panel data loss, not our bug.

### vs_mgmt: 3 rows

Main-direction component's `managementRecommendation` element is `NONE`
(or absent) in the source; the panel falls back to another component's
flag. We keep the component's own value (alignment is per-record). Verdict:
ours is more faithful — no bug on either side.

### dedup

Some BlackRock filings emit the same block twice with different
`categoryType` labels — identical vote components dedup'd in both
(`vote_id` collapse covers it in silver).

## Interpretation

On **96,200 overlapping vote components** across 20 shared accessions:

- Direction: **100% agreement** after normalization.
- Shares/split: all divergences are cases where **we preserve components the
  panel silently drops** (pass-through sub-lots, category-dup blocks) —
  our model is strictly more faithful; nothing lost on our side.
- Management alignment: 100% on component-level values; the 3 residual diffs
  are the panel's fallback heuristic vs our per-record fidelity.

No bug found in votes-es; one real finding in the reference dataset (dropped
sub-lot rows misreport split votes), which validates the component-level
model choice.
