"""G10 canonical-proposal build — bridge legacy proposals to v2 identity.

Additive by construction: reads silver parquets + the curated agenda
corpus, writes three canonical artifacts — never touches `votes`,
`proposals` or any v0.1 identifier.

Outputs (parquet, deterministic):
    data/canonical/official_agenda_items.parquet
    data/canonical/canonical_proposals.parquet
    data/canonical/proposal_anchor_links.parquet
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq

from votes_es.canonical.model import (
    OFFICIAL_AGENDA_ITEMS, CANONICAL_PROPOSALS, PROPOSAL_ANCHOR_LINKS,
    agenda_item_id, canonical_id_consensus, canonical_id_official,
    canonical_id_unresolved)
from votes_es.reconcile.anchor import (
    ANCHOR_VERSION, AgendaItem, SourceRow, anchor_meeting, load_agendas)
from votes_es.reconcile.normalize import normalize_for_match

CANONICAL_DIR = Path("data/canonical")
AUTO_METHODS = {"EXACT_OFFICIAL_ITEM", "EXACT_OFFICIAL_TEXT",
                "RULE_HIGH_CONFIDENCE"}


@dataclass
class CanonStats:
    meetings_with_agenda: int = 0
    agenda_items: int = 0
    canonical_proposals: int = 0
    official: int = 0
    consensus: int = 0
    unresolved: int = 0
    links: dict = field(default_factory=dict)


def _isin_map(con: duckdb.DuckDBPyConnection) -> dict[str, str]:
    """(meeting issuer_id, meeting_date) -> isin via instruments."""
    out: dict[str, str] = {}
    for iid, isin, vf, vt in con.execute("""
            SELECT issuer_id, isin, valid_from, valid_to
            FROM instruments""").fetchall():
        out.setdefault(iid, []).append((isin, vf or "", vt or ""))
    return out


def _meetings(con) -> dict[str, tuple[str, str, str]]:
    """meeting_id -> (issuer_id, date, isin|None)."""
    imap = _isin_map(con)
    out = {}
    for mid, iid, d in con.execute(
            "SELECT meeting_id, issuer_id, meeting_date FROM meetings"
            ).fetchall():
        isin = None
        for cand, vf, vt in imap.get(iid, []):
            ds = str(d)
            if vf <= ds and (not vt or vt >= ds):
                isin = cand
                break
        out[mid] = (iid, str(d), isin)
    return out


def build(silver_dir: Path,
          out_dir: Path = CANONICAL_DIR) -> CanonStats:
    agendas = load_agendas()
    con = duckdb.connect()

    slv = str(silver_dir).replace("\\", "/")
    con.execute(f"""
        CREATE TABLE proposals AS
        SELECT * FROM '{slv}/proposals.parquet';
        CREATE TABLE proposal_instances AS
        SELECT * FROM '{slv}/proposal_instances.parquet';
        CREATE TABLE meetings AS
        SELECT * FROM '{slv}/meetings.parquet';
        CREATE TABLE instruments AS
        SELECT * FROM '{slv}/instruments.parquet';
        CREATE TABLE votes AS
        SELECT proposal_id, vote_id, source_id, source_observation_id,
               reporting_unit_id
        FROM '{slv}/votes.parquet';
        CREATE TABLE observations AS
        SELECT observation_id, accession, source_document, source_id
        FROM '{slv}/observations.parquet';
        CREATE TABLE reporting_units AS
        SELECT unit_id, source_identifier
        FROM '{slv}/reporting_units.parquet';""")

    meets = _meetings(con)
    stats = CanonStats()

    ai_rows: list[dict] = []
    cp_rows: list[dict] = []
    lk_rows: list[dict] = []

    prop_meta = {
        r[0]: (r[1], r[2], r[3], r[4])
        for r in con.execute(
            "SELECT proposal_id, meeting_id, proposal_number, sponsor_type,"
            " proposal_title_normalized"
            " FROM proposals").fetchall()}
    inst = con.execute("""
        SELECT proposal_id, source_id, text_raw
        FROM proposal_instances ORDER BY proposal_id""").fetchall()
    inst_by_prop: dict[str, list[tuple[str, str]]] = {}
    for pid, sid, text in inst:
        inst_by_prop.setdefault(pid, []).append((sid, text or ""))
    props_by_meeting: dict[str, list[str]] = {}
    for pid, meta in prop_meta.items():
        props_by_meeting.setdefault(meta[0], []).append(pid)

    for mid, (_iid, mdate, isin) in sorted(meets.items(),
                                        key=lambda kv: kv[0]):
        agenda = agendas.get((isin, mdate)) if isin else None
        ai_by_num: dict[str, str] = {}
        if agenda:
            stats.meetings_with_agenda += 1
            stats.agenda_items += len(agenda)
            for a in agenda:
                aid = agenda_item_id(mid, a.item_number, a.order)
                ai_by_num[a.item_number] = aid
                ai_rows.append({
                    "agenda_item_id": aid, "meeting_id": mid,
                    "item_number": a.item_number,
                    "parent_item_number": a.parent,
                    "item_order": a.order,
                    "title_raw": a.title_es or a.title_en,
                    "title_normalized": normalize_for_match(
                        a.title_es or a.title_en),
                    "concept_id": a.concept_id,
                    "votable_status": a.votable_status,
                    "source_type": _source_type(a.source_url),
                    "source_url": a.source_url,
                    "source_document": a.source_ref,
                    "source_locator": None, "source_sha256": None,
                    "published_at": None, "retrieved_at": a.retrieved_at})
                if a.votable_status == "VOTABLE":
                    _add_official(cp_rows, mid, a, aid)

        prop_ids = sorted(props_by_meeting.get(mid, []))
        if not agenda:
            # uncovered meeting — silver cluster stays the identity,
            # clearly labelled consensus, never 'official'
            for pid in prop_ids:
                cpid = canonical_id_consensus(pid)
                _add_consensus(cp_rows, pid, mid, prop_meta[pid])
                lk_rows.append(_link(pid, cpid, None, "SAME",
                                     "SOURCE_CONSENSUS", 0.0, 0.0,
                                     "REVIEWED",
                                     "no official agenda in corpus",
                                     "consensus-1.0"))
            continue

        # anchor every covered-meeting wording/instance
        anchor_map, wording_map = _anchor_meeting_sources(
            mid, prop_ids, prop_meta, inst_by_prop, agenda)
        linked_items: set[str] = set()

        # vote-level attribution for bundled clusters: the vote's own
        # filing wording identifies the item — evidence, not fan-out.
        # Attribution only fires when every candidate ballot row for
        # this (filing, unit, meeting) points to ONE official item.
        bundled = [p for p in prop_ids
                   if len(anchor_map[p]["targets"]) > 1]
        obs_text = _observation_texts(con, bundled, Path("data/bronze"),
                                      isin) if bundled else {}

        for pid in prop_ids:
            m = anchor_map[pid]
            targets = m["targets"]
            if len(targets) == 1:
                item = next(iter(targets))
                aid = ai_by_num[item]
                linked_items.add(aid)
                a = next(x for x in agenda if x.item_number == item)
                cpid = canonical_id_official(aid)
                if not any(r["canonical_proposal_id"] == cpid
                           for r in cp_rows):
                    _add_official(cp_rows, mid, a, aid)
                lk_rows.append(_link(
                    pid, cpid, aid, "SAME", m["method"], m["score"],
                    m["margin"], m["status"], m["evidence"],
                    ANCHOR_VERSION))
            elif len(targets) > 1:
                for item in sorted(targets):
                    aid = ai_by_num[item]
                    linked_items.add(aid)
                    a = next(x for x in agenda if x.item_number == item)
                    cpid = canonical_id_official(aid)
                    if not any(r["canonical_proposal_id"] == cpid
                               for r in cp_rows):
                        _add_official(cp_rows, mid, a, aid)
                    lk_rows.append(_link(
                        pid, cpid, aid, "BUNDLES", m["method"], m["score"],
                        m["margin"], "REVIEWED",
                        f"source row bundles {','.join(sorted(targets))}; "
                        f"{m['evidence']}", ANCHOR_VERSION))
                # each vote's own wording identifies its item when the
                # anchor is unique — bundle-level votes that can't be
                # attributed stay on the BUNDLES links only
                # this cluster's own wording set — the vote's ballot row
                # must be one of these texts
                cluster_words = {normalize_for_match(t)
                                 for _s, t in inst_by_prop.get(pid, [])}
                cluster_words.discard("")
                vrows = con.execute(
                    "SELECT v.vote_id, v.source_observation_id,"
                    " u.source_identifier FROM votes v"
                    " JOIN reporting_units u"
                    "   ON u.unit_id = v.reporting_unit_id"
                    " WHERE v.proposal_id=?", [pid]).fetchall()
                for vid, oid, series in vrows:
                    ballots = {normalize_for_match(t)
                               for t in obs_text.get(
                                   (oid, series or ""), set())}
                    hits = ballots & cluster_words
                    if len(hits) != 1:
                        continue
                    wm = wording_map.get(next(iter(hits)))
                    if wm and wm.method in AUTO_METHODS \
                            and wm.proposal_id:
                        item2 = wm.proposal_id
                        aid2 = ai_by_num[item2]
                        lk_rows.append(_link(
                            pid, canonical_id_official(aid2), aid2,
                            "SAME", "VOTE_ATTRIBUTED", 1.0, 0.0,
                            "HIGH_CONFIDENCE",
                            f"vote-attributed to {item2} via own filing "
                            f"wording", ANCHOR_VERSION,
                            vote_id=vid))
            else:
                rel = m["relation"]
                cpid = canonical_id_unresolved(pid)
                _add_unresolved(cp_rows, pid, mid, prop_meta[pid], rel)
                lk_rows.append(_link(
                    pid, cpid, None, rel, m["method"], m["score"],
                    m["margin"], m["status"], m["evidence"],
                    ANCHOR_VERSION))
        # information-only items that received anchored proposals get a
        # canonical proposal too — filers reported votes on them
        seen_cp = {r["canonical_proposal_id"] for r in cp_rows}
        for a in agenda:
            aid = ai_by_num[a.item_number]
            cpid = canonical_id_official(aid)
            if a.votable_status != "VOTABLE" and aid in linked_items \
                    and cpid not in seen_cp:
                _add_official(cp_rows, mid, a, aid)

        from collections import Counter
        stats.links = dict(Counter(r["relation_type"] for r in lk_rows))

    stats.canonical_proposals = len(cp_rows)
    stats.official = sum(1 for r in cp_rows
                         if r["identity_basis"] == "OFFICIAL_AGENDA")
    stats.consensus = sum(1 for r in cp_rows
                          if r["identity_basis"] == "SOURCE_CONSENSUS")
    stats.unresolved = sum(1 for r in cp_rows
                           if r["identity_basis"] == "UNRESOLVED")

    out_dir.mkdir(parents=True, exist_ok=True)
    pq.write_table(
        pa.Table.from_pylist(ai_rows, schema=OFFICIAL_AGENDA_ITEMS),
        out_dir / "official_agenda_items.parquet")
    pq.write_table(
        pa.Table.from_pylist(cp_rows, schema=CANONICAL_PROPOSALS),
        out_dir / "canonical_proposals.parquet")
    pq.write_table(
        pa.Table.from_pylist(lk_rows, schema=PROPOSAL_ANCHOR_LINKS),
        out_dir / "proposal_anchor_links.parquet")
    con.close()
    return stats


def _source_type(url: str) -> str:
    if "boe.es" in url:
        return "BORME"
    if "cnmv" in url:
        return "CNMV"
    return "ISSUER"


def _link(pid, cpid, aid, rel, method, score, margin, status, ev, ver,
          vote_id=None):
    return {"legacy_proposal_id": pid, "canonical_proposal_id": cpid,
            "agenda_item_id": aid, "vote_id": vote_id,
            "relation_type": rel,
            "match_method": method, "score": score, "margin": margin,
            "review_status": status, "evidence": ev,
            "matcher_version": ver}


def _add_official(rows, mid, a: AgendaItem, aid: str) -> None:
    rows.append({
        "canonical_proposal_id": canonical_id_official(aid),
        "meeting_id": mid, "official_agenda_item_id": aid,
        "canonical_number": a.item_number,
        "canonical_title": a.title_es or a.title_en,
        "sponsor_type": "MANAGEMENT",
        "votable_status": a.votable_status,
        "identity_basis": "OFFICIAL_AGENDA",
        "identity_confidence": "HIGH"})


def _add_consensus(rows, pid, mid, meta) -> None:
    _mid, num, sponsor, title = meta
    rows.append({
        "canonical_proposal_id": canonical_id_consensus(pid),
        "meeting_id": mid, "official_agenda_item_id": None,
        "canonical_number": num, "canonical_title": title,
        "sponsor_type": sponsor, "votable_status": "VOTABLE",
        "identity_basis": "SOURCE_CONSENSUS",
        "identity_confidence": "MEDIUM"})


def _add_unresolved(rows, pid, mid, meta, rel) -> None:
    _mid, num, sponsor, title = meta
    rows.append({
        "canonical_proposal_id": canonical_id_unresolved(pid),
        "meeting_id": mid, "official_agenda_item_id": None,
        "canonical_number": num, "canonical_title": title,
        "sponsor_type": sponsor, "votable_status": "VOTABLE",
        "identity_basis": "UNRESOLVED",
        "identity_confidence": "LOW"})


def _observation_texts(con, proposal_ids, bronze_dir: Path,
                       isin: str
                       ) -> dict[tuple[str, str], set[str]]:
    """(observation_id, reporting-unit source id) -> {proposal texts}.

    N-PX observations are filing-level: the same observation carries
    every ballot row of every fund of every meeting. A vote's own
    ballot row is identified by (observation_id, vote_series = unit
    source id, issuer isin). Returns the *set* of distinct texts so the
    caller can verify the attribution is unambiguous.
    """
    rows = con.execute("""
        SELECT v.source_observation_id, o.accession, v.source_id,
               u.source_identifier
        FROM votes v JOIN observations o
          ON o.observation_id = v.source_observation_id
        JOIN reporting_units u ON u.unit_id = v.reporting_unit_id
        WHERE v.proposal_id = ANY(?)""", [list(proposal_ids)]).fetchall()
    out: dict[tuple[str, str], set[str]] = {}
    by_acc: dict[tuple[str, str], list[tuple[str, str]]] = {}
    for oid, acc, sid, series in rows:
        by_acc.setdefault((sid, acc or ""), []).append((oid, series))
    for (sid, acc), pairs in by_acc.items():
        if sid == "sec_npx":
            f = bronze_dir / sid / f"{acc.replace('-', '')}.parquet"
            files = [f] if f.exists() else []
        else:
            files = sorted((bronze_dir / sid).glob("*.parquet"))
        for f in files:
            cols = {r[0] for r in con.execute(
                f"DESCRIBE SELECT * FROM '{f.as_posix()}'").fetchall()}
            series_col = "vote_series" if "vote_series" in cols else None
            isin_w = "AND isin = ?" if "isin" in cols and isin else ""
            sel = (f"observation_id, {series_col}, proposal_text_raw"
                   if series_col else "observation_id, NULL, proposal_text_raw")
            params = [isin] if isin_w else []
            for oid, series, text in con.execute(
                    f"SELECT {sel} FROM '{f.as_posix()}' WHERE 1=1 "
                    f"{isin_w}", params).fetchall():
                if series_col and (oid, series or "") not in pairs:
                    continue
                if not series_col and \
                        oid not in {p[0] for p in pairs}:
                    continue
                out.setdefault((oid, series or ""), set()).add(text or "")
    return out


def _anchor_meeting_sources(mid, prop_ids, prop_meta, inst_by_prop, agenda):
    """Per-proposal anchor rollup.

    MAPFRE register lines anchor itemized (one_to_one=True, using the
    proposal's printed item number); every other source's distinct
    wordings anchor freely (one_to_one=False — they are observations).
    """
    # itemized rows — one per proposal_instances row of itemized sources
    mrows, mkeys = [], []
    for pid in prop_ids:
        _mid, num, _sp, _ttl = prop_meta[pid]
        for i, (sid, text) in enumerate(inst_by_prop.get(pid, [])):
            if sid != "mapfre_am":
                continue
            k = f"{pid}#{i}"
            mrows.append(SourceRow(key=k, raw=text, item=num,
                                   proponent=None))
            mkeys.append((k, pid))
    res_m = anchor_meeting(mrows, agenda, one_to_one=True) if mrows else []
    inst_anchor = {m.source_key: m for m in res_m}

    # wording rows — distinct normalized text per proposal (all sources)
    wrows, wkeys = [], []
    for pid in prop_ids:
        _mid, num, _sp, _ttl = prop_meta[pid]
        seen = set()
        for sid, text in inst_by_prop.get(pid, []):
            if sid == "mapfre_am":
                continue
            nk = normalize_for_match(text)
            if not nk or nk in seen:
                continue
            seen.add(nk)
            k = f"{pid}@{nk[:60]}"
            wrows.append(SourceRow(key=k, raw=text, item=num,
                                   proponent=None))
            wkeys.append((k, pid))
    res_w = anchor_meeting(wrows, agenda, one_to_one=False) if wrows else []
    inst_anchor.update({m.source_key: m for m in res_w})

    # normalized source wording -> anchor result (for vote-level
    # attribution inside bundled clusters)
    wording_map = {}
    for r, m in zip(mrows, res_m, strict=False):
        nk = normalize_for_match(r.raw)
        if nk not in wording_map or m.score > wording_map[nk].score:
            wording_map[nk] = m
    for r, m in zip(wrows, res_w, strict=False):
        nk = normalize_for_match(r.raw)
        if nk not in wording_map or m.score > wording_map[nk].score:
            wording_map[nk] = m

    out: dict[str, dict] = {}
    for pid in prop_ids:
        keys = [k for k, p in mkeys if p == pid] + \
               [k for k, p in wkeys if p == pid]
        hits, methods = set(), []
        best = (-1.0, "", 0.0, "")
        has_amb = n_noise = n_seen = 0
        for k in keys:
            m = inst_anchor.get(k)
            if m is None:
                continue
            n_seen += 1
            methods.append(m.method)
            if m.method in AUTO_METHODS and m.proposal_id:
                hits.add(m.proposal_id)
            elif m.method == "AMBIGUOUS":
                has_amb = True
            elif "noise" in (m.evidence or ""):
                n_noise += 1
            if m.score > best[0]:
                best = (m.score, m.method, m.margin or 0.0,
                        m.evidence or "")
        if hits:
            rel = "SAME" if len(hits) == 1 else "BUNDLES"
        elif has_amb:
            rel = "AMBIGUOUS"
        elif n_seen and n_noise == n_seen:
            rel = "NOISE"
        else:
            rel = "UNMATCHED"
        out[pid] = {
            "targets": hits, "relation": rel,
            "method": best[1] or (methods[0] if methods else "NO_SOURCE"),
            "score": round(best[0], 4) if best[0] >= 0 else 0.0,
            "margin": round(best[2], 4) if best[0] >= 0 else 0.0,
            "status": "EXACT" if best[1].startswith("EXACT") else
                      ("HIGH_CONFIDENCE" if best[1] else "UNRESOLVED"),
            "evidence": ";".join(sorted(set(methods))) or
                        "no covered-source instance",
        }
    return out, wording_map
