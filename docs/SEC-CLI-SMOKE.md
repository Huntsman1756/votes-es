# SEC-CLI Smoke Test — G0-A1

**Verdict: FAIL as N-PX parser (v0.0.2). PASS as EDGAR discovery tool (`daily`, `efts`).**

Tested 2026-10-06. Binary: `sec-cli-x86_64-pc-windows-msvc.zip` v0.0.2 (release 2026-05-23, sha-pinned, MIT license).

## What was tested

| Filing | Filer | Vote table size | proxyTable blocks |
|---|---|---|---|
| `0001000097-26-000008` | Kingdon Capital (INSTITUTIONAL MANAGER) | 42 KB | 42 |
| `0001104659-26-102001` | Vanguard Index Funds | 18.5 MB | 21,474 |
| `0001438934-26-002282` | iShares Trust (BlackRock) | 70.6 MB | 76,494 |
| `0001438934-26-002278` | iShares Trust (BlackRock) | 184.8 MB | 200,829 |
| `0001104659-26-101977` | Vanguard Index Funds | 96.8 MB | 109,408 |
| `0001104659-26-101952` | Vanguard Intl Equity Index Funds | 122.1 MB | 151,900 |
| `0001193125-26-351549` | SPDR Series Trust (State Street) | 105.8 MB | 99,908 |

## Finding 1 — submissions JSON deserialization bug (blocking)

Every `--cik` command fails for real filers:

```
Error: failed to parse cached json: https://data.sec.gov/submissions/CIK0000036405.json
invalid type: integer `0`, expected a boolean at line 1 column 126836
```

SEC emits `isXBRL`, `insiderTransactionForOwnerExists`, `isForeignLocation` as
`0`/`1` integers; sec-cli models them as `bool`. Any filer with history hits
this. Workaround used for testing: sanitize cached JSON (`int → bool`) under
`%LOCALAPPDATA%/sec-cli/`. Fix upstream is a one-line `serde` attribute
(`#[serde(deserialize_with)]` or `u8`), but we should not depend on an unmerged
patch.

## Finding 2 — `sec fund` never reads the vote table document

`src/sec/funds/mod.rs::choose_fund_document` selects only the **primary**
document (`primary_doc.xml`). The actual votes live in a sibling document
(`proxytable.xml` / `ProxyVotingTable.xml` / `proxyvote.xml` / `BRDWLB_*.xml` —
names are filer-chosen and case-inconsistent). Result: `proxy_votes_count: 0`
on every real N-PX.

## Finding 3 — vote-record tag names do not match the real schema

`is_vote_record_tag` matches `proxyVote|proxyVotingRecord|votingRecord|proxyVoteRecord`.
The N-PX information-table schema uses `<proxyTable>` (per issuer+proposal)
containing `<vote><voteRecord>` (per fund/series). Even if the right document
were selected, zero votes would parse.

## Finding 4 — field coverage insufficient

`FundProxyVoteRecord` exposes only `issuer_name, cusip, meeting_date, matter,
vote_cast, management_recommendation, shares_voted`. Missing: ISIN, FIGI,
categories (1:N), `sharesOnLoan`, `voteSeries`, `otherManagers`, `voteSource`.

## What works

- `sec daily --date YYYY-MM-DD --form N-PX` — daily master-index scan, reliable,
  used for the season filer census (peak day 2026-08-31: 1,360 filings).
- `sec efts` — EDGAR full-text search wrapper.
- Local HTTP cache with source URLs.

## N-PX XML variants confirmed in the wild

| Filer family | Root element | Namespace style |
|---|---|---|
| BlackRock, Kingdon, SPDR | `<inf:proxyVoteTable>` | `inf:` prefix |
| Vanguard | `<proxyVoteTable>` | default namespace |

Same namespace URI (`http://www.sec.gov/edgar/document/npxproxy/informationtable`),
so **local-name matching** handles both. Header comment carries
`VoteTableSchemaVersion:X0300`.

`reportType` in `primary_doc.xml` distinguishes `FUND VOTING REPORT` from
`INSTITUTIONAL MANAGER VOTING REPORT` (14A scope).

## Benchmark: own streaming parser (stdlib `iterparse`, local-name match)

| File | Size | Wall | Peak RSS | Records |
|---|---|---|---|---|
| Kingdon | 42 KB | 0.004s | 22 MB | 42 |
| Vanguard | 18.5 MB | 0.31s | 22 MB | 21,474 tables / 29,890 voteRecords |
| BlackRock | 70.6 MB | 1.15s | 28 MB | 76,494 / 76,273 |
| BlackRock | 184.8 MB | 2.95s | 38 MB | 200,829 / 200,412 |
| Vanguard Intl | 122 MB | ~2.0s | ~30 MB | 151,900 |
| SPDR | 105.8 MB | ~1.7s | ~30 MB | 99,908 |

Throughput ≈ **60 MB/s, bounded memory** (RSS flat vs file size).

Comparison: `edgartools` NPX extractor loads the whole tree (`lxml.fromstring`)
→ 355 MB peak RSS on the 18.5 MB file (≈16× streaming) — correct model, but the
185 MB file projects to ~3.5 GB RSS. Workable but unnecessary.

## Decision

```
NpxProvider = own streaming adapter (lxml/iterparse)
sec-cli    = pinned tool for `daily`/`efts` discovery only (optional)
```

Plan-B streaming parser is justified: the schema is flat and small, memory is
provably bounded, and we control normalization + provenance exactly. sec-cli
bugs and schema gaps are documented above; upstream contribution (submissions
bool fix + document selection + tag set) is possible but not required for V0.1.

`howVoted` values observed in the wild: `FOR`, `AGAINST`, `ABSTAIN`, `WITHHOLD`,
`1 YEAR`, `ONE YEAR`, `2 YEARS`, `3 YEARS`, `THREE YEARS`, `1.0`, `2.0`, `3.0`
(say-on-pay frequency votes). Canonicalization must keep `vote_raw`.
