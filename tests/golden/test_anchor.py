"""G9-R official-agenda anchoring — golden tests on the curated corpus.

Truth: official agenda items come from issuer/BORME/CNMV evidence
(data/reference/official_agendas/). The Inditex 2025 agenda is the
regression case for the N-PX over-fragmentation defect.
"""
from pathlib import Path


from votes_es.reconcile.anchor import (
    SourceRow, anchor_meeting, concept_of, load_agendas,
    person_tokens, segment_concepts)

AGENDAS = Path("data/reference/official_agendas")
ITX25 = ("ES0148396007", "2025-07-15")


def _agenda(key=ITX25):
    return load_agendas(AGENDAS)[key]


def _sr(key, raw, item=None):
    return SourceRow(key=key, raw=raw, item=item, proponent=None)


# ---------- corpus consistency ----------

def test_all_26_shared_meetings_have_agendas():
    ags = load_agendas(AGENDAS)
    assert len(ags) == 26
    for (isin, d), items in ags.items():
        assert all(i.votable_status in ("VOTABLE", "INFORMATION_ONLY")
                   for i in items), f"{isin} {d}"
        assert all(i.source_url and i.source_ref and i.retrieved_at
                   for i in items), f"{isin} {d} missing provenance"
        # order is strictly increasing
        orders = [i.order for i in items]
        assert orders == sorted(orders)


def test_inditex_2025_agenda_structure():
    """Official agenda: 9 votable (1.a,1.b,2..9) + item 10 information-only."""
    items = _agenda()
    nums = [i.item_number for i in items]
    assert nums == ["1.a", "1.b", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    by_num = {i.item_number: i for i in items}
    assert by_num["1.a"].parent == "1" and by_num["1.b"].parent == "1"
    assert by_num["10"].votable_status == "INFORMATION_ONLY"
    assert sum(1 for i in items if i.votable_status == "VOTABLE") == 10


# ---------- Inditex 2025 N-PX regression ----------

def test_npx_wordings_collapse_to_official_items():
    """Wordings that are mere phrasing variants land on the same item."""
    ag = _agenda()
    rows = [
        _sr("a", "Approve Consolidated Financial Statements", "2"),
        _sr("b", "Consolidated Accounts and Reports"),
        _sr("c", "APPROVAL OF THE CONSOLIDATED ANNUAL ACCOUNTS AND MANAGEMENT "
                 "REPORT OF THE GROUP", "2"),
    ]
    res = anchor_meeting(rows, ag, one_to_one=False)
    assert {m.proposal_id for m in res} == {"2"}


def test_split_1a_1b_preserved():
    ag = _agenda()
    rows = [
        _sr("a", "Approval of the individual annual accounts and management "
                 "report", "1a"),
        _sr("b", "Grant of discharge to the directors (approval of "
                 "management)", "1b"),
    ]
    res = {m.source_key: m for m in anchor_meeting(rows, ag, one_to_one=False)}
    assert res["a"].proposal_id == "1.a"
    assert res["b"].proposal_id == "1.b"


def test_bundled_wording_not_forced():
    """'accounts AND discharge' bundles 1.a+1.b — must stay AMBIGUOUS."""
    ag = _agenda()
    res = anchor_meeting(
        [_sr("x", "APPROVAL OF THE INDIVIDUAL ANNUAL ACCOUNTS AND GRANT OF "
                  "DISCHARGE TO THE DIRECTORS")], ag, one_to_one=False)
    assert res[0].proposal_id is None
    assert res[0].method == "AMBIGUOUS"


def test_custodian_noise_is_unmatched():
    ag = _agenda()
    res = anchor_meeting(
        [_sr("n", "INTERMEDIARY CLIENTS ONLY - PLEASE NOTE THAT VOTING MUST "
                  "BE LODGED WITH SHAREHOLDER DETAILS")],
        ag, one_to_one=False)
    assert res[0].method == "UNMATCHED" and res[0].proposal_id is None


def test_person_name_only_wording_anchors():
    ag = _agenda()
    res = anchor_meeting([_sr("e", "Elect Roberto Cibeira Moreiras")],
                         ag, one_to_one=False)
    assert res[0].proposal_id == "5"


def test_remuneration_report_is_item_8():
    ag = _agenda()
    res = anchor_meeting(
        [_sr("r", "ADVISORY VOTE ON ANNUAL REPORT ON REMUNERATION OF "
                  "DIRECTORS", "8")], ag, one_to_one=False)
    assert res[0].proposal_id == "8"


# ---------- MAPFRE register semantics ----------

def test_mapfre_one_to_one_no_silent_collapse():
    """Two register lines can never silently collapse to one official item."""
    ag = _agenda()
    rows = [
        _sr("m1", "APPROVAL OF THE CONSOLIDATED ANNUAL ACCOUNTS AND "
                  "MANAGEMENT REPORT", "2"),
        _sr("m2", "APPROVAL OF THE CONSOLIDATED ANNUAL ACCOUNTS AND "
                  "MANAGEMENT REPORT", "2"),
    ]
    res = anchor_meeting(rows, ag, one_to_one=True)
    items = [m.proposal_id for m in res if m.proposal_id]
    assert items == ["2"]  # only one claim; the second stays unresolved
    assert sum(1 for m in res if not m.proposal_id) == 1


def test_bundled_mapfre_row_anchors_to_numbered_primary():
    """CaixaBank 2024 case: multi-item register blob anchors to its own
    numbered item, never to a tail segment's item."""
    ags = load_agendas(AGENDAS)[("ES0140609019", "2024-03-21")]
    blob = ("REELECTION OF MARIA VERONICA FISAS VERGES AS DIRECTOR "
            "SECURITIES: REDUCTION OF THE SHARE CAPITAL SECURITIES: "
            "MODIFICATION OF THE REMUNERATION POLICY")
    res = anchor_meeting([_sr("b1", blob, "4")], ags, one_to_one=True)
    assert res[0].proposal_id == "4"          # Fisas re-election


def test_allocation_vs_extraordinary_dividend():
    """Airbus: ordinary result allocation != extraordinary dividend."""
    ag = load_agendas(AGENDAS)[("NL0000235190", "2024-04-10")]
    res = {m.source_key: m for m in anchor_meeting(
        [_sr("o", "APPROVAL OF THE RESULT ALLOCATION AND DISTRIBUTION OF A "
                  "REGULAR DIVIDEND", "2"),
         _sr("x", "APPROVAL OF AN EXTRAORDINARY DIVIDEND", "3")],
        ag, one_to_one=True)}
    assert res["o"].proposal_id == "2"
    assert res["x"].proposal_id == "3"


def test_information_only_item_never_claimed_by_noise():
    ag = _agenda()
    res = anchor_meeting([_sr("i", "random governance discussion text")],
                         ag, one_to_one=False)
    assert res[0].proposal_id is None


# ---------- concept/person plumbing ----------

def test_concept_of_tail_segment():
    assert concept_of("BOARD MATTERS: REELECTION OF DIRECTOR JANE DOE") \
        == "DIRECTOR_ELECTION"


def test_segment_concepts_multi():
    segs = segment_concepts(
        "REELECTION OF MARIA X AS DIRECTOR SECURITIES: "
        "SHARE CAPITAL REDUCTION")
    assert "DIRECTOR_ELECTION" in segs
    assert "CAPITAL_REDUCTION" in segs


def test_person_tokens_extracts_name():
    assert {"roberto", "cibeira"} <= person_tokens(
        "Elect Roberto Cibeira Moreiras")
