# Prior art — proposal matching across filings

Reviewed 2026-10-08. Scope: matching differently-worded copies of the same
ballot item across filers, meeting-locally.

## AshokReddy010/fund-proxy-voting — scripts/label_proposals.py

**Approach**: meeting-local greedy clustering. Rows sorted by `fund_votes`
descending; each wording joins the closest cluster head or starts a new
one. `clean_wording` strips a large boilerplate list (including
economically meaningful verbs: approve, report, directors, issue).
`similarity` = Jaccard boosted by containment:
`max(|a∩b|/|a∪b|, 0.9·|a∩b|/min(|a|,|b|))`. Threshold 0.5.
Direction classification is a separate keyword-rule layer on the wording.

**Strength**: simple, fully deterministic, meeting-local — the right
topology.

**Failure modes**: order-dependent (cluster head = most-voted wording);
0.5 threshold + containment boost merges "Approve Remuneration Report" vs
"Advisory Vote on Remuneration Policy" casually; boilerplate removal
deletes discriminative terms; no proponent separation before scoring; no
margin/confidence concept; direction rules keyed on ESG vocabulary —
out of scope for us.

**votes-es reuses**: meeting-local clustering, most-representative-head
ordering intuition.

**votes-es rejects**: threshold, the boosted similarity formula, dropping
meaning-bearing tokens, direction-inference rules.

## slriggss/proxy-voting-panel — scripts/build_site_data.js (matchId)

**Approach**: meeting key = `cusip|date`. Rows cluster only within the
same proponent class. Management proposals require *exact* normalized
text; shareholder proposals join at token-Jaccard ≥ 0.8.

**Strength**: proponent is a hard pre-filter (a management row can never
absorb a shareholder row); management-exactness is the precision-first
instinct; O(m·k) — trivially fast at meeting scale.

**Failure modes**: exact-only management matching leaves real wording
variants unmatched (filers reorder words: "Amend Articles of
Incorporation" vs "Amendment of the Articles"); no margin — 0.80 vs 0.79
is a cliff; no evidence stored per match (only a joined id).

**votes-es reuses**: proponent hard-gate, meeting-local clustering,
exact-first rule.

**votes-es rejects**: fixed 0.8 without margin, no audit trail.

## What votes-es adds over both

- **One-to-one assignment** inside a meeting (greedy by score with
  exclusivity) — neither baseline constrains multiplicity; two source
  items may not share one canonical proposal.
- **Score + margin promotion** (best − second-best), not threshold alone.
- **Ballot/item number** as the strongest signal when present (MAPFRE
  prints agenda items; VDS rows carry BallotItemNumber — N-PX mostly
  lacks it).
- **Categories** as supporting (never blocking) signal across taxonomies.
- **match evidence persisted** per pair — method, score, margin,
  competing candidate, review status.
- **Quarantine posture**: `UNMATCHED` is a valid outcome; precision-first.

## Calibration sources

Golden corpus = the 26 shared MAPFRE×N-PX meetings (278 MAPFRE
instances). Thresholds are derived from that corpus, not copied.
