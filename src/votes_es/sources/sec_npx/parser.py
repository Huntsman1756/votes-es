"""Streaming N-PX proxyVoteTable parser.

Schema (SEC N-PX information table, VoteTableSchemaVersion:X0300):

    <proxyVoteTable>                 (root; inf:-prefixed or default ns — same URI)
      <proxyTable>                   (one per issuer × proposal)
        issuerName, cusip, isin, figi, meetingDate, voteDescription,
        <voteCategories><voteCategory><categoryType>*N
        voteSource, sharesVoted, sharesOnLoan,
        <vote><voteRecord>*N         (one per series/fund voting this row)
          howVoted, sharesVoted, managementRecommendation
        <voteManager><otherManagers><otherManager>*N
        voteSeries

Namespace-agnostic via local-name matching: both variants share the namespace
URI `http://www.sec.gov/edgar/document/npxproxy/informationtable`; local-name
matching also tolerates filer namespace drift.

Memory is bounded: elements are cleared after yield. Measured G0: ~60 MB/s,
38 MB peak RSS on a 185 MB file.
"""
from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
from xml.etree.ElementTree import Element, iterparse

from votes_es.domain.models import NpxProxyTable, NpxVoteRecord

NPX_NS = "http://www.sec.gov/edgar/document/npxproxy/informationtable"

_TABLE_FIELDS = (
    "issuerName", "cusip", "isin", "figi", "meetingDate", "voteDescription",
    "voteSource", "sharesVoted", "sharesOnLoan", "voteSeries",
)


def local(tag: str) -> str:
    return tag.rpartition("}")[2]


def schema_version(path: Path) -> str | None:
    """Read the `<!--VoteTableSchemaVersion:X0300-->` header comment if present."""
    with open(path, "rb") as f:
        head = f.read(4096)
    import re
    m = re.search(rb"VoteTableSchemaVersion:\s*([A-Za-z0-9.]+)", head)
    return m.group(1).decode() if m else None


def iter_proxy_tables(path: Path) -> Iterator[Element]:
    """Yield each <proxyTable> element, clearing it after consumption."""
    for _event, elem in iterparse(path, events=("end",)):
        if local(elem.tag) == "proxyTable":
            yield elem
            elem.clear()


def parse_table(elem: Element) -> NpxProxyTable:
    rec: dict[str, str] = {}
    cats: list[str] = []
    votes: list[NpxVoteRecord] = []
    managers: list[str] = []
    for child in elem:
        name = local(child.tag)
        if name == "voteCategories":
            cats = [
                c.text.strip() for c in child.iter()
                if local(c.tag) == "categoryType" and c.text
            ]
        elif name == "vote":
            for vr in child:
                if local(vr.tag) == "voteRecord":
                    fields = {local(g.tag): (g.text or "").strip() for g in vr}
                    votes.append(NpxVoteRecord(
                        how_voted_raw=fields.get("howVoted", ""),
                        shares_voted_raw=fields.get("sharesVoted") or None,
                        management_recommendation_raw=fields.get("managementRecommendation") or None,
                    ))
        elif name == "voteManager":
            managers = [
                m.text.strip() for m in child.iter()
                if local(m.tag) == "otherManager" and m.text
            ]
        elif name in _TABLE_FIELDS:
            rec[name] = (child.text or "").strip()
    return NpxProxyTable(
        issuer_name_raw=rec.get("issuerName", ""),
        cusip=rec.get("cusip") or None,
        isin=rec.get("isin") or None,
        figi=rec.get("figi") or None,
        meeting_date_raw=rec.get("meetingDate", ""),
        vote_description_raw=rec.get("voteDescription", ""),
        vote_source=rec.get("voteSource") or None,
        shares_voted_raw=rec.get("sharesVoted") or None,
        shares_on_loan_raw=rec.get("sharesOnLoan") or None,
        vote_series=rec.get("voteSeries") or None,
        categories=cats,
        other_managers=managers,
        vote_records=votes,
    )


def parse_file(path: Path) -> Iterator[NpxProxyTable]:
    for elem in iter_proxy_tables(path):
        yield parse_table(elem)
