"""Proposal-text normalization for cross-source matching.

Stronger than the silver `normalize_proposal_text` (which targets
within-source clustering): strips filing boilerplate that N-PX filers
append verbatim, unifies shareholder/stockholder, removes ballot-number
prefixes. Does NOT drop meaning-bearing tokens (approve, director,
remuneration, capital, dividend…) — they are what discriminates.
"""
from __future__ import annotations

import re
import unicodedata

_WS = re.compile(r"\s+")
_PUNCT = re.compile(r"[^\w\s]")

_ITEM_PREFIX = re.compile(
    r"^\s*(item|agenda item|proposal no\.?|proposal|punto|resoluci[oó]n|"
    r"punto\s+del\s+orden\s+del\s+d[ií]a)?\s*\d{1,3}[a-z]?[\.\):\-]\s*",
    re.IGNORECASE)

_BOILER = [
    r"please note that this resolution is a shareholder proposal:?",
    r"if properly presented( at the( \d{4})?( annual)? meeting( of)?)?",
    r"at the annual meeting",
    r"properly presented",
    r"non[- ]binding",
    r"the board of directors recommends a vote",   # partial boilerplate tail
]

_SYNONYMS = [
    (r"\bstockholders?\b", "shareholder"),
    (r"\bshareowners?\b", "shareholder"),
    (r"\bsecurity holders?\b", "shareholder"),
    (r"\bco[- ]?option\b", "co-option"),
    (r"\bre[- ]?elect\w*\b", "elect"),          # elect/re-elect variants
    (r"\bappoint(?:ment)?\b", "appoint"),
    (r"\b(?:advisory|consultative)\b", "advisory"),
    (r"\bremuneration(s)?\s+(policy|report|statement)\b", r"remuneration \2"),
    (r"\bsay on pay\b", "advisory remuneration"),
    (r"\bon an advisory basis\b", "advisory"),
    (r"\bboard of directors\b", "board"),
]


def normalize_for_match(raw: str | None) -> str:
    """Deterministic comparison key for cross-source proposal matching."""
    t = unicodedata.normalize("NFKC", raw or "").lower()
    t = t.replace("’", "'").replace("‘", "'").replace('“', '"').replace('”', '"')
    t = _ITEM_PREFIX.sub(" ", t)
    for pat in _BOILER:
        t = re.sub(pat, " ", t, flags=re.IGNORECASE)
    t = _PUNCT.sub(" ", t)
    t = _WS.sub(" ", t).strip()
    for pat, rep in _SYNONYMS:
        t = re.sub(pat, rep, t)
    return t


def tokens(t: str) -> set[str]:
    return set(normalize_for_match(t).split())


def jaccard(a: str, b: str) -> float:
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def containment(a: str, b: str) -> float:
    """|a∩b| / min(|a|,|b|) — catches 'Approve X' ⊂ 'Approve X and Y'."""
    ta, tb = tokens(a), tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / min(len(ta), len(tb))
