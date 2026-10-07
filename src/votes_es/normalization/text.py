"""Text normalization for issuer names and proposal titles."""
from __future__ import annotations

import re
import unicodedata

_WS = re.compile(r"\s+")
_PUNCT = re.compile(r"[^\w\s]")
_CORP_SUFFIX = re.compile(
    r"\b(S\.?A\.?|S\.?A\.?U\.?|S\.?L\.?|INC\.?|CORP\.?|CORPORATION|PLC|LLC|L\.?P\.?|"
    r"N\.?V\.?|S\.?E\.?|A\.?G\.?|S\.?P\.?A\.?|LTD\.?|LIMITED|CO\.?|COMPANY|GROUP)\b",
    re.IGNORECASE,
)


def normalize_spaces(s: str) -> str:
    return _WS.sub(" ", (s or "").strip())


def normalize_proposal_text(raw: str) -> str:
    """Stable comparison key for proposal text matching.

    Lowercase, punctuation stripped, whitespace collapsed. Leading item
    numbers/bullets removed. Wording differences between filers remain —
    that's what the similarity step is for.
    """
    t = unicodedata.normalize("NFKC", raw or "")
    t = t.lower()
    t = re.sub(r"^\s*(item|agenda item|proposal|punto|resoluci[oó]n)?\s*\d+[\.\):\-]\s*", "", t)
    t = _PUNCT.sub(" ", t)
    return _WS.sub(" ", t).strip()


def normalize_issuer_name(raw: str) -> str:
    """Comparison key for issuer names (suspect lane only — never promotes)."""
    t = unicodedata.normalize("NFKD", raw or "").encode("ascii", "ignore").decode()
    t = t.upper()
    t = _CORP_SUFFIX.sub(" ", t)
    t = _PUNCT.sub(" ", t)
    return _WS.sub(" ", t).strip()


def token_jaccard(a: str, b: str) -> float:
    """Deterministic similarity on normalized text. No external dep."""
    ta, tb = set(a.split()), set(b.split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def parse_number(raw: str | None):
    """Shares fields arrive as '1841541.0' / '' — parse to Decimal or None."""
    if raw is None:
        return None
    s = str(raw).strip().replace(",", "")
    if not s:
        return None
    from decimal import Decimal, InvalidOperation
    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def parse_npx_date(raw: str | None):
    """N-PX meetingDate is MM/DD/YYYY."""
    from datetime import date
    s = (raw or "").strip()
    try:
        m, d, y = s.split("/")
        return date(int(y), int(m), int(d))
    except Exception:
        return None


def parse_vds_date(raw: str | None):
    """VDS dates look like '2026-05-29 00:00:00.0'."""
    from datetime import date
    s = (raw or "").strip()
    try:
        return date(int(s[0:4]), int(s[5:7]), int(s[8:10]))
    except Exception:
        return None
