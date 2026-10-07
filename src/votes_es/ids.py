"""Deterministic ID helpers. Every canonical ID derives from stable inputs so a
full rebuild produces the same identifiers (timestamps excluded)."""
from __future__ import annotations

import hashlib


def _h(*parts: str | None, n: int = 20) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update((p or "").encode("utf-8"))
        h.update(b"\x00")
    return h.hexdigest()[:n]


def issuer_id(lei: str | None, fallback_key: str) -> str:
    """Issuer keyed by LEI when known, else a namespaced hash of the best key."""
    if lei:
        return f"lei:{lei}"
    return f"xh:{_h(fallback_key)}"


def meeting_id(issuer: str, date_iso: str, meeting_type: str | None = None) -> str:
    return f"m:{_h(issuer, date_iso, meeting_type)}"


def proposal_id(meeting: str, *key_parts: str) -> str:
    return f"p:{_h(meeting, *key_parts)}"


def vote_id(proposal: str, unit: str, source_obs: str, *extra: str) -> str:
    return f"v:{_h(proposal, unit, source_obs, *extra)}"


def observation_id(source_id: str, document_ref: str, *extra: str | None) -> str:
    return f"o:{_h(source_id, document_ref, *extra)}"


def reporting_unit_id(reporter: str, source_identifier: str) -> str:
    return f"u:{_h(reporter, source_identifier)}"


def reporter_id(source_key: str) -> str:
    return f"r:{_h(source_key.lower().strip())}"


def slug(text: str) -> str:
    import re
    import unicodedata
    t = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    t = re.sub(r"[^a-zA-Z0-9]+", "-", t).strip("-").lower()
    return t or "x"
