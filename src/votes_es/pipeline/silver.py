"""Silver builder: bronze → canonical tables.

Deterministic rebuild: same bronze + same universe + same adapter version →
same silver. Proposal clustering is per-meeting and order-stable.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

from votes_es import ADAPTER_VERSION, ids
from votes_es.domain.enums import (
    MatchMethod,
    MeetingType,
    ReportType,
    ReviewStatus,
    SponsorType,
    VoteDirection,
)
from votes_es.identity.resolver import IdentityResolver, Resolution
from votes_es.normalization.categories import classify_title, normalize_sec_category
from votes_es.normalization.text import (
    normalize_proposal_text,
    parse_number,
    parse_npx_date,
    token_jaccard,
)
from votes_es.normalization.votes import (
    compute_against_management,
    normalize_direction,
    normalize_mgmt_rec,
)
from votes_es.sources.registry import NPX_PARENT_GROUPS, REPORTERS, SOURCES
from votes_es.storage import bronze as bronze_io
from votes_es.storage.schemas import (
    BRONZE_NPX,
    BRONZE_VDS,
    SILVER_SCHEMAS,
)

MERGE_JACCARD = 0.60        # deterministic proposal-merge threshold
HIGH_CONF_JACCARD = 0.80


@dataclass
class BuildStats:
    issuers: int = 0
    meetings: int = 0
    proposals: int = 0
    votes: int = 0
    resolved_isin: int = 0
    resolved_cusip: int = 0
    resolved_oi: int = 0
    unresolved: int = 0
    ambiguous: int = 0
    out_of_universe: int = 0   # resolved-but-not-ES-universe rows, dropped
    warnings: list[str] = field(default_factory=list)


# ------------------------------------------------------------------ helpers


def _meeting_type(raw: str | None) -> MeetingType:
    t = (raw or "").strip().upper()
    if "ANNUAL/SPECIAL" in t or "ANNUAL SPECIAL" in t:
        return MeetingType.ANNUAL_SPECIAL
    if t.startswith("ANNUAL"):
        return MeetingType.ANNUAL
    if "EXTRAORDINARY" in t:
        return MeetingType.EXTRAORDINARY
    if t.startswith("SPECIAL"):
        return MeetingType.SPECIAL
    return MeetingType.UNKNOWN if not t else MeetingType.OTHER


# ------------------------------------------------------------ proposal merge


@dataclass
class _Inst:
    source_id: str
    text_raw: str
    text_norm: str
    ballot: str | None
    categories: list[str]
    shareholder: bool | None


def _ballot_conflict(a: _Inst, b: _Inst) -> bool:
    """Both have explicit ballot/item numbers and they differ -> the source is
    telling us these are distinct proposals (e.g. Iberdrola's two 'Approve
    Scrip Dividends' items)."""
    return bool(a.ballot and b.ballot
                and a.ballot.strip() != b.ballot.strip())


def cluster_proposals(instances: list[_Inst]) -> list[list[_Inst]]:
    """Greedy deterministic clustering inside ONE meeting.

    1. same non-empty ballot number merges (EXACT_PROPOSAL_NUMBER)
    2. identical normalized text merges — unless ballot numbers conflict
       (EXACT_NORMALIZED_TEXT)
    3. token-Jaccard >= 0.60 merges unless ballots conflict (RULE_BASED)
    Order-stable: instances sorted before clustering.
    """
    insts = sorted(instances, key=lambda i: (i.text_norm, i.source_id,
                                             i.ballot or ""))
    clusters: list[list[_Inst]] = []
    for inst in insts:
        placed = False
        for cl in clusters:
            rep = cl[0]
            same_ballot = (inst.ballot and rep.ballot
                           and inst.ballot.strip() == rep.ballot.strip())
            if same_ballot:
                cl.append(inst)
                placed = True
                break
            if _ballot_conflict(inst, rep):
                continue
            if inst.text_norm == rep.text_norm:
                cl.append(inst)
                placed = True
                break
            score = token_jaccard(inst.text_norm, rep.text_norm)
            if score >= MERGE_JACCARD:
                inst._fuzzy = score  # type: ignore[attr-defined]
                cl.append(inst)
                placed = True
                break
        if not placed:
            clusters.append([inst])
    return clusters


def _cluster_method(rep: _Inst, inst: _Inst, fuzzy: float | None,
                    ) -> tuple[MatchMethod, float, ReviewStatus]:
    if inst.ballot and rep.ballot and inst.ballot.strip() == rep.ballot.strip():
        return MatchMethod.EXACT_PROPOSAL_NUMBER, 1.0, ReviewStatus.EXACT
    if inst.text_norm == rep.text_norm:
        return MatchMethod.EXACT_NORMALIZED_TEXT, 1.0, ReviewStatus.EXACT
    score = fuzzy or token_jaccard(inst.text_norm, rep.text_norm)
    return MatchMethod.RULE_BASED, score, (
        ReviewStatus.HIGH_CONFIDENCE if score >= HIGH_CONF_JACCARD
        else ReviewStatus.AMBIGUOUS)


# --------------------------------------------------------------- the builder


def _log(msg: str) -> None:
    import time
    print(f"[silver {time.strftime('%H:%M:%S')}] {msg}", flush=True)


def build_silver(universe_path: Path, out_dir: Path,
                 use_oi: bool = True) -> BuildStats:
    stats = BuildStats()
    _log("init resolver")
    resolver = IdentityResolver.from_universe(universe_path, use_oi=use_oi)

    universe = pq.read_table(universe_path).to_pylist()
    issuers: dict[str, dict] = {}
    instruments: dict[str, dict] = {}
    aliases: set[tuple] = set()
    for r in universe:
        issuers[r["issuer_id"]] = {
            "issuer_id": r["issuer_id"], "canonical_name": r["canonical_name"],
            "country": r["country"], "lei": r["lei"], "cnmv_id": None,
            "in_universe": True, "universe_basis": r["universe_basis"],
        }
        instruments[r["isin"]] = {
            "instrument_id": r["isin"], "issuer_id": r["issuer_id"],
            "isin": r["isin"], "cusip": None, "figi": None,
            "ticker": r["ticker"], "instrument_type": "EQUITY",
            "valid_from": None, "valid_to": None,
        }
        aliases.add((r["issuer_id"], r["canonical_name"], "LEGAL_NAME", "universe"))
        aliases.add((r["issuer_id"], r["alias_normalized"], "NORMALIZED_NAME",
                     "universe"))

    reporters: dict[str, dict] = {}
    units: dict[str, dict] = {}
    inst_by_meeting: dict[str, list[_Inst]] = {}
    vote_rows: list[dict] = []
    meet_type_votes: dict[tuple, list[MeetingType]] = {}
    meet_source_ids: dict[tuple, set] = {}
    meet_date: dict[tuple, date] = {}

    def _issuer_key(res: Resolution, fallback: str,
                    isin: str | None = None) -> str | None:
        """Canonical issuer key; None -> row out of scope (counted, not kept).

        - universe/OI-resolved -> issuer_id (issuer row created if OI-added)
        - AMBIGUOUS name suspect -> unr: pseudo-issuer (QA-visible)
        - UNRESOLVED -> None (dropped from silver, counted)
        """
        if res.issuer_id:
            if res.issuer_id not in issuers:
                lei = res.issuer_id[4:] if res.issuer_id.startswith("lei:") else None
                issuers[res.issuer_id] = {
                    "issuer_id": res.issuer_id,
                    "canonical_name": res.issuer_name or fallback,
                    "country": None, "lei": lei, "cnmv_id": None,
                    "in_universe": True, "universe_basis": "OI_XMAD",
                }
                if isin and isin not in instruments:
                    instruments[isin] = {
                        "instrument_id": isin, "issuer_id": res.issuer_id,
                        "isin": isin, "cusip": None, "figi": None,
                        "ticker": None, "instrument_type": "EQUITY",
                        "valid_from": None, "valid_to": None,
                    }
            return res.issuer_id
        if res.review_status == ReviewStatus.AMBIGUOUS:
            iid = f"unr:{ids._h(fallback)}"
            if iid not in issuers:
                issuers[iid] = {
                    "issuer_id": iid,
                    "canonical_name": res.issuer_name or fallback,
                    "country": None, "lei": None, "cnmv_id": None,
                    "in_universe": False, "universe_basis": "NAME_SUSPECT",
                }
            return iid
        stats.out_of_universe += 1
        return None

    def _meeting(res: Resolution, name_fb: str, mdate: date | None,
                 mtype: MeetingType, src_meeting_id: str | None,
                 isin: str | None = None) -> tuple | None:
        if mdate is None:
            stats.warnings.append(f"row without parseable meeting date ({name_fb})")
            return None
        iid = _issuer_key(res, name_fb, isin)
        if iid is None:
            return None
        key = (iid, mdate)
        meet_date[key] = mdate
        meet_type_votes.setdefault(key, []).append(mtype)
        if src_meeting_id:
            meet_source_ids.setdefault(key, set()).add(src_meeting_id)
        return key

    # ------------------------------------------------------------- N-PX lane
    npx_bronze = bronze_io.load_bronze("sec_npx", BRONZE_NPX)
    vds_bronze_tables = {
        d.name: bronze_io.load_bronze(d.name, BRONZE_VDS)
        for d in bronze_io.BRONZE_DIR.glob("iss_vds*") if d.is_dir()
    }
    # bulk-warm the identity resolver (a few OI queries total)
    warm_isins = set(npx_bronze.column("isin").drop_null().unique().to_pylist())
    warm_cusips = set(npx_bronze.column("cusip").drop_null().unique().to_pylist())
    for vt in vds_bronze_tables.values():
        warm_isins.update(vt.column("isin").drop_null().unique().to_pylist())
        warm_cusips.update(vt.column("cusip").drop_null().unique().to_pylist())
    resolver.warm(sorted(warm_isins), sorted(warm_cusips))
    _log(f"warmed resolver: {len(warm_isins)} isins {len(warm_cusips)} cusips")

    for row in npx_bronze.to_pylist():
        stats.votes += 1
        res = resolver.resolve(row["isin"], row["cusip"], row["issuer_name_raw"])
        _count_match(stats, res)
        mdate = parse_npx_date(row["meeting_date_raw"])
        key = _meeting(res, row["issuer_name_raw"] or row["isin"] or "?",
                       mdate, MeetingType.UNKNOWN, row["accession"],
                       isin=row["isin"])
        if key is None:
            continue
        meeting_id = ids.meeting_id(key[0], key[1].isoformat())

        # reporter + unit
        rkey = row["reporter_lei"] or f"cik:{row['cik']}" or row["reporter_name_raw"]
        rid = ids.reporter_id(rkey)
        if rid not in reporters:
            rname = (row["reporter_name_raw"] or "").strip()
            parent = next((v for k, v in NPX_PARENT_GROUPS.items()
                           if k in rname.upper()), None)
            reporters[rid] = {
                "reporter_id": rid, "canonical_name": rname or row["cik"],
                "country": "US", "reporter_type": (
                    "INSTITUTIONAL_MANAGER"
                    if row["report_type"] == ReportType.INSTITUTIONAL_MANAGER.value
                    else "REGISTERED_FUND"),
                "parent_group": parent, "lei": row["reporter_lei"],
                "source_identifiers_json": json.dumps({"cik": row["cik"]}),
            }
        unit_key = row["vote_series"] or f"cik:{row['cik']}"
        uid = ids.reporting_unit_id(rid, unit_key)
        units.setdefault(uid, {
            "unit_id": uid, "reporter_id": rid,
            "unit_type": "FUND_SERIES" if row["vote_series"] else "REPORTER_SELF",
            "source_identifier": unit_key,
            "canonical_name": row["vote_series"] or row["reporter_name_raw"] or row["cik"],
        })

        # proposal instance
        inst = _Inst(source_id="sec_npx", text_raw=row["proposal_text_raw"],
                     text_norm=normalize_proposal_text(row["proposal_text_raw"]),
                     ballot=None,
                     categories=[normalize_sec_category(c)
                                 for c in (row["categories_raw"] or "").split("|") if c],
                     shareholder=None)
        inst_by_meeting.setdefault(meeting_id, []).append(inst)

        vote_rows.append({
            "_meeting_id": meeting_id, "_inst": inst,
            "reporting_unit_id": uid, "reporter_id": rid,
            "vote_raw": row["how_voted_raw"] or "",
            "management_recommendation_raw": row["management_recommendation_raw"],
            "shares_voted": parse_number(row["shares_voted_raw"]),
            "shares_on_loan": parse_number(row["shares_on_loan_raw"]),
            "rationale": None,
            "source_observation_id": row["observation_id"],
            "source_id": "sec_npx",
            "report_type": row["report_type"],
            "_resolution": res,
        })

    # ------------------------------------------------------------- VDS lane
    for _dir, vt in vds_bronze_tables.items():
        for row in vt.to_pylist():
            stats.votes += 1
            src = SOURCES[f"iss_vds:{row['reporter_key']}"]
            res = resolver.resolve(row["isin"], row["cusip"], row["issuer_name_raw"])
            _count_match(stats, res)
            try:
                mdate = date.fromisoformat(row["meeting_date_raw"]) if row["meeting_date_raw"] else None
            except ValueError:
                mdate = None
            key = _meeting(res, row["issuer_name_raw"] or row["isin"] or "?",
                           mdate, _meeting_type(row["meeting_type_raw"]),
                           row["source_meeting_id"], isin=row["isin"])
            if key is None:
                continue
            meeting_id = ids.meeting_id(key[0], key[1].isoformat())

            rep = REPORTERS[src.reporter_key]
            rid = ids.reporter_id(src.reporter_key)
            reporters.setdefault(rid, {
                "reporter_id": rid, "canonical_name": rep.canonical_name,
                "country": rep.country, "reporter_type": rep.reporter_type.value,
                "parent_group": rep.parent_group, "lei": rep.lei,
                "source_identifiers_json": json.dumps(rep.source_identifiers),
            })
            unit_key = str(row["fund_id"]) if row["fund_id"] is not None else "self"
            uid = ids.reporting_unit_id(rid, unit_key)
            units.setdefault(uid, {
                "unit_id": uid, "reporter_id": rid,
                "unit_type": "FUND" if row["fund_id"] is not None else "REPORTER_SELF",
                "source_identifier": unit_key,
                "canonical_name": row["fund_name_raw"] or unit_key,
            })

            inst = _Inst(
                source_id=src.source_id, text_raw=row["proposal_text_raw"],
                text_norm=normalize_proposal_text(row["proposal_text_raw"]),
                ballot=(row["ballot_item_number"] or None),
                categories=[c for c in (row["categories_raw"] or "").split("|") if c],
                shareholder=row["shareholder_proposal"],
            )
            inst_by_meeting.setdefault(meeting_id, []).append(inst)

            vote_rows.append({
                "_meeting_id": meeting_id, "_inst": inst,
                "reporting_unit_id": uid, "reporter_id": rid,
                "vote_raw": row["how_voted_raw"],   # "" = observed no-vote
                "management_recommendation_raw": row["management_recommendation_raw"],
                "shares_voted": parse_number(row["shares_voted_raw"]),
                "shares_on_loan": parse_number(row["shares_on_loan_raw"]),
                "rationale": row["notes"] if row["notes"] not in (None, "", "NA") else None,
                "source_observation_id": row["observation_id"],
                "source_id": src.source_id,
                "report_type": None,
                "_resolution": res,
            })

    _log(f"bronze scanned: {stats.votes} rows")

    # -------------------------------------------- proposal canonicalization
    proposals: dict[str, dict] = {}
    prop_instances: list[dict] = []
    prop_categories: set[tuple] = set()
    for meeting_id, insts in inst_by_meeting.items():
        for cidx, cl in enumerate(cluster_proposals(insts)):
            rep = cl[0]
            numbers = [i.ballot.strip() for i in cl if i.ballot]
            number = numbers[0] if numbers else None
            # ballot number + cluster index disambiguate identical texts
            pid = ids.proposal_id(meeting_id, rep.text_norm,
                                  number or "", str(cidx))
            sponsor = _sponsor(cl)
            proposals[pid] = {
                "proposal_id": pid, "meeting_id": meeting_id,
                "proposal_number": number,
                "proposal_title_normalized": rep.text_norm or rep.text_raw,
                "sponsor_type": sponsor.value,
            }
            for inst in cl:
                inst._pid = pid  # type: ignore[attr-defined]
                fuzzy = getattr(inst, "_fuzzy", None)
                method, conf, review = _cluster_method(rep, inst, fuzzy)
                prop_instances.append({
                    "proposal_id": pid, "source_id": inst.source_id,
                    "text_raw": inst.text_raw, "match_method": method.value,
                    "match_confidence": conf, "review_status": review.value,
                    "categories_raw": "|".join(inst.categories),
                })
                for cat in inst.categories:
                    tax = "SEC" if inst.source_id == "sec_npx" else "VDS"
                    prop_categories.add((pid, tax, cat))
                prop_categories.add(
                    (pid, "VOTES_ES", classify_title(rep.text_raw).value))

    _log(f"proposals clustered: {len(proposals)}")

    # ---------------------------------------------------------------- votes
    votes_out: list[dict] = []
    for v in vote_rows:
        inst = v["_inst"]
        pid = getattr(inst, "_pid", None)
        if pid is None:
            stats.warnings.append("vote dropped: no proposal cluster")
            continue
        raw = v["vote_raw"]
        if v["source_id"].startswith("iss_vds") and raw == "":
            direction = VoteDirection.DO_NOT_VOTE   # VDS blank = fund did not vote
        else:
            direction = normalize_direction(raw)
        mgmt = normalize_mgmt_rec(v["management_recommendation_raw"])
        against = compute_against_management(direction, mgmt)
        res: Resolution = v["_resolution"]
        votes_out.append({
            # direction+raw+shares in the key: filers do emit the same
            # series x proposal row more than once (split ballots); exact
            # dupes collapse in the dedup pass below, real splits stay distinct.
            "vote_id": ids.vote_id(pid, v["reporting_unit_id"],
                                   v["source_observation_id"],
                                   direction.value, raw,
                                   str(v["shares_voted"] or "")),
            "proposal_id": pid,
            "reporting_unit_id": v["reporting_unit_id"],
            "reporter_id": v["reporter_id"],
            "direction": direction.value, "vote_raw": raw,
            "management_recommendation": mgmt.value if mgmt else None,
            "management_recommendation_raw": v["management_recommendation_raw"],
            "against_management": against,
            "shares_voted": v["shares_voted"], "shares_on_loan": v["shares_on_loan"],
            "rationale": v["rationale"],
            "source_observation_id": v["source_observation_id"],
            "source_id": v["source_id"], "report_type": v["report_type"],
            "match_method": res.match_method.value,
            "review_status": res.review_status.value,
            "match_evidence": res.evidence,
        })

    # dedup: same vote_id = identical row emitted twice by the source
    seen_v: set[str] = set()
    deduped: list[dict] = []
    dup_count = 0
    for v in votes_out:
        if v["vote_id"] in seen_v:
            dup_count += 1
            continue
        seen_v.add(v["vote_id"])
        deduped.append(v)
    if dup_count:
        stats.warnings.append(
            f"{dup_count} exact-duplicate source vote rows collapsed")
    votes_out = deduped

    meetings_out = []
    for key, mdate in meet_date.items():
        types = meet_type_votes.get(key, [])
        mtype = next((t for t in types if t != MeetingType.UNKNOWN),
                     MeetingType.UNKNOWN)
        meetings_out.append({
            "meeting_id": ids.meeting_id(key[0], mdate.isoformat()),
            "issuer_id": key[0], "meeting_date": mdate,
            "meeting_type": mtype.value,
            "source_meeting_ids": "|".join(sorted(meet_source_ids.get(key, set()))),
        })

    sources_out = [{
        "source_id": s.source_id, "source_type": s.source_type.value,
        "name": s.name, "base_url": s.base_url,
        "reuse_status": s.reuse_status.value,
        "terms_checked_at": "2026-10-06", "robots_checked_at": "2026-10-06",
        "adapter_version": ADAPTER_VERSION,
    } for s in SOURCES.values()]

    observations = bronze_io.load_observations()

    # disclosure seasons — observed reporter x season with the disclosure
    # profile documented in the source memos (SIGNIFICANT_ONLY etc.)
    seasons = _disclosure_seasons(votes_out, meetings_out, proposals)

    tables = {
        "sources": sources_out,
        "observations": observations,
        "disclosure_seasons": seasons,
        "reporters": list(reporters.values()),
        "reporting_units": list(units.values()),
        "issuers": list(issuers.values()),
        "instruments": list(instruments.values()),
        "issuer_aliases": [
            {"issuer_id": a, "alias": b, "alias_type": c, "source": d}
            for a, b, c, d in sorted(aliases)],
        "meetings": meetings_out,
        "proposals": list(proposals.values()),
        "proposal_instances": prop_instances,
        "proposal_categories": [
            {"proposal_id": p, "taxonomy": t, "category": c}
            for p, t, c in sorted(prop_categories)],
        "votes": votes_out,
    }

    _log(f"writing {len(votes_out)} votes")
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, schema in SILVER_SCHEMAS.items():
        rows = tables.get(name, [])
        t = pa.Table.from_pylist(rows, schema=schema) if rows else schema.empty_table()
        pq.write_table(t, out_dir / f"{name}.parquet", compression="zstd")

    stats.issuers = len(issuers)
    stats.meetings = len(meetings_out)
    stats.proposals = len(proposals)
    stats.votes = len(votes_out)
    resolver.close()
    return stats


def _count_match(stats: BuildStats, res: Resolution) -> None:
    if res.match_method == MatchMethod.EXACT_ISIN:
        stats.resolved_isin += 1
        if res.review_status == ReviewStatus.HIGH_CONFIDENCE:
            stats.resolved_oi += 1
    elif res.match_method == MatchMethod.EXACT_CUSIP:
        stats.resolved_cusip += 1
    elif res.review_status == ReviewStatus.AMBIGUOUS:
        stats.ambiguous += 1
    else:
        stats.unresolved += 1


def _disclosure_seasons(votes_out: list[dict], meetings_out: list[dict],
                        proposals: dict[str, dict]) -> list[dict]:
    """One row per reporter x season (meeting year) observed, carrying the
    disclosure profile documented in the source memos. Significance metadata
    comes from the managers' published policies, never inferred from data."""
    from votes_es.domain.enums import DisclosureLevel
    meeting_year = {m["meeting_id"]: m["meeting_date"].year
                    for m in meetings_out}
    proposal_year = {pid: meeting_year.get(p["meeting_id"])
                     for pid, p in proposals.items()}
    profile = {
        "caixabank-am": {"level": DisclosureLevel.ITEMIZED, "doc": False,
                         "text": None, "url": None},
        "bbva-am": {"level": DisclosureLevel.SIGNIFICANT_ONLY, "doc": True,
                    "text": ("Votes when legally required; Spanish issuer with "
                             "attendance premium; delegated holding >1%; IBEX-35; "
                             "EU/NA >0.07%; >EUR 12M delegated investment; "
                             "strategic sectors >0.04%/EUR 10M."),
                    "url": "https://www.bbvaassetmanagement.com/"},
    }
    by_rep_year: dict[tuple[str, int], dict] = {}
    for v in votes_out:
        year = proposal_year.get(v["proposal_id"])
        if year is None:
            continue
        key = next((k for k in REPORTERS if ids.reporter_id(k) == v["reporter_id"]), None)
        p = profile.get(key, {"level": DisclosureLevel.ITEMIZED, "doc": False,
                              "text": None, "url": None})
        by_rep_year[(v["reporter_id"], year)] = {
            "reporter_id": v["reporter_id"], "season": year,
            "coverage_start": None, "coverage_end": None,
            "published_at": None, "disclosure_level": p["level"].value,
            "significance_criteria_documented": p["doc"],
            "significance_criteria_text": p["text"],
            "significance_criteria_source": p["url"],
            "aggregation_scope": None, "update_frequency": None,
            "source_lag_days": None, "reuse_status": None,
            "source_url": None,
        }
    return list(by_rep_year.values())


def _sponsor(cl: list[_Inst]) -> SponsorType:
    flags = {i.shareholder for i in cl if i.shareholder is not None}
    if flags == {True}:
        return SponsorType.SHAREHOLDER
    if flags == {False}:
        return SponsorType.MANAGEMENT
    txt = " ".join(i.text_norm for i in cl)
    if "shareholder proposal" in txt or "by shareholder" in txt:
        return SponsorType.SHAREHOLDER
    return SponsorType.UNKNOWN
