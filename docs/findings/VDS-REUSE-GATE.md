# FINDING — VDS reuse review and publication gate (2026-10-07)

## What the data legally is

The rows served by `vds.issgovernance.com` for CaixaBank AM (11006) and
BBVA AM (7216) are the managers' **mandatory public disclosures** under
Ley 35/2003 art. 47 ter.4 (SRD II transposition): institutional investors
must publish their vote records freely and publicly. The disclosure
*obligation* is the manager's, and the underlying facts (who voted what on
which proposal at which meeting) are regulatory facts.

## What is actually uncertain

- The transport is **ISS's commercial platform**. ISS could claim
  rights in the database arrangement/compilation (EU sui generis) or in
  enriched fields they add (MeetingIDs, ballot joins, proposal
  normalization, SignificantMeeting flags).
- No ToS text was found attached to the public dashboard endpoints;
  no robots.txt blocks (vds.issgovernance.com robots = 404); no
  authentication. `PUBLIC_ACCESS_REUSE_UNCLEAR` remains the honest state.
- We are not lawyers; this is an operational decision, not legal advice.

## Distinction that drives the gate

| Artifact | Risk | Decision |
|---|---|---|
| Link back to VDS dashboard | none | always allowed |
| Reporter/meeting/proposal *existence* metadata, source references | negligible | allowed |
| Vote direction as derived fact | low — the manager must publish it | allowed via API when gate open |
| Bulk republication of full VDS register (shares, ballot IDs, ISS flags) | higher — substantial extraction of ISS's organized DB | gated OFF by default |

## Implementation

`VOTES_PUBLISH_VOTE_SOURCES` env (comma list) controls which `source_id`s
get vote rows into the served gold dataset. Deployment config:

```
VOTES_PUBLISH_VOTE_SOURCES=sec_npx
```

Effect (verified on real data): gold contains only `sec_npx` vote rows;
`reporters`, `disclosure_seasons`, `observations` (incl. VDS source URLs),
meetings/proposals shells remain — VDS presence is visible as
*metadata with a link*, never as vote rows. Local/dev runs with the env
unset serve everything.

If ISS/managers confirm reuse later, flip the env — no schema change.

## No fabricated certainty

Status stays `PUBLIC_ACCESS_REUSE_UNCLEAR` in `sources.reuse_status`.
The exit gate records this as a documented limitation, not a resolved one.
