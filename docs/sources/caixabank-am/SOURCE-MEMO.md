# SOURCE-MEMO — CaixaBank Asset Management

| Field | Value |
|---|---|
| Source name | CaixaBank Asset Management SGIIC, S.A.U. — vote register |
| Official owner | CaixaBank AM (Grupo CaixaBank) |
| Legal basis | Ley 35/2003 art. 47 ter (SRD II / Ley 5/2021) |
| Public URL | `https://vds.issgovernance.com/vds/#/MTEwMDY=` (linked from caixabankassetmanagement.com → "registro de los derechos de voto") |
| VDS customerID | `MTEwMDY=` (base64 → `11006`) |
| Years available | Meeting data observed 2024–2026 in API |
| Current season | 2026 (2,812 meeting rows Jan–Oct 2026; 71 ES-ISIN meetings) |
| Historical availability | API accepts `fromDate`/`toDate`; verified window ≥ 2024 |

## Format & granularity

| Aspect | Observation |
|---|---|
| Publication format | ISS Voting Disclosure Service (VDS) — AngularJS SPA + JSON API |
| Granularity | fund × meeting × agenda item (proposal) |
| Vote direction | YES — `ClientVoteList` per proposal per fund (e.g. `For`) |
| Management recommendation | YES — `MgtRecVote` (`For`/`None` observed) |
| Rationale | Partial — `Notes`, `ResearchNotes`, `ContextualNote` fields exist (mostly `NA`) |
| Shares | `SharesVoted`, `SharesVotedList`, `VoteSharesVotedDetail`, `SharesOnLoanDetail` fields present (often empty for CaixaBank) |
| Agenda metadata | `SeqNumber`, `Proposal`, `ItemOnAgendaID`, `ShareholderProposal` flag, `ProposalCategory`, `NPXSecProposalCategory`, `SignificantProposalYN` |
| Identity | `ISINList`, `CUSIPList`, `SecurityID`, `Ticker`, `CompanyName`, `CompanyID` |

## Access mechanism (verified end-to-end 2026-10-06)

```
GET  /vds/api/getVdsData/4?customerID=<b64>          → fund list (fundID, fundName, FundFamily)
GET  /vds/api/getVdsData/2?customerID=<b64>          → dashboard config
GET  /vds/api/getVdsData/15?customerID=<b64>         → country list
GET  /vds/api/getVdsData/14?customerID=<b64>&fromDate&toDate&signMeeting=All&...&rows&page&SortByColumn&OrderBy
     → meeting list (paginated; MeetingID, ISINList, MultipleFundIDs, MultipleBallotIDs,
        VotedList, SignificantMeeting, HasSignProp)
GET  /vds/api/getVdsData/7?customerID=<b64>&meetingID=<id>&fundValue=<fundID>&actionCode=114&...
     → per-proposal votes for that fund×meeting
```

- Session: hit `/vds/` first for cookies; pass a consistent `sessionToken`
  (arbitrary numeric string works) and `liveSiteYN=1`.
- Search: `companyOrTicker=<name>` filters server-side.
- CaixaBank rows use **synthetic negative MeetingIDs** per fund-ballot
  (e.g. `-6019122`); `MultipleBallotIDs=0` on those rows. api/7 resolves them
  with the row's own `fundValue`.
- Verified: Iberdrola 2026-05-29 → 23 proposals, `ClientVoteList=For`,
  `FundNames=INVERTRES FONDO I, FI`.

## Disclosure level

- Policy: `Política de Implicación` PDF + annual "Informe anual de diálogo y voto" (2022–2025 on site).
- VDS exposes vote-level records; `SignificantMeeting`/`SignificantProposalYN`/`HasSignProp` flags exist — significance model must be captured per season.
- `UpdateFrequencyID` field present in config (value 0 observed); VDS is hosted by ISS — update lag depends on ISS + manager publishing cadence.

## Reuse & technical constraints

| Check | Result |
|---|---|
| robots.txt (vds.issgovernance.com) | none (404) |
| robots.txt (caixabankassetmanagement.com) | present; deployedfiles/ allowed |
| Authentication | none required (public dashboard) |
| Rate limits | none observed; throttle to ≤1 req/s + identified UA anyway |
| Terms | ISS platform; data is the manager's regulatory disclosure under 47 ter.4 (must be free and public) |

**Reuse assessment: `PUBLIC_ACCESS_REUSE_UNCLEAR`**

The underlying vote records are the manager's mandatory public disclosure;
the transport is ISS's commercial platform. Recommendation: store derived facts
(direction, meeting, proposal, fund) + provenance (VDS URL, customerID,
meetingID, retrieved_at); link back to the VDS dashboard rather than
republishing raw payloads. Seek written confirmation from CaixaBank AM for bulk
reuse before labelling `OPEN_REUSE_CONFIRMED`.

## Recommended ingestion

`IssVdsSourceAdapter` (shared with BBVA AM — same platform). Flow:
`/vds/` → api/4 → api/2 → api/15 → api/14 (paginate `rows`/`page`) → api/7 per
meeting×fund. Persist raw JSON per call into `data/raw/vds/`.

## Risks

- API is undocumented/internal (versioned JS `vds-app.js?version=3.0.13`) —
  endpoints could change; keep adapter thin + contract-test responses.
- api/7 requires fund-level iteration (`fundValue`); a meeting with 60 funds is
  60 calls unless `MultipleBallotIDs` batching exists (worth one more RE pass).
- Negative synthetic MeetingIDs are session-stable in observed calls but treat
  as ephemeral: join by (MeetingDate, ISINList, FundID) when reconciling.

**Date checked:** 2026-10-06 · **Evidence:** `data/raw/vds_*.json` captures,
`vdsapp.tmp.js` analysis.
