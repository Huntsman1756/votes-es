"""Canonical-proposal v2 schemas and deterministic IDs."""
from __future__ import annotations

import pyarrow as pa

from votes_es.ids import _h

# ---------------------------------------------------------------- ids

def agenda_item_id(meeting_id: str, item_number: str, order: int) -> str:
    """Deterministic — number + structural position only; a title wording
    fix must not change the ID."""
    return f"ai:{_h(meeting_id, item_number, str(order), n=16)}"


def canonical_id_official(agenda_item: str) -> str:
    return f"cp:{_h('official', agenda_item, n=16)}"


def canonical_id_consensus(legacy_proposal_id: str) -> str:
    return f"cp:{_h('consensus', legacy_proposal_id, n=16)}"


def canonical_id_unresolved(legacy_proposal_id: str) -> str:
    return f"cp:{_h('unresolved', legacy_proposal_id, n=16)}"


# ---------------------------------------------------------------- enums

VOTABLE_STATUSES = ("VOTABLE", "INFORMATION_ONLY",
                    "NOT_PUT_TO_VOTE", "UNKNOWN")

IDENTITY_BASES = ("OFFICIAL_AGENDA", "SOURCE_CONSENSUS",
                  "REVIEWED", "UNRESOLVED")

RELATION_TYPES = ("SAME", "BUNDLES", "SUBITEM_OF",
                  "AMBIGUOUS", "UNMATCHED", "NOISE")

# relations eligible for proposal-level comparisons
COMPARABLE_RELATIONS = ("SAME", "SUBITEM_OF")


# ---------------------------------------------------------------- schemas

OFFICIAL_AGENDA_ITEMS = pa.schema([
    ("agenda_item_id", pa.string()),
    ("meeting_id", pa.string()),
    ("item_number", pa.string()),
    ("parent_item_number", pa.string()),
    ("item_order", pa.int64()),
    ("title_raw", pa.string()),
    ("title_normalized", pa.string()),
    ("concept_id", pa.string()),
    ("votable_status", pa.string()),
    ("source_type", pa.string()),
    ("source_url", pa.string()),
    ("source_document", pa.string()),
    ("source_locator", pa.string()),
    ("source_sha256", pa.string()),
    ("published_at", pa.string()),
    ("retrieved_at", pa.string()),
])

CANONICAL_PROPOSALS = pa.schema([
    ("canonical_proposal_id", pa.string()),
    ("meeting_id", pa.string()),
    ("official_agenda_item_id", pa.string()),
    ("canonical_number", pa.string()),
    ("canonical_title", pa.string()),
    ("sponsor_type", pa.string()),
    ("votable_status", pa.string()),
    ("identity_basis", pa.string()),
    ("identity_confidence", pa.string()),
])

PROPOSAL_ANCHOR_LINKS = pa.schema([
    ("legacy_proposal_id", pa.string()),
    ("canonical_proposal_id", pa.string()),
    ("agenda_item_id", pa.string()),
    # NULL = proposal-level link; set = vote-scoped attribution for a
    # bundled cluster — the vote's own filing wording identified the item
    ("vote_id", pa.string()),
    ("relation_type", pa.string()),
    ("match_method", pa.string()),
    ("score", pa.float64()),
    ("margin", pa.float64()),
    ("review_status", pa.string()),
    ("evidence", pa.string()),
    ("matcher_version", pa.string()),
])
