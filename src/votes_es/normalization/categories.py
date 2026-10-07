"""Proposal categories.

Two layers, both preserved:
- taxonomy='SEC'     — verbatim N-PX categoryType values (a proposal may carry several)
- taxonomy='VOTES_ES'— deterministic high-level crosswalk from proposal text
                       + source categories. Rules documented in METHODOLOGY.md.

VDS categories (ProposalCategory / NPXSecProposalCategory) are kept verbatim
under taxonomy='VDS' / 'SEC' respectively.
"""
from __future__ import annotations

import re
import unicodedata

from votes_es.domain.enums import HighLevelCategory
from votes_es.normalization.text import normalize_spaces

# Verbatim SEC categoryType values observed — kept as-is under taxonomy SEC.
# The VOTES_ES crosswalk below is intentionally conservative: keyword rules on
# normalized title text. No inference beyond the rule list.

_RULES: list[tuple[re.Pattern[str], HighLevelCategory]] = [
    (re.compile(r"\b(director|board member|trustee|board of directors)\b.*\b(elect|appoint|re-?elect|ratify|remove|discharge)\b", re.IGNORECASE), HighLevelCategory.DIRECTOR_ELECTION),
    (re.compile(r"\b(elect|appoint|re-?elect|ratify|recall)\b.*\b(director|trustee|member of the board)\b", re.IGNORECASE), HighLevelCategory.DIRECTOR_ELECTION),
    (re.compile(r"\b(remuneration|compensation|pay)\b", re.IGNORECASE), HighLevelCategory.EXECUTIVE_COMPENSATION),
    (re.compile(r"say[- ]on[- ]pay|advisory vote.*compensation|compensation.*advisory", re.IGNORECASE), HighLevelCategory.EXECUTIVE_COMPENSATION),
    (re.compile(r"\b(auditor|audit|accounts? auditor|reappoint.*audit)\b", re.IGNORECASE), HighLevelCategory.AUDIT),
    (re.compile(r"\b(share capital|capital increase|capital reduction|issue shares|issuance|dividend|buy[- ]?back|repurchase|scrip|treasury stock|amortiz|debt issuance|authorize.*capital)\b", re.IGNORECASE), HighLevelCategory.CAPITAL),
    (re.compile(r"\b(article|by-?laws?|bylaws|articles of association|estatutos|quorum|shareholder rights?|proxy access|special meeting|written consent|supermajority|one share one vote|voting rights)\b", re.IGNORECASE), HighLevelCategory.SHAREHOLDER_RIGHTS),
    (re.compile(r"\b(annual accounts|financial statements|management report|annual report|allocation of (income|results|profits)|approve.*accounts|discharge of (the )?board|application of results)\b", re.IGNORECASE), HighLevelCategory.ACCOUNTS_REPORTS),
    (re.compile(r"\b(climate|environment|emissions?|net[- ]?zero|paris|scope \d|sustainab\w+ (plan|report)|say on climate|transition plan)\b", re.IGNORECASE), HighLevelCategory.ENVIRONMENT),
    (re.compile(r"\b(human rights|diversity|labor|labour|political (contribution|spending)|lobbying|racial|gender pay)\b", re.IGNORECASE), HighLevelCategory.SOCIAL),
    (re.compile(r"\b(corporate governance|board size|board (structure|composition|diversity|independence)|chairman|chair|lead independent|committee|proxy|independent director|classified board|declassif)\b", re.IGNORECASE), HighLevelCategory.GOVERNANCE),
    (re.compile(r"\b(merger|acquisition|spin[- ]?off|sale of assets|dissolution|liquidation|statutory|legal formalit|delegat\w+ of powers|ratify appointment)\b", re.IGNORECASE), HighLevelCategory.STATUTORY),
]

_SPONSOR_HINT = re.compile(r"shareholder", re.IGNORECASE)


def classify_title(title_raw: str) -> HighLevelCategory:
    """Deterministic high-level category from normalized proposal text."""
    t = normalize_spaces(unicodedata.normalize("NFKC", title_raw or ""))
    for rx, cat in _RULES:
        if rx.search(t):
            return cat
    return HighLevelCategory.OTHER


def normalize_sec_category(raw: str) -> str:
    """SEC categoryType verbatim, whitespace-normalized."""
    return normalize_spaces(raw).upper()
