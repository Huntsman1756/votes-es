"""G10 canonical-proposal model tests.

Unit tests use a synthetic silver mini-corpus built in tmp_path against
the REAL committed agenda corpus (data/reference/official_agendas/).
Corpus regressions run only when data/canonical/ parquets exist.
"""
from __future__ import annotations

from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from votes_es.canonical.build import build
from votes_es.canonical.model import (
    agenda_item_id, canonical_id_consensus, canonical_id_official)

CANONICAL = Path("data/canonical")


def _mini_silver(tmp: Path) -> Path:
    """Synthetic silver for Inditex 2025 (real agenda corpus)."""
    silver = tmp / "silver"
    silver.mkdir()
    meetings = pa.table({
        "meeting_id": ["m:inditex25"], "issuer_id": ["i:itx"],
        "meeting_date": ["2025-07-15"], "meeting_type": ["AGM"],
        "source_meeting_ids": [["x"]], "season": [2025]})
    instruments = pa.table({
        "issuer_id": ["i:itx"], "isin": ["ES0148396007"],
        "figi": [None], "valid_from": ["1900"], "valid_to": [None]})
    proposals = pa.table({
        "proposal_id": ["p:same8", "p:bundled", "p:noise", "p:info10"],
        "meeting_id": ["m:inditex25"] * 4,
        "proposal_number": ["8", "2", "x", "10"],
        "proposal_title_normalized": ["rem", "acc", "noise", "info"],
        "sponsor_type": ["MANAGEMENT"] * 4})
    inst = pa.table({
        "proposal_id": ["p:same8", "p:bundled", "p:bundled",
                        "p:noise", "p:info10"],
        "source_id": ["sec_npx", "sec_npx", "sec_npx",
                      "sec_npx", "sec_npx"],
        "text_raw": ["Approve Remuneration Report",
                     "Approve Standalone Financial Statements",
                     "Approve Consolidated Financial Statements",
                     "PLEASE NOTE VOTING MUST BE LODGED WITH "
                     "CUSTODIAN BANK",
                     "Board of Directors Regulations Amendments"],
        "text_normalized": [""] * 5,
        "instance_key": ["k1", "k2", "k3", "k4", "k5"]})
    votes = pa.table({
        "vote_id": ["v:1"], "proposal_id": ["p:same8"],
        "source_id": ["sec_npx"], "reporter_id": ["r:x"],
        "reporting_unit_id": ["u:x"], "direction": ["FOR"],
        "source_observation_id": ["o:1"]})
    observations = pa.table({
        "observation_id": ["o:1"], "accession": ["acc1"],
        "source_document": ["d"], "source_id": ["sec_npx"]})
    units = pa.table({"unit_id": ["u:x"], "source_identifier": ["s1"]})
    for name, t in [("meetings", meetings), ("instruments", instruments),
                    ("proposals", proposals),
                    ("proposal_instances", inst), ("votes", votes),
                    ("observations", observations),
                    ("reporting_units", units)]:
        pq.write_table(t, silver / f"{name}.parquet")
    return silver


def _tables(out: Path):
    return {
        n: pq.read_table(out / f"{n}.parquet").to_pylist()
        for n in ("official_agenda_items", "canonical_proposals",
                  "proposal_anchor_links")}


def test_agenda_item_id_stability():
    a = agenda_item_id("m:x", "1.a", 1)
    b = agenda_item_id("m:x", "1.a", 1)
    c = agenda_item_id("m:x", "1.a", 2)
    assert a == b and a != c
    # a title wording fix never changes the ID — title is not an input
    assert agenda_item_id("m:x", "1.a", 1) == a


def test_canonical_id_deterministic():
    cp = canonical_id_official("ai:x")
    assert cp == canonical_id_official("ai:x")
    assert cp != canonical_id_consensus("ai:x")


def test_build_inditex_structure(tmp_path):
    silver = _mini_silver(tmp_path)
    stats = build(silver, tmp_path / "canonical")
    t = _tables(tmp_path / "canonical")

    # 11 agenda items materialized (1.a..9 + info 10)
    assert len(t["official_agenda_items"]) == 11
    assert stats.meetings_with_agenda == 1

    cps = {r["canonical_number"]: r for r in t["canonical_proposals"]
           if r["identity_basis"] == "OFFICIAL_AGENDA"}
    # 10 votable + 1 info-only linked = 11 official canonicals
    assert len(cps) == 11
    assert cps["10"]["votable_status"] == "INFORMATION_ONLY"
    # every official canonical carries the official item fk
    assert all(r["official_agenda_item_id"] for r in cps.values())

    links = {r["legacy_proposal_id"]: r for r in t["proposal_anchor_links"]
             if r["relation_type"] != "BUNDLES"}
    bund = [r for r in t["proposal_anchor_links"]
            if r["relation_type"] == "BUNDLES"]
    assert links["p:same8"]["relation_type"] == "SAME"
    assert links["p:same8"]["canonical_proposal_id"] == \
        cps["8"]["canonical_proposal_id"]
    assert {r["agenda_item_id"] for r in bund
            if r["legacy_proposal_id"] == "p:bundled"} == {
        cps["1.a"]["official_agenda_item_id"],
        cps["2"]["official_agenda_item_id"]}
    assert links["p:noise"]["relation_type"] == "NOISE"
    assert links["p:info10"]["relation_type"] == "SAME"
    # unresolved canonical exists for noise — votes preserved
    noise_cp = links["p:noise"]["canonical_proposal_id"]
    assert noise_cp in {r["canonical_proposal_id"]
                        for r in t["canonical_proposals"]
                        if r["identity_basis"] == "UNRESOLVED"}


def test_uncovered_meeting_consensus(tmp_path):
    silver = tmp_path / "silver"
    silver.mkdir()
    meetings = pa.table({
        "meeting_id": ["m:other"], "issuer_id": ["i:x"],
        "meeting_date": ["2020-01-01"], "meeting_type": ["AGM"],
        "source_meeting_ids": [["x"]], "season": [2020]})
    instruments = pa.table({
        "issuer_id": ["i:x"], "isin": ["ES0000000000"],
        "figi": [None], "valid_from": ["1900"], "valid_to": [None]})
    proposals = pa.table({
        "proposal_id": ["p:o1"], "meeting_id": ["m:other"],
        "proposal_number": ["1"], "proposal_title_normalized": ["t"],
        "sponsor_type": ["MANAGEMENT"]})
    inst = pa.table({
        "proposal_id": ["p:o1"], "source_id": ["sec_npx"],
        "text_raw": ["Approve Something"], "text_normalized": [""],
        "instance_key": ["k"]})
    votes = pa.table({
        "vote_id": ["v:1"], "proposal_id": ["p:o1"],
        "source_id": ["sec_npx"], "reporter_id": ["r:x"],
        "reporting_unit_id": ["u:x"], "direction": ["FOR"],
        "source_observation_id": ["o:1"]})
    observations = pa.table({
        "observation_id": ["o:1"], "accession": ["acc1"],
        "source_document": ["d"], "source_id": ["sec_npx"]})
    units = pa.table({"unit_id": ["u:x"], "source_identifier": ["s1"]})
    for n, tb in [("meetings", meetings), ("instruments", instruments),
                  ("proposals", proposals), ("proposal_instances", inst),
                  ("votes", votes), ("observations", observations),
                  ("reporting_units", units)]:
        pq.write_table(tb, silver / f"{n}.parquet")
    build(silver, tmp_path / "canonical")
    t = _tables(tmp_path / "canonical")
    cp = t["canonical_proposals"][0]
    assert cp["identity_basis"] == "SOURCE_CONSENSUS"
    assert cp["official_agenda_item_id"] is None
    link = t["proposal_anchor_links"][0]
    assert link["relation_type"] == "SAME"
    assert link["match_method"] == "SOURCE_CONSENSUS"


@pytest.mark.skipif(
    not (CANONICAL / "proposal_anchor_links.parquet").exists(),
    reason="canonical build artifacts not present")
class TestCorpusRegression:
    def test_inditex_2025(self):
        import duckdb
        con = duckdb.connect()
        mid = "m:f323298db8ef8a4a26ba"
        c = con.execute(f"""SELECT identity_basis, votable_status, count(*)
            FROM '{CANONICAL.as_posix()}/canonical_proposals.parquet'
            WHERE meeting_id=? GROUP BY ALL""", [mid]).fetchall()
        got = {(r[0], r[1]): r[2] for r in c}
        assert got.get(("OFFICIAL_AGENDA", "VOTABLE")) == 10
        assert got.get(("OFFICIAL_AGENDA", "INFORMATION_ONLY")) == 1
        assert got.get(("UNRESOLVED", "VOTABLE"), 0) >= 1

    def test_relations_present(self):
        import duckdb
        con = duckdb.connect()
        rels = {r[0] for r in con.execute(
            f"SELECT DISTINCT relation_type FROM "
            f"'{CANONICAL.as_posix()}/proposal_anchor_links.parquet'"
            ).fetchall()}
        assert {"SAME", "BUNDLES", "AMBIGUOUS", "UNMATCHED",
                "NOISE"} <= rels

    def test_no_duplicate_canonical_ids(self):
        import duckdb
        con = duckdb.connect()
        d = con.execute(f"""SELECT canonical_proposal_id, count(*)
            FROM '{CANONICAL.as_posix()}/canonical_proposals.parquet'
            GROUP BY 1 HAVING count(*)>1""").fetchall()
        assert d == []
