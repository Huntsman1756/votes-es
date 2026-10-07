"""MAPFRE × N-PX proposal matcher — precision-first, one-to-one, auditable.

Topology: inside one canonical meeting, MAPFRE item rows are assigned to
N-PX canonical proposal clusters (silver proposal_ids having ≥1 sec_npx
or iss_vds instance). Assignment is greedy-by-score with exclusivity —
two MAPFRE items can never map to the same canonical proposal, and the
Iberdrola double-scrip case (same title, different items) stays split.

Hierarchy:
    EXACT_ITEM_AND_TEXT   ballot number + identical normalized text
    EXACT_ITEM            ballot/item number equal
    EXACT_TEXT            normalized text identical
    RULE_HIGH_CONFIDENCE  score >= T_HI and margin >= M
    AMBIGUOUS             score >= T_LO but below promotion bar
    UNMATCHED             no candidate above T_LO

Score components (weights documented, no learned parameters):
    text      = max(jaccard, containment) on normalized tokens
    category  = Jaccard on category sets when both sides declare one
    proponent = hard veto on MANAGEMENT vs SHAREHOLDER mismatch
    sequence  = weak bonus when relative item order agrees
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from itertools import product

from votes_es.reconcile.normalize import (
    containment,
    jaccard,
)

MATCHER_VERSION = "g9-matcher-1.0.0"

# promotion bars — calibrated on the 26-meeting golden corpus
T_HI = 0.72
T_LO = 0.45
MARGIN_MIN = 0.12

W_TEXT = 0.70
W_CAT = 0.15
W_SEQ = 0.15


@dataclass
class SourceProposal:
    """One MAPFRE item row (or generically: a source-side proposal)."""
    key: str                    # stable id: observation+item
    raw: str
    norm: str
    item: str | None
    proponent: str | None       # MANAGEMENT / SHAREHOLDER / None
    categories: frozenset[str]
    seq: int                    # ordinal position within its meeting


@dataclass
class CanonicalProposal:
    """An N-PX canonical cluster (one silver proposal_id)."""
    proposal_id: str
    raw_variants: list[str]
    norm_variants: list[str]    # normalized form of every variant
    norm_rep: str               # representative normalized text
    ballot: str | None
    proponent: str | None
    categories: frozenset[str]
    seq: int | None             # agenda position when a ballot number exists


@dataclass
class Match:
    source_key: str
    proposal_id: str | None
    method: str
    score: float
    margin: float
    best_rival: str | None
    evidence: str
    review_status: str          # EXACT / HIGH_CONFIDENCE / AMBIGUOUS / UNRESOLVED


@dataclass
class MeetingResult:
    matches: list[Match] = field(default_factory=list)


@dataclass
class _Pair:
    mp: SourceProposal
    cp: CanonicalProposal
    score: float
    parts: dict[str, float]
    exact_item: bool
    exact_text: bool


def _num(item: str | None) -> str | None:
    if not item:
        return None
    m = re.match(r"^(\d+)", item.strip())
    return m.group(1) if m else None


def _norm_ballot(b: str | None) -> str | None:
    if not b:
        return None
    return re.sub(r"[^0-9a-z]", "", b.lower()) or None


def _score(mp: SourceProposal, cp: CanonicalProposal,
           ) -> tuple[float, dict[str, float]]:
    """Component score — all signals transparent in the evidence dict.

    Text compares against EVERY N-PX variant in the cluster (filers word
    the same item differently); the best variant wins."""
    text = 0.0
    for v in cp.norm_variants:           # normalize_* is idempotent
        text = max(text, jaccard(mp.norm, v), containment(mp.norm, v))
    cat = 0.0
    if mp.categories and cp.categories:
        inter = len(mp.categories & cp.categories)
        cat = inter / len(mp.categories | cp.categories)
    seq = 0.0
    if mp.seq is not None and cp.seq is not None:
        seq = 1.0 if mp.seq == cp.seq else max(0.0, 1 - abs(mp.seq - cp.seq) * 0.25)
    total = W_TEXT * text + W_CAT * cat + W_SEQ * seq
    return total, {"text": text, "cat": cat, "seq": seq}


def _proponent_veto(mp: SourceProposal, cp: CanonicalProposal) -> bool:
    if not mp.proponent or not cp.proponent:
        return False
    return (mp.proponent != cp.proponent
            and {mp.proponent, cp.proponent} == {"MANAGEMENT", "SHAREHOLDER"})


def match_meeting(mps: list[SourceProposal],
                  cps: list[CanonicalProposal]) -> MeetingResult:
    """Greedy one-to-one assignment inside ONE meeting.

    Pairs sorted by (rule strength, score, margin) descending; a canonical
    proposal is consumed once matched. Deterministic: stable tie-breaks on
    keys, no randomness, no timestamps.
    """
    pairs: list[_Pair] = []
    for mp, cp in product(mps, cps):
        if _proponent_veto(mp, cp):
            continue
        bi, bc = _norm_ballot(mp.item), _norm_ballot(cp.ballot)
        exact_item = bool(bi and bc and (bi == bc or _num(mp.item) == _num(cp.ballot)))
        pairs.append(_Pair(mp=mp, cp=cp, score=_score(mp, cp)[0],
                           parts=_score(mp, cp)[1],
                           exact_item=exact_item,
                           exact_text=mp.norm == cp.norm_rep))
    pairs.sort(key=lambda p: (-int(p.exact_item and p.exact_text),
                              -int(p.exact_item), -int(p.exact_text),
                              -p.score, p.mp.key, p.cp.proposal_id))

    used_m: set[str] = set()
    used_c: set[str] = set()
    res = MeetingResult()
    # pass 1: hard-exact assignments first (item+text, then item, then text)
    for want in ("exact_item_and_text", "exact_item", "exact_text"):
        for p in pairs:
            if p.mp.key in used_m or p.cp.proposal_id in used_c:
                continue
            if want == "exact_item_and_text" and not (
                    p.exact_item and p.exact_text):
                continue
            if want == "exact_item" and not (p.exact_item and not p.exact_text):
                continue
            if want == "exact_text" and not (p.exact_text and not p.exact_item):
                continue
            _assign(res, p, used_m, used_c)
    # pass 2: scored, margin-aware
    for p in pairs:
        if p.mp.key in used_m or p.cp.proposal_id in used_c:
            continue
        if p.score < T_LO:
            continue
        second = max((q.score for q in pairs if q.mp is p.mp
                      and q.cp.proposal_id != p.cp.proposal_id
                      and q.cp.proposal_id not in used_c), default=0.0)
        margin = p.score - second
        promote = (p.parts["text"] >= 0.85
                   or (p.score >= T_HI and p.parts["text"] >= 0.60))
        if promote and margin >= MARGIN_MIN:
            _assign(res, p, used_m, used_c, margin=margin, second=second)
        else:
            res.matches.append(Match(
                source_key=p.mp.key, proposal_id=None,
                method="AMBIGUOUS", score=round(p.score, 4),
                margin=round(margin, 4), best_rival=p.cp.proposal_id,
                evidence=f"score={p.score:.2f} margin={margin:.2f} "
                         f"below promotion bar; rival={second:.2f}",
                review_status="AMBIGUOUS"))
            used_m.add(p.mp.key)
    for mp in mps:
        if mp.key not in used_m:
            res.matches.append(Match(
                source_key=mp.key, proposal_id=None, method="UNMATCHED",
                score=0.0, margin=0.0, best_rival=None,
                evidence="no candidate above floor", review_status="UNRESOLVED"))
            used_m.add(mp.key)
    return res


def _assign(res: MeetingResult, p: _Pair, used_m: set[str], used_c: set[str],
            margin: float = 1.0, second: float = 0.0) -> None:
    mp, cp = p.mp, p.cp
    method = ("EXACT_ITEM_AND_TEXT" if p.exact_item and p.exact_text
              else "EXACT_ITEM" if p.exact_item
              else "EXACT_TEXT" if p.exact_text
              else "RULE_HIGH_CONFIDENCE")
    used_m.add(mp.key)
    used_c.add(cp.proposal_id)
    ev = (f"item={mp.item}~{cp.ballot} "
          f"text={p.parts['text']:.2f} cat={p.parts['cat']:.2f} "
          f"seq={p.parts['seq']:.2f} score={p.score:.2f} "
          f"margin={margin:.2f} rival={second:.2f}")
    res.matches.append(Match(
        source_key=mp.key, proposal_id=cp.proposal_id, method=method,
        score=round(p.score, 4), margin=round(margin, 4),
        best_rival=None, evidence=ev,
        review_status=("EXACT" if method.startswith("EXACT")
                       else "HIGH_CONFIDENCE")))
