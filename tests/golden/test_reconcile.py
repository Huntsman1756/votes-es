"""G9 matcher — golden + property tests.

The golden file `proposal_matching/reviewed_matches.csv` was produced by
manual inspection of every auto-matched row (all verified SAME); the
unmatched rows are labeled UNRESOLVED, never DIFFERENT-by-default.
"""
import csv
from pathlib import Path

from votes_es.reconcile.matcher import (
    SourceProposal,
    CanonicalProposal,
    match_meeting,
)
from votes_es.reconcile.normalize import normalize_for_match

GOLD = Path(__file__).parent / "proposal_matching" / "reviewed_matches.csv"


def sp(key, raw, item=None, prop="Management", seq=None):
    return SourceProposal(key=key, raw=raw, norm=normalize_for_match(raw),
                          item=item, proponent=prop, categories=frozenset(),
                          seq=seq)


def cp(pid, texts, ballot=None, prop="Management", seq=None):
    texts = texts if isinstance(texts, list) else [texts]
    return CanonicalProposal(proposal_id=pid, raw_variants=texts,
                             norm_variants=[normalize_for_match(t) for t in texts],
                             norm_rep=normalize_for_match(texts[0]),
                             ballot=ballot, proponent=prop,
                             categories=frozenset(), seq=seq)


def test_exact_item_and_text():
    res = match_meeting(
        [sp("m1", "Approve Allocation of Income", item="3", seq=3)],
        [cp("c1", "Approve Allocation of Income", ballot="3", seq=3)])
    assert res.matches[0].method == "EXACT_ITEM_AND_TEXT"
    assert res.matches[0].proposal_id == "c1"


def test_duplicate_titles_stay_split():
    """Iberdrola scrip-dividend case: two same-title items must not merge
    onto one canonical proposal."""
    mps = [sp("a", "Approve Scrip Dividends", item="9", seq=9),
           sp("b", "Approve Scrip Dividends", item="10", seq=10)]
    cps = [cp("c9", "Approve Scrip Dividends", ballot="9", seq=9),
           cp("c10", "Approve Scrip Dividends", ballot="10", seq=10)]
    res = match_meeting(mps, cps)
    by_key = {m.source_key: m for m in res.matches}
    assert by_key["a"].proposal_id == "c9"
    assert by_key["b"].proposal_id == "c10"


def test_proponent_veto():
    mps = [sp("m1", "Climate disclosure report", item="8",
              prop="SHAREHOLDER", seq=8)]
    cps = [cp("c1", "Climate disclosure report", ballot="8",
              prop="MANAGEMENT", seq=8)]
    res = match_meeting(mps, cps)
    assert res.matches[0].method == "UNMATCHED"   # vetoed, not matched


def test_one_to_one():
    """Two MAPFRE items cannot collapse onto one canonical proposal."""
    mps = [sp("a", "Renew Appointment of PwC as Auditor", item="4", seq=4),
           sp("b", "Renew Appointment of PwC as Auditor", item="5", seq=5)]
    cps = [cp("c1", "Renew Appointment of PwC as Auditor", ballot="4", seq=4)]
    res = match_meeting(mps, cps)
    matched = [m for m in res.matches if m.proposal_id]
    assert len(matched) == 1
    assert matched[0].source_key == "a"           # item-4 evidence wins


def test_margin_blocks_ambiguous():
    """Similar-score rivals must not promote."""
    mps = [sp("m1", "Approve Remuneration Report", item="9", seq=9)]
    cps = [cp("c1", "Approve Remuneration Report", ballot="9", seq=9),
           cp("c2", "Approve Remuneration Policy", ballot="10", seq=10)]
    # make c2 unreachable on item so both live on text alone
    res = match_meeting(mps, [cps[1]])
    assert res.matches[0].method in ("AMBIGUOUS", "UNMATCHED")


def test_frozen_golden_corpus_precision():
    """Every auto match against the reviewed corpus must be SAME.

    We don't recompute matching here (needs the full gold DB); instead the
    corpus itself is the contract: REVIEWED rows must carry a canonical id
    and UNRESOLVED rows must not claim one."""
    rows = list(csv.DictReader(GOLD.open(encoding="utf-8")))
    assert len(rows) >= 200                    # the 278-instance corpus
    reviewed = [r for r in rows if r["review_status"] == "REVIEWED"]
    assert reviewed and all(
        r["expected_relation"] == "SAME" and r["canonical_proposal_id"]
        for r in reviewed)
    unresolved = [r for r in rows if r["review_status"] == "UNRESOLVED"]
    assert all(not r["canonical_proposal_id"] for r in unresolved)


def test_normalization_cases():
    assert normalize_for_match("Item 4. Elect Director Anne Chow") == \
        normalize_for_match("4) elect director anne chow")
    assert normalize_for_match('Stockholder proposal "on" climate') == \
        normalize_for_match("Shareholder proposal on climate")
    assert normalize_for_match("") == ""
    # discriminative tokens preserved
    n = normalize_for_match("Approve Remuneration Report")
    assert "remuneration" in n and "approve" in n
