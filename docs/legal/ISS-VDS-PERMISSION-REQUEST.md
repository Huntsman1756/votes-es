# Reuse permission request — ISS Vote Disclosure Service (VDS)

**Status: draft — do not send without review.**

To: ISS / STOXX (legal/data licensing contact TBD)
CC context: the asset managers whose registers are hosted on VDS —
CaixaBank AM (customer 11006), BBVA AM (7216), Santander AM +
Pensiones (12772), Bankinter Gestión (customer id TBD), Amundi group
(2858 — consolidated records covering delegated entities incl.
Sabadell AM).

## What votes-es is

`votes-es` is a non-commercial, open-source research dataset and public
reference site (https://votes.h1756.es) publishing normalized,
provenance-backed records of institutional voting at shareholder
meetings of Spanish listed companies. No ads, no paywall, no data sale.

## Problem

Spanish asset managers satisfy their SRD II / 47-ter voting-disclosure
duty overwhelmingly through ISS VDS: the detailed per-proposal register
exists *only* inside the VDS web application on
vds.issgovernance.com, behind a per-customer public URL. Your Terms of
Use prohibit (a) extraction software/systems on the site and (b)
copying, distributing, publishing or exploiting information obtained
from the site without prior written approval. That blocks the entire
proposal-level Spanish-manager layer for open research reuse.

## What we request

Written permission (or a defined license) to:

1. extract, by automated means, per-meeting/per-proposal vote records
   exposed by VDS for the managers listed above;
2. publish **normalized vote facts** (issuer, meeting date, proposal,
   vote direction, management recommendation where declared, fund/unit
   identifier as displayed) with attribution to the manager and a link
   to the VDS register;
3. redistribute those normalized facts under the project's open data
   license.

## What we would NOT do

- republish ISS analytics, scores, policy rationales, screeners or any
  ISS value-added content — only the factual voting records the
  managers themselves publish;
- imply ISS endorsement; attribution is to the reporting manager with a
  VDS source link;
- bypass any access control — all registers are publicly reachable.

## Open questions we explicitly acknowledge

- Does manager consent (each manager authorized public display of its
  own register) suffice, or does ISS claim independent rights over the
  display/extraction of those records?
- Is there an ISS data-licensing product already covering this reuse
  (e.g. DataDesk / Vote Analytics)? If so, what are its redistribution
  terms?
- For Amundi (customer 2858): can ISS confirm whether records are
  consolidated at group level or carry per-entity attribution?
