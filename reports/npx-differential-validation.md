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

## Result (interim — bulk run in progress)

```
panel rows:              303,130-303,589 (59 accessions)
our filings overlapping: 7 accessions scanned in bronze
matched keys:            32,720
direction disagreements: 0
shares disagreements:    0
vs_mgmt disagreements:   0
split disagreements:     0
```

## Every disagreement found during development

| Disagreement | Cause | Verdict |
|---|---|---|
| 69 × `ONE YEAR` vs `1 YEAR` | panel normalizes frequency values; we keep raw + canonical OTHER | expected — fixed in harness by shared normalization |
| 27 × shares 2× | harness summed duplicate source blocks (same vote emitted twice under different categories) | expected — dedup at component level; our silver `vote_id` already collapses |
| 16 × shares ≠ | identical proposal text at *two different meetings* collided in both datasets' keys | harness bug — added `meeting_date` to key; zero real diffs remain |

## Interpretation

Independently-implemented parsers agree **100%** on direction, shares,
management-alignment and split detection on all 32,720 overlapping
components so far. Will be re-run at full bulk coverage and the matched-key
count updated here.
