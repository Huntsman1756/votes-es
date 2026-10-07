"""MAPFRE AM annual report PDF → itemized vote rows.

The annual "Informe de actividades de implicación" embeds an ISS
"Vote Summary" record: per-meeting blocks whose item rows carry

    Item | Proposal | Proposed by | Vote | Management Recommendation
         |          |             |      | For/Against Management

Layout properties that drive the design:

- Columns are positional (no ruling lines) and shift ~10pt between yearly
  prints. Calibration is DOCUMENT-level: the trailing four cell columns
  hold a closed vocabulary (Management/Shareholder/Non-Voting/For/Against/
  Abstain/Withheld/None/*Year*) — the four dominant x0 peaks below the
  proposal column are the column left-edges. Bands are the gaps between
  peaks. No per-year constants.
- Item markers `\\d+[A-Za-z]?\\.?` in the left margin start a vote row.
- Bundled sub-items (director elections) print numbered rows inside the
  proposal column carrying their own trailing cells -> parent.sub items.
- Markers can be VERTICALLY CENTRED across a multi-line row (2023 print):
  a marker line without proposal-column words merges into the open row —
  its trailing cells complete the proposal line(s) above it.
- Wrapped proposals: proposal-band-only lines append; rows may span a
  page break (page != page_end in output).
- Column headers repeat per meeting; a header word that bleeds into a
  data line produces non-vocabulary trailing text -> the row is flagged
  for quarantine, never silently repaired.

Deterministic: same PDF + same PARSER_VERSION -> same rows.
"""
from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

import pdfplumber

PARSER_VERSION = "mapfre-pdf-1.0.0"

ITEM_RE = re.compile(r"^\d{1,4}[A-Za-z]?\.?$")
SUB_RE = re.compile(r"^(\d{1,4})[a-z]?\.?\s+(.*)$")

COLHDR_WORDS = {"Item", "Proposal", "Proposed", "Vote", "Management",
                "For/Against", "by", "Recommendation"}
VOCAB = {"Management", "Shareholder", "Non-Voting", "For", "Against",
         "Abstain", "Withheld", "Withhold", "None", "One", "Two", "Three",
         "Year", "Years", "Do", "Not", "Vote", "Mixed", "Take", "No",
         "Action", "Refer", "1", "2", "3", "*"}
SEC_LBL = {"Security", "Ticker", "Symbol", "ISIN", "Record", "City",
           "SEDOL(s)", "Meeting", "Agenda", "Holding", "Recon", "Vote",
           "Deadline", "Quick", "Code", "Type", "Date", "Country", "ET",
           "AM", "PM", "States"}
HDR_FIELD_RE = re.compile(
    r"(Meeting Date|Record Date|Vote Deadline|Agenda \d|Holding Recon|SEDOL)")


@dataclass
class MapfreRow:
    """One parsed item row — raw cell text only, nothing normalized."""
    company_raw: str
    security_raw: str
    isin: str
    ticker_raw: str
    meeting_date_raw: str
    meeting_type_raw: str
    agenda_number: str
    record_date_raw: str
    vote_deadline_raw: str
    city_country_raw: str
    item_raw: str
    parent_item_raw: str | None
    proposal_text_raw: str
    proposed_by_raw: str
    vote_raw: str
    management_recommendation_raw: str
    for_against_raw: str
    page: int
    row_top: float
    page_end: int
    quarantined: bool = False
    quarantine_reason: str = ""


@dataclass
class ParseStats:
    rows: int = 0
    meetings: int = 0
    missing_proposal: int = 0
    missing_company: int = 0
    empty_vote: int = 0
    non_voting: int = 0
    split_page_rows: int = 0
    quarantined: int = 0
    uncalibrated: int = 0
    warnings: list[str] = field(default_factory=list)


def _cluster_lines(words: list[dict], tol: float = 2.5) -> list[list[dict]]:
    """Group words into visual lines (their cell baselines can drift ~2pt)."""
    lines: list[list[dict]] = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if lines and abs(w["top"] - lines[-1][0]) <= tol:
            lines[-1][1].append(w)
        else:
            lines.append([w["top"], [w]])
    return [ws for _top, ws in lines]


def _calibrate(all_words: list[list[dict]]) -> dict[str, tuple[float, float]] | None:
    """Document-level column bands from the closed vocabulary x0 peaks."""
    prop_x = None
    for words in all_words:
        lines = _cluster_lines(words)
        for ws in lines:
            texts = {w["text"] for w in ws}
            if "Item" in texts and "Proposal" in texts:
                pos = {w["text"]: w["x0"] for w in ws}
                prop_x = pos["Proposal"]
                break
        if prop_x is not None:
            break
    if prop_x is None:
        return None
    hist: Counter[int] = Counter()
    for words in all_words:
        for w in words:
            if w["text"] in VOCAB and w["x0"] > prop_x + 130:
                hist[int(w["x0"])] += 1
    xs = sorted(hist)
    if not xs:
        return None
    clusters, cur = [], [xs[0]]
    for x in xs[1:]:
        if x - cur[-1] <= 10:
            cur.append(x)
        else:
            clusters.append(cur)
            cur = [x]
    clusters.append(cur)
    clusters.sort(key=lambda c: -sum(hist[x] for x in c))
    edges = sorted(min(c) for c in clusters[:4])
    if len(edges) < 4:
        return None
    p, v, m, f = edges
    return {"item": (80, prop_x - 4), "proposal": (prop_x - 4, p - 4),
            "proposer": (p - 4, v - 4), "vote": (v - 4, m - 4),
            "mgmt_rec": (m - 4, f - 4), "for_against": (f - 4, 570)}


def _field(meeting: dict, text: str) -> None:
    """Meeting-header scalar extraction — raw strings kept verbatim."""
    for pat, key in [
        (r"Meeting Date (\S+)", "meeting_date_raw"),
        (r"ISIN (\S+)", "isin"),
        (r"Agenda (\S+)", "agenda_number"),
        (r"Record Date (\S+)", "record_date_raw"),
        (r"Vote Deadline (\S+(?:\s+\S+)?)", "vote_deadline_raw"),
        (r"Ticker Symbol (\S+)", "ticker_raw"),
        (r"Meeting Type (.+?)(?:\s+Agenda|$)", "meeting_type_raw"),
        (r"Security (\S+)", "security_raw"),
        (r"City / Country (.*?)(?:\s+Vote Deadline|$)", "city_country_raw"),
    ]:
        m = re.search(pat, text)
        if m and not meeting.get(key):
            meeting[key] = m.group(1).strip()


def _vocab_clean(words: list[str]) -> bool:
    """Trailing cells may only contain the closed vocabulary."""
    return all(w in VOCAB for w in words)


def parse_pdf(path: Path) -> tuple[list[MapfreRow], ParseStats]:
    """Parse one MAPFRE annual report PDF into raw item rows."""
    stats = ParseStats()
    rows: list[MapfreRow] = []
    with pdfplumber.open(path) as pdf:
        all_words = [
            p.extract_words(x_tolerance=1.2, y_tolerance=1.5)
            for p in pdf.pages]
    bands = _calibrate(all_words)
    if bands is None:
        stats.warnings.append("no Vote Summary table found")
        return rows, stats

    def band(x: float) -> str | None:
        for k, (a, b) in bands.items():
            if a <= x < b:
                return k
        return None

    ib = bands["item"][1]
    meeting: dict | None = None
    cur: dict | None = None
    pending_name: str | None = None
    in_hdr = False

    def emit() -> None:
        nonlocal cur
        if cur is None:
            return
        c = cur["cols"]
        trailing_bad = any(
            c[k] and not _vocab_clean(c[k])
            for k in ("proposer", "vote", "mgmt_rec", "for_against"))
        row = MapfreRow(
            company_raw=(cur["meeting"] or {}).get("company_raw", ""),
            security_raw=(cur["meeting"] or {}).get("security_raw", ""),
            isin=(cur["meeting"] or {}).get("isin", ""),
            ticker_raw=(cur["meeting"] or {}).get("ticker_raw", ""),
            meeting_date_raw=(cur["meeting"] or {}).get("meeting_date_raw", ""),
            meeting_type_raw=(cur["meeting"] or {}).get("meeting_type_raw", ""),
            agenda_number=(cur["meeting"] or {}).get("agenda_number", ""),
            record_date_raw=(cur["meeting"] or {}).get("record_date_raw", ""),
            vote_deadline_raw=(cur["meeting"] or {}).get("vote_deadline_raw", ""),
            city_country_raw=(cur["meeting"] or {}).get("city_country_raw", ""),
            item_raw=cur["item"], parent_item_raw=cur["parent"],
            proposal_text_raw=" ".join(c["proposal"]).strip(),
            proposed_by_raw=" ".join(c["proposer"]),
            vote_raw=" ".join(c["vote"]),
            management_recommendation_raw=" ".join(c["mgmt_rec"]),
            for_against_raw=" ".join(c["for_against"]),
            page=cur["page"], row_top=cur["row_top"], page_end=cur["page_end"],
        )
        reasons = []
        if trailing_bad:
            reasons.append("non_vocabulary_cell_text")
        if not row.proposal_text_raw:
            reasons.append("missing_proposal")
        if not row.isin and not row.company_raw:
            reasons.append("no_meeting_identity")
        if reasons:
            row.quarantined = True
            row.quarantine_reason = "|".join(reasons)
            stats.quarantined += 1
        if not row.proposal_text_raw:
            stats.missing_proposal += 1
        if not row.company_raw:
            stats.missing_company += 1
        if not row.vote_raw:
            stats.empty_vote += 1
        if row.proposed_by_raw == "Non-Voting":
            stats.non_voting += 1
        if row.page != row.page_end:
            stats.split_page_rows += 1
        rows.append(row)
        cur = None

    def new_row(meeting_ref, item, parent, page, top) -> dict:
        return {"meeting": meeting_ref, "item": item, "parent": parent,
                "page": page, "page_end": page, "row_top": top,
                "cols": {k: [] for k in bands}}

    for pno, words in enumerate(all_words, 1):
        for ws in _cluster_lines(words):
            ws = sorted(ws, key=lambda w: w["x0"])
            x0 = ws[0]["x0"]
            text = " ".join(w["text"] for w in ws)
            texts = {w["text"] for w in ws}
            if (texts <= COLHDR_WORDS
                    or texts <= {"by", "Recommendation", "Management"}):
                continue
            if x0 < ib and ws[0]["text"] == "Security":
                emit()
                meeting = {"company_raw": pending_name or "", "page": pno}
                pending_name = None
                in_hdr = True
                stats.meetings += 1
                _field(meeting, text)
                continue
            if in_hdr and meeting is not None:
                _field(meeting, text)
                if x0 >= ib or ws[0]["text"] in SEC_LBL or HDR_FIELD_RE.search(text):
                    continue
                in_hdr = False
            if meeting is not None and x0 < ib and ITEM_RE.match(ws[0]["text"]):
                propw = [w for w in ws[1:] if band(w["x0"]) == "proposal"]
                if not propw and cur is not None:
                    # vertically-centred marker: trailing cells complete the
                    # open row; the marker supplies the real item id
                    for w in ws[1:]:
                        bb = band(w["x0"])
                        if bb and bb != "item":
                            cur["cols"][bb].append(w["text"])
                    cur["item"] = ws[0]["text"]
                    cur["page_end"] = pno
                    continue
                emit()
                cols = {k: [] for k in bands}
                for w in ws[1:]:
                    bb = band(w["x0"])
                    if bb and bb != "item":
                        cols[bb].append(w["text"])
                cur = {"meeting": meeting, "item": ws[0]["text"], "parent": None,
                       "page": pno, "page_end": pno, "row_top": ws[0]["top"],
                       "cols": cols}
                continue
            if x0 < ib:
                # meeting-name line: caps text in the item/name margin
                if (re.search(r"[A-ZÁÉÍÓÚÑ]{3}", text) and text == text.upper()
                        and ws[0]["text"] not in SEC_LBL
                        and not ITEM_RE.match(ws[0]["text"])
                        and not text.startswith("MAPFRE")
                        and not re.search(r"\d+\.\d+\.", text)):
                    emit()
                    pending_name = ((pending_name + " ") if pending_name else "") + text
                continue
            if cur is None:
                continue
            lead = [w["text"] for w in ws if band(w["x0"]) == "proposal"]
            trail = {k: [w["text"] for w in ws if band(w["x0"]) == k]
                     for k in ("proposer", "vote", "mgmt_rec", "for_against")}
            if any(trail.values()):
                # bundled sub-item row (e.g. "1 Anne Chow" under item
                # DIRECTOR). A chain of sub-rows keeps the same parent:
                # '2 Anne'/'3 John' under item 2 -> 2.2 / 2.3.
                item = (cur["parent"] or cur["item"]) if cur else "?"
                emit()
                prop = " ".join(lead)
                parent: str | None = None
                m = SUB_RE.match(prop)
                if m and meeting is not None:
                    parent = item
                    item = f"{item.rstrip('.')}.{m.group(1)}"
                    prop = m.group(2)
                cols = {k: [] for k in bands}
                cols["proposal"] = prop.split() if prop else []
                for k in ("proposer", "vote", "mgmt_rec", "for_against"):
                    cols[k] = trail[k]
                cur = {"meeting": meeting, "item": item, "parent": parent,
                       "page": pno, "page_end": pno, "row_top": ws[0]["top"],
                       "cols": cols}
            else:
                cur["cols"]["proposal"].extend(lead)
                cur["page_end"] = pno
    emit()
    stats.rows = len(rows)
    return rows, stats


def semantic_consistency(row: MapfreRow) -> str | None:
    """Contradiction check between the three management-semantics cells.

    Returns a quarantine reason or None. The for/against column is the
    source's own alignment flag: vote == recommendation -> 'For'.
    A non-matching triple is a print/parse anomaly — quarantine, never
    repair.
    """
    vote = row.vote_raw.upper()
    rec = row.management_recommendation_raw.upper()
    fa = row.for_against_raw.upper()
    positions = {"FOR", "AGAINST", "ABSTAIN", "WITHHOLD", "WITHHELD"}
    if vote in {"FOR", "AGAINST"} and rec in {"FOR", "AGAINST"} \
            and fa in {"FOR", "AGAINST"}:
        expected = "FOR" if vote == rec else "AGAINST"
        if fa != expected:
            return "semantics_contradiction"
    elif vote and vote not in positions and not row.quarantined:
        return None                       # freq values etc. — normalization layer
    return None
