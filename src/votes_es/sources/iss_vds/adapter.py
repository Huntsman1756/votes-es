"""IssVdsSourceAdapter — parse VDS payloads into bronze records.

One adapter serves every SGIIC publishing through ISS VDS (verified: CaixaBank
AM customer 11006, BBVA AM customer 7216). Reporters/units:

    reporter        = the SGIIC (customer)
    reporting_unit  = fundID vehicle (VDS fund list, api/4)

Absence semantics (per BBVA memo): a fund listed on the meeting row whose
ClientVoteList is empty = observed "did not vote" → direction DO_NOT_VOTE with
vote_raw="". A fund absent from the row entirely = NOT_OBSERVED → no row.
"""
from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from typing import Any

from votes_es import ADAPTER_VERSION, ids
from votes_es.domain.models import (
    Observation,
    VdsFund,
    VdsMeetingRow,
    VdsVoteRow,
)
from votes_es.normalization.text import parse_vds_date

TRUE_YN = {"Yes", "YES", "Y", "true", "1", 1}
FALSE_YN = {"No", "NO", "N", "false", "0", 0}


def source_id_for(customer_id_b64: str, slug_name: str) -> str:
    return f"iss_vds:{slug_name}"


def _yn(v: Any) -> bool | None:
    if v in TRUE_YN:
        return True
    if v in FALSE_YN:
        return False
    return None


def _split_list(v: Any) -> list[str]:
    if not v:
        return []
    return [p.strip() for p in str(v).split("||") if p.strip()]


def _split_ids(v: Any) -> list[int]:
    return [int(x) for x in _split_list(str(v).replace(",", "||"))
            if x.strip().isdigit()]


def parse_funds(payload: dict | list) -> list[VdsFund]:
    data = payload.get("data", payload) if isinstance(payload, dict) else payload
    return [
        VdsFund(
            fund_id=int(r["fundID"]),
            fund_name=(r.get("fundName") or "").strip(),
            fund_family_id=int(r["FundFamilyID"]) if r.get("FundFamilyID") is not None else None,
            fund_family_name=(r.get("FundFamilyName") or "").strip() or None,
        )
        for r in data if r.get("fundID") is not None
    ]


def parse_meetings(payload: dict | list) -> list[VdsMeetingRow]:
    data = payload.get("data", payload) if isinstance(payload, dict) else payload
    out = []
    for r in data:
        isins = _split_list(r.get("ISINList"))
        cusips = _split_list(r.get("CUSIPList"))
        out.append(VdsMeetingRow(
            meeting_id=int(r["MeetingID"]),
            company_name=(r.get("CompanyName") or "").strip(),
            isin=isins[0] if isins else None,
            cusip=cusips[0] if cusips else None,
            ticker=(r.get("Ticker") or "").strip() or None,
            country=(r.get("Country") or "").strip() or None,
            meeting_date=parse_vds_date(r.get("MeetingDate")),
            meeting_type=(r.get("MeetingType") or "").strip() or None,
            fund_ids=[int(x) for x in str(r.get("MultipleFundIDs") or "").split(",") if x.strip().isdigit()],
            ballot_ids=_split_ids(r.get("MultipleBallotIDs")),
            voted_flags=_split_list(r.get("VotedList")),
            significant_meeting=_yn(r.get("SignificantMeeting")),
        ))
    return out


def parse_votes(payload: dict | list) -> list[VdsVoteRow]:
    data = payload.get("data", payload) if isinstance(payload, dict) else payload
    out = []
    for r in data:
        sh = r.get("ShareholderProposal")
        out.append(VdsVoteRow(
            meeting_id=int(r["MeetingID"]),
            fund_id=int(r["fundValue"]) if r.get("fundValue") is not None else None,
            fund_name=(r.get("FundNames") or "").strip() or None,
            seq_number=int(r["SeqNumber"]) if r.get("SeqNumber") is not None else None,
            item_on_agenda_id=int(r["ItemOnAgendaID"]) if r.get("ItemOnAgendaID") is not None else None,
            ballot_item_number=(r.get("BallotItemNumber") or "").strip() or None,
            proposal_raw=(r.get("Proposal") or "").strip(),
            shareholder_proposal=None if sh in (None, -1) else bool(sh),
            mgt_rec_raw=(r.get("MgtRecVote") or "").strip() or None,
            client_vote_raw=(r.get("ClientVoteList") or "").strip() or None,
            shares_voted_raw=(r.get("SharesVoted") or r.get("SharesVotedList") or "").strip() or None,
            proposal_category=(r.get("ProposalCategory") or "").strip() or None,
            proposal_subcategory=(r.get("ProposalSubCategory") or "").strip() or None,
            npx_category=(r.get("NPXSecProposalCategory") or "").strip() or None,
            significant_proposal=_yn(r.get("SignificantProposalYN")),
            notes=(r.get("Notes") or "").strip() or None,
            company_name=(r.get("CompanyNameDetail") or "").strip() or None,
            isin=(r.get("SecurityIDDetail") or "").strip() or None,
            meeting_date=parse_vds_date(r.get("MeetingDateDetail")),
            meeting_type=(r.get("MeetingTypeDetail") or "").strip() or None,
        ))
    return out


def votes_to_bronze(rows: list[VdsVoteRow], *, source_id: str,
                    reporter_key: str, meeting_row: VdsMeetingRow | None,
                    source_url: str, fund_id: int | None = None,
                    retrieved_at: datetime | None = None) -> tuple[list[dict], Observation]:
    """api/7 payload → flat bronze dicts (one per fund×proposal row).

    `fund_id` comes from the request (api/7 rows don't echo fundValue)."""
    retrieved_at = retrieved_at or datetime.now(UTC)
    raw = json.dumps([r.model_dump(mode="json") for r in rows], sort_keys=True)
    obs = Observation(
        observation_id=ids.observation_id(
            source_id, f"meeting={rows[0].meeting_id if rows else 'none'}",
            f"fund={rows[0].fund_id if rows else 'none'}", reporter_key),
        source_id=source_id,
        source_document="getVdsData/7",
        source_url=source_url,
        retrieved_at=retrieved_at,
        raw_reference=f"MeetingID={rows[0].meeting_id if rows else ''}",
        parser_version=ADAPTER_VERSION,
        content_hash=hashlib.sha256(raw.encode()).hexdigest(),
    )
    m_isin = meeting_row.isin if meeting_row else None
    m_cusip = meeting_row.cusip if meeting_row else None
    m_name = meeting_row.company_name if meeting_row else None
    out = []
    for r in rows:
        out.append({
            "observation_id": obs.observation_id,
            "reporter_key": reporter_key,
            "source_meeting_id": str(r.meeting_id),
            "fund_id": r.fund_id if r.fund_id is not None else fund_id,
            "fund_name_raw": r.fund_name,
            "issuer_name_raw": r.company_name or m_name,
            "isin": r.isin if r.isin and len(r.isin) == 12 else m_isin,
            "cusip": m_cusip,
            "meeting_date_raw": r.meeting_date.isoformat() if r.meeting_date else None,
            "meeting_type_raw": r.meeting_type,
            "seq_number": r.seq_number,
            "item_on_agenda_id": r.item_on_agenda_id,
            "ballot_item_number": r.ballot_item_number,
            "proposal_text_raw": r.proposal_raw,
            "shareholder_proposal": r.shareholder_proposal,
            "how_voted_raw": r.client_vote_raw,       # "" = observed no-vote
            "voted_flag": None,
            "management_recommendation_raw": r.mgt_rec_raw,
            "shares_voted_raw": r.shares_voted_raw,
            "shares_on_loan_raw": None,
            "categories_raw": "|".join(filter(None, [r.proposal_category,
                                                     r.npx_category])),
            "significant_proposal": r.significant_proposal,
            "notes": r.notes,
        })
    return out, obs
