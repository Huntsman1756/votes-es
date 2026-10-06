# SOURCE-MEMO — BBVA Asset Management

| Field | Value |
|---|---|
| Source name | BBVA Asset Management, S.A., S.G.I.I.C. — "Detalle de las actividades de voto" |
| Official owner | BBVA AM (BBVA Asset Management & Global Wealth; covers BBVA AM SGIIC + BBVA Pensiones EGFP + GPP EGFP delegated vehicles) |
| Legal basis | Ley 35/2003 art. 47 ter (SRD II / Ley 5/2021) |
| Public URL | `https://vds.issgovernance.com/vds/#/NzIxNg==` (linked from bbvaassetmanagement.com → sustainability → "Detalle de las actividades de voto") |
| VDS customerID | `NzIxNg==` (base64 → `7216`) |
| Years available | Meeting data observed 2025–2026 (7,053 meeting rows; 504 ES-ISIN meetings, 53 ES issuers) |
| Current season | 2026 (277 meetings Jan–Oct 2026 in api/14 window) |

## Format & granularity

Same ISS VDS platform as CaixaBank AM (see that memo for the API pattern).

| Aspect | Observation |
|---|---|
| Granularity | fund × meeting × agenda item |
| Vote direction | YES — `ClientVoteList` per proposal |
| Management recommendation | YES — `MgtRecVote` (For/Against/…) |
| Shares | fields present (`SharesVoted`, `VoteSharesVotedDetail`, `SharesOnLoanDetail`), observed empty in sampled meetings |
| Significance flags | `SignificantMeeting`, `SignificantProposalYN`, `HasSignProp`, `AllSignProposal` present |

## Verified end-to-end (2026-10-06)

- api/14 → Iberdrola SA AGM 2026-05-29 (`MeetingID 2055129`, `ISINList ES0144580Y14`), **60 fund IDs** attached, `VotedList: "Voted || (Blanks)"`.
- api/7 → `meetingID=2055129&fundValue=59154` → **23 proposals**, each with
  `SeqNumber`, `Proposal` text ("Advisory Vote on Remuneration Report", …),
  `MgtRecVote=For`, `ClientVoteList=For`, `ShareholderProposal=0`,
  `ItemOnAgendaID`.
- `FundNames` resolves the voting vehicle (e.g. `GOLDMAN SACHS EUROPEAN EQUITY
  FOR BBVA , FI` — note delegated-subadvised vehicles exist; reporting-unit
  model must not assume fund family = BBVA).

## Significance / coverage criteria (documented in policy)

BBVA AM Engagement Policy votes when: legally required; Spanish issuer with
attendance premium; aggregate delegated holding >1%; IBEX-35 constituent; main
EU/NA companies where delegated voting rights >0.07%; delegated investment
>€12M; strategic-sustainability sectors >0.04% or >€10M.

→ `disclosure_level = SIGNIFICANT_ONLY` for the annual report; VDS register
appears broader (records "Voted || (Blanks)" rows too — blanks = funds that did
not vote). **Absence semantics**: empty `ClientVoteList` on a disclosed row =
not voted by that fund; missing row entirely = not observed. Preserve both.

## Access mechanism

Identical to CaixaBank memo. WAF note: bbvaassetmanagement.com returns 403 to
plain bots — needs full browser-like header set; the VDS endpoints themselves
have no such restriction.

## Reuse & technical constraints

| Check | Result |
|---|---|
| robots.txt (bbvaassetmanagement.com) | present; PDFs under wp-content fetchable |
| VDS authentication | none |
| Proxy advisor | ISS (documented in annual report) |

**Reuse assessment: `PUBLIC_ACCESS_REUSE_UNCLEAR`** — same reasoning as
CaixaBank memo: mandatory regulatory disclosure hosted on ISS commercial
platform. Store derived facts + provenance links; seek confirmation before
bulk republication.

## Recommended ingestion

Shared `IssVdsSourceAdapter` with `customerID=NzIxNg==`. The `MultipleFundIDs`
list per meeting gives the fund set to iterate for api/7; negative-MeetingID
rows observed on CaixaBank were not seen on BBVA rows (positive IDs shared
across customers — `2055129` is the same ISS meeting object for BBVA and
CaixaBank).

## Risks

- Same undocumented-API caveat as CaixaBank.
- Fund list includes vehicles from delegated EGFPs — reporting-unit attribution
  needs `FundID → fundName → legal owner` mapping via api/4 (`FundFamilyID`
  groups: e.g. `FundFamilyID 1211 = "BBVA Asset Management SA SGIIC"`).
- `VotedList` mixes "Voted" and "(Blanks)" — parse explicitly; never infer.

**Date checked:** 2026-10-06 · **Evidence:** `data/raw/vds_14_*.json`,
`data/raw/vds_7_*.json`, `vds_capture.txt`.
