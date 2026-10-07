# PROVENANCE — votes-es

Every vote row resolves to an `observation` that answers *where did this come
from*:

| Field | Meaning |
|---|---|
| observation_id | deterministic id |
| source_id | `sec_npx` / `iss_vds:<reporter>` / … |
| accession | SEC accession number (N-PX) |
| source_document | document name (`proxytable.xml`) or api endpoint (`getVdsData/7`) |
| source_url | filing folder URL or VDS dashboard + meeting reference |
| published_at | source publication date when known |
| retrieved_at | when we pulled it |
| raw_reference | vote-table name / MeetingID+fund |
| parser_version | adapter version that produced the row |
| content_hash | sha256 of the artifact/payload (when retained) |

## Rebuild guarantees

- Canonical IDs are deterministic content hashes — same inputs → same IDs.
- DuckDB is derived; silver parquets rebuild from bronze; bronze from raw.
- SEC raw XMLs may be discarded after parse (size); the accession + hash +
  URL in the observation is the durable handle — re-fetchable from EDGAR.
- VDS payloads are keyed by observation_id derived from
  (source, meeting, fund, reporter) — replays produce identical ids.

## Reuse policy enforcement

`sources.reuse_status` gates redistribution. `votes export` and the API only
emit rows from `OPEN_REUSE_CONFIRMED` sources (today: SEC). VDS-derived rows
are stored as facts with links back to the register until reuse is confirmed —
see DATA-NOTICE.md.
