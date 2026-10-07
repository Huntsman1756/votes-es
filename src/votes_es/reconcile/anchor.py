"""G9-R official-agenda anchoring.

Source proposal descriptions (MAPFRE items, N-PX voteDescriptions) are
mapped to *official* agenda items — never to each other. Canonical
proposal identity is anchored in issuer evidence (BORME convocatoria,
issuer AGM notice, results announcement), not in reporter phrasing.

Promotion hierarchy:
    EXACT_OFFICIAL_ITEM   item number + concept agree
    EXACT_OFFICIAL_TEXT   normalized wording == editorial EN title
    RULE_HIGH_CONFIDENCE  concept equal AND composite >= bar AND margin >= bar
    REVIEWED              human/agent-verified override (recorded, never
                          evidence for the general rule)
    AMBIGUOUS             above floor, below promotion bar
    UNMATCHED             no candidate

A wording whose concept resolves to NON_ITEM is never a proposal — it is
custodian instruction noise filed as a voteDescription.
"""
from __future__ import annotations

import csv
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from votes_es.reconcile.matcher import Match
from votes_es.reconcile.normalize import jaccard, containment, normalize_for_match

ANCHOR_VERSION = "g9r-anchor-1.0.0"
AGENDA_DIR = Path("data/reference/official_agendas")
LEXICON = Path(__file__).resolve().parents[1] / "reference" / "proposal_semantics.csv"

# promotion bars — calibrated on the curated corpus, not copied
T_LO = 0.40
MARGIN_MIN = 0.15

W_CONCEPT = 0.45
W_TEXT = 0.35
W_ITEM = 0.20

_PUNCT = re.compile(r"[^\w\s]")
_WS = re.compile(r"\s+")


def _load_lexicon() -> list[tuple[str, re.Pattern]]:
    rules: list[tuple[str, re.Pattern]] = []
    with LEXICON.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rules.append((row["concept_id"],
                          re.compile(row["en_pattern"], re.IGNORECASE)))
    return rules


_RULES = _load_lexicon()


def concept_of(text: str | None) -> str | None:
    """First matching concept rule wins; rules are ordered specific→generic.
    Bundled wordings ('TITLE: SUB-ITEM TEXT') resolve on the last segment —
    ISS filers prefix the bundle title and append the voted item."""
    t = unicodedata.normalize("NFKC", text or "")
    tail = t.split(":")[-1] if ":" in t else t
    # leftmost match inside the tail wins — trailing delegation boilerplate
    # ('...and delegation of powers') must not shadow the lead topic
    hits = sorted(
        (m.start(), i, cid)
        for i, (cid, pat) in enumerate(_RULES)
        if (m := pat.search(tail)))
    if hits:
        return hits[0][2]
    # fall back to full-text concept when tail found nothing
    for cid, pat in _RULES:
        if pat.search(t):
            return cid
    return None


_SEG_SPLIT = re.compile(r"\s+SECURITIES:\s+|\s+SHARES?:\s+|:\s+")


def segment_concepts(text: str | None) -> list[str]:
    """Distinct concepts across ':'-separated segments, in order.

    Some register lines concatenate several agenda items (MAPFRE's
    'SECURITIES:' separator) or prefix a bundle title (ISS style).  When the
    segments resolve to different official items the row is bundled — it
    anchors to its *numbered* primary item or stays AMBIGUOUS."""
    t = unicodedata.normalize("NFKC", text or "")
    segs = [s for s in _SEG_SPLIT.split(t) if s.strip()]
    if len(segs) == 1:
        # even a single-phrase wording can bundle two votes
        # ('accounts AND discharge') — collect ALL distinct concepts present
        out = [cid for cid, pat in _RULES if pat.search(t)]
        if "ACCOUNTS" in out and ({"ACCOUNTS_SOLO", "ACCOUNTS_GROUP"}
                                 & set(out)):
            out.remove("ACCOUNTS")
        return out
    out: list[str] = []
    for s in segs:
        c = None
        for cid, pat in _RULES:
            if pat.search(s):
                c = cid
                break
        if c and c not in out:
            out.append(c)
    # a generic ACCOUNTS hit alongside a specific sibling adds nothing
    if "ACCOUNTS" in out and ({"ACCOUNTS_SOLO", "ACCOUNTS_GROUP"} & set(out)):
        out.remove("ACCOUNTS")
    return out


# concept pairs that may legitimately resolve to the same official item
# (result allocation typically includes dividend distribution)
_CONCEPT_COMPAT = [frozenset({"ALLOCATION", "DIVIDEND"}),
                   frozenset({"ACCOUNTS", "ACCOUNTS_SOLO"}),
                   frozenset({"ACCOUNTS", "ACCOUNTS_GROUP"})]
# note: ACCOUNTS_SOLO and ACCOUNTS_GROUP are never mutually compatible —
# 'standalone' vs 'consolidated' is the load-bearing distinction


def _concept_class(cid: str | None) -> str:
    """Equivalence class for bundled detection: compat group or itself."""
    for i, g in enumerate(_CONCEPT_COMPAT):
        if cid in g:
            return f"__compat{i}"
    return cid or "__none"


def _concept_eq(src_concept: str | None, item_concept: str | None) -> bool:
    if not src_concept or not item_concept or item_concept == "NON_ITEM":
        return False
    if src_concept == item_concept:
        return True
    return any(src_concept in g and item_concept in g
               for g in _CONCEPT_COMPAT)


_ROMAN = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5",
          "vi": "6", "vii": "7", "viii": "8", "ix": "9", "x": "10",
          "xi": "11", "xii": "12"}


def _norm_item(s: str | None) -> str | None:
    """'3B' -> '3.b', 'IV.5' -> '4.5', 'VII' -> '7', '2.1' -> '2.1'."""
    if not s:
        return None
    t = re.sub(r"[\s\.]", "", s.strip().lower())
    # roman numeral parent with optional numeric/letter sub-item:
    # 'iv5' -> '4.5', 'ivb' -> '4.b', 'vii' -> '7'
    m = re.match(r"^([ivx]+)([a-z]|\d+)?$", t)
    if m and m.group(1) in _ROMAN:
        out = _ROMAN[m.group(1)]
        if m.group(2):
            out += "." + m.group(2)
        return out
    m = re.match(r"^(\d+)([a-z]\d*)?(\d+)?$", t)
    if not m:
        return t or None
    out = m.group(1)
    if m.group(2):
        out += "." + m.group(2)
    elif m.group(3):
        out += "." + m.group(3)
    return out


_NAME_RE = re.compile(
    r"(?:elect|re.?elect|appoint|ratif\w*|re-?election of|"
    r"reelecci[oó]n(?:\s+y nombramiento)?\s+de|nombramiento(?:\s+y reelecci[oó]n)?\s+de|"
    r"ratificaci[oó]n(?:\s+del nombramiento(?: por cooptaci[oó]n)?\s+y reelecci[oó]n)?\s+de)"
    r"(?:\s+(?:de\s+)?(?:don|doña|dña|d\.ª?|mr\.?|mrs\.?|ms\.?|miss|dr\.?|"
    r"dña\.?|doña\.?|don\.?))?\s*"
    r"([a-záéíóúñüªº'\-. ]+)",
    re.IGNORECASE)


def person_tokens(text: str | None) -> frozenset[str]:
    """Deterministic person-name extraction — signals only, never a
    people master. Returns surname+given tokens."""
    m = _NAME_RE.search(normalize_for_match(text or ""))
    if not m:
        return frozenset()
    tail = m.group(1)
    tail = re.sub(r"\b(as|to|the|a|an|of|for|director|directors|board|member|"
                  r"members|chair|independent|executive|proprietary|external|"
                  r"own|non-executive|replacement|term|year|years|financial|"
                  r"como|consejero|consejera|ejecutivo|ejecutiva|dominical|"
                  r"independiente|externo|externa|uno|dos|tres|cuatro|cinco|"
                  r"seis|siete|ocho|nueve|diez|once|doce|catorce|quince)\b.*$",
                  "", tail).strip()
    toks = {t for t in tail.split() if len(t) > 1}
    return frozenset(toks)


@dataclass
class AgendaItem:
    item_number: str
    parent: str | None
    order: int
    title_es: str
    title_en: str
    concept_id: str
    votable_status: str
    source_url: str
    source_ref: str
    retrieved_at: str = ""

    @property
    def norm_en(self) -> str:
        return normalize_for_match(self.title_en)

    @property
    def norm_item(self) -> str | None:
        return _norm_item(self.item_number)


@dataclass
class SourceRow:
    """A source-side proposal wording to be anchored."""
    key: str
    raw: str
    item: str | None           # agenda number printed by the source, if any
    proponent: str | None


def load_agendas(root: Path = AGENDA_DIR) -> dict[tuple[str, str], list[AgendaItem]]:
    """{(isin, meeting_date): [AgendaItem, ...]} — curated, evidence-stamped."""
    out: dict[tuple[str, str], list[AgendaItem]] = {}
    if not root.exists():
        return out
    for p in sorted(root.glob("*.csv")):
        for r in csv.DictReader(p.open(encoding="utf-8")):
            it = AgendaItem(
                item_number=r["item_number"], parent=r["parent_item"] or None,
                order=int(r["item_order"]), title_es=r["title_es"],
                title_en=r["title_en"], concept_id=r["concept_id"],
                votable_status=r["votable_status"],
                source_url=r["source_url"], source_ref=r["source_ref"],
                retrieved_at=r.get("retrieved_at", ""))
            out.setdefault((r["isin"], r["meeting_date"]), []).append(it)
    for v in out.values():
        v.sort(key=lambda a: a.order)
    return out


def _score(src: SourceRow, it: AgendaItem) -> tuple[float, dict[str, float]]:
    cid = concept_of(src.raw)
    it_eq = 1.0 if (_norm_item(src.item) and _norm_item(src.item)
                    == it.norm_item) else 0.0
    # compat equality (accounts↔accounts, allocation↔dividend) only counts
    # when the printed item number corroborates — generic wordings alone
    # must not steal a neighbouring item
    if cid == it.concept_id and it.concept_id != "NON_ITEM":
        c_eq = 1.0
    elif _concept_eq(cid, it.concept_id) and it_eq:
        c_eq = 1.0
    else:
        c_eq = 0.0
    txt = max(jaccard(src.raw, it.title_en), containment(src.raw, it.title_en),
              jaccard(src.raw, it.title_es), containment(src.raw, it.title_es))
    # person-name agreement sharpens director elections
    sp, ip = person_tokens(src.raw), person_tokens(it.title_es + " " + it.title_en)
    if sp and ip:
        common = len(sp & ip)
        if it.concept_id == "DIRECTOR_ELECTION" and common >= 2:
            txt = max(txt, 0.9) if c_eq else txt
            txt = max(txt, 0.85 + 0.05 * common)
        elif it.concept_id == "DIRECTOR_ELECTION" and common == 0 and c_eq:
            txt = min(txt, 0.2)      # same concept, different person → negative
    return (W_CONCEPT * c_eq + W_TEXT * txt + W_ITEM * it_eq,
            {"concept": c_eq, "text": txt, "item": it_eq})


def anchor_meeting(rows: list[SourceRow], agenda: list[AgendaItem],
                   one_to_one: bool = True) -> list[Match]:
    """Greedy assignment of source rows to official agenda items.

    one_to_one=True (MAPFRE itemized register): each official item can be
    claimed by at most one source row — two register lines never collapse.
    one_to_one=False (N-PX wording variants): many wordings may map to the
    same official item — they are observations OF the item, not items.
    Assignment order is by descending best score (deterministic ties).
    """
    norm_rows = [(r, concept_of(r.raw), segment_concepts(r.raw)) for r in rows]
    result: list[Match] = []
    used_items: set[str] = set()
    bundled_keys: set[str] = set()

    # bundled rows: segments resolve to >=2 distinct *concept classes*
    # (compat siblings count as one class — 'allocation and dividend' is
    # one agenda item, not a bundle)
    for r, _cid, segs in norm_rows:
        classes = {_concept_class(c) for c in segs}
        classes.discard("__none")
        if len(classes) > 1:
            bundled_keys.add(r.key)

    cands = []
    for r, cid, segs in norm_rows:
        if cid == "NON_ITEM":
            result.append(Match(r.key, None, "UNMATCHED", 0.0, 0.0, None,
                                "custodian/instruction noise — not a proposal",
                                "UNRESOLVED"))
            continue
        for it in agenda:
            s, parts = _score(r, it)
            # bundled: segment-level concept equality also counts
            if r.key in bundled_keys and parts["concept"] == 0.0 \
                    and it.concept_id in segs:
                s += W_CONCEPT
                parts["concept"] = 1.0
            cands.append((r, it, s, parts,
                          _norm_item(r.item) == it.norm_item))
    cands.sort(key=lambda x: (-x[2], x[0].key, x[1].item_number))

    by_row: dict[str, list] = {}
    for c in cands:
        by_row.setdefault(c[0].key, []).append(c)
    # resolve contested items: rows with stronger best-match go first
    row_order = sorted(
        ((r, cid, segs) for r, cid, segs in norm_rows if cid != "NON_ITEM"),
        key=lambda rc: -(by_row.get(rc[0].key) or [(0, 0, -1.0, 0, 0)])[0][2])

    for r, cid, segs in row_order:
        opts = [c for c in by_row.get(r.key, [])
                if not one_to_one or c[1].item_number not in used_items
                or _is_subitem(r, c[1])]
        if not opts:
            result.append(Match(r.key, None, "UNMATCHED", 0.0, 0.0, None,
                                "no official candidate", "UNRESOLVED"))
            continue
        # name-only election wording: no concept keyword, but a person
        # name shared with exactly one DIRECTOR_ELECTION item identifies it
        if cid is None:
            sp = person_tokens(r.raw)
            if sp:
                named = [a for a in agenda
                         if a.concept_id == "DIRECTOR_ELECTION"
                         and len(sp & person_tokens(a.title_es + " "
                                                    + a.title_en)) >= 2]
                if len(named) == 1:
                    it = named[0]
                    result.append(Match(
                        r.key, it.item_number, "RULE_HIGH_CONFIDENCE",
                        0.70, 0.0, None,
                        f"person-name match -> official item "
                        f"{it.item_number} | {it.source_ref}",
                        "HIGH_CONFIDENCE"))
                    used_items.add(it.item_number)
                    continue
        bundled = r.key in bundled_keys
        if bundled:
            seg_classes = {_concept_class(c) for c in segs}
            # bundled row: anchor to its numbered primary item if present,
            # else AMBIGUOUS — never silently pick one segment's item
            eqs = [c for c in opts if c[4]
                   and _concept_class(c[1].concept_id) in seg_classes]
            if eqs:
                best = eqs[0]
                it = best[1]
                result.append(Match(
                    r.key, it.item_number, "EXACT_OFFICIAL_ITEM",
                    round(best[2], 4), 0.0, None,
                    f"bundled row ({','.join(segs)}) anchored to its "
                    f"numbered primary item {it.item_number} | "
                    f"{it.source_ref}", "EXACT"))
                used_items.add(it.item_number)
            else:
                items = ",".join(sorted(
                    {a.item_number for a in agenda
                     if _concept_class(a.concept_id) in seg_classes}))
                result.append(Match(
                    r.key, None, "AMBIGUOUS", 0.0, 0.0, None,
                    f"bundled source row covers official items {items}",
                    "AMBIGUOUS"))
            continue
        best = opts[0]
        it, score, parts, item_eq = best[1], best[2], best[3], best[4]
        second = opts[1][2] if len(opts) > 1 else 0.0
        margin = score - second
        c_eq = parts["concept"] == 1.0
        unique_concept = (cid is not None and cid != "NON_ITEM"
                          and sum(1 for a in agenda
                                  if a.concept_id == cid) == 1)
        if item_eq and c_eq:
            method, status = "EXACT_OFFICIAL_ITEM", "EXACT"
        elif normalize_for_match(r.raw) == it.norm_en:
            method, status = "EXACT_OFFICIAL_TEXT", "EXACT"
        elif c_eq and score >= T_LO + 0.30 and margin >= MARGIN_MIN:
            method, status = "RULE_HIGH_CONFIDENCE", "HIGH_CONFIDENCE"
        elif c_eq and cid == it.concept_id and unique_concept \
                and score >= T_LO:
            # the concept appears on exactly one agenda item — the concept
            # itself is the identity; wording margin is irrelevant
            method, status = "RULE_HIGH_CONFIDENCE", "HIGH_CONFIDENCE"
        elif _concept_eq(cid, it.concept_id) \
                and sum(1 for a in agenda
                        if _concept_eq(cid, a.concept_id)) == 1:
            # generic wording (e.g. bare 'annual accounts') with exactly one
            # compat-compatible official item — safe to anchor
            method, status = "RULE_HIGH_CONFIDENCE", "HIGH_CONFIDENCE"
        elif score >= T_LO:
            result.append(Match(r.key, None, "AMBIGUOUS", round(score, 4),
                                round(margin, 4), it.item_number,
                                f"concept_eq={parts['concept']} "
                                f"text={parts['text']:.2f} "
                                f"item_eq={parts['item']} "
                                f"rival={second:.2f}",
                                "AMBIGUOUS"))
            continue
        else:
            result.append(Match(r.key, None, "UNMATCHED", round(score, 4),
                                round(margin, 4), None,
                                f"below floor; best={score:.2f} "
                                f"concept={concept_of(r.raw)}",
                                "UNRESOLVED"))
            continue
        result.append(Match(
            r.key, it.item_number, method, round(score, 4),
            round(margin, 4),
            opts[1][1].item_number if len(opts) > 1 else None,
            f"official item {it.item_number} ({it.concept_id}); "
            f"text={parts['text']:.2f} item_eq={parts['item']} "
            f"margin={margin:.2f} | {it.source_ref}",
            status))
        used_items.add(it.item_number)
    return result


def _is_subitem(r: SourceRow, it: AgendaItem) -> bool:
    return it.parent is not None and _norm_item(r.item) == it.norm_item
