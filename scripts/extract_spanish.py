"""G0 coverage artifact: extract Spanish-issuer vote records from downloaded N-PX
proxy tables into data/coverage/2026.parquet."""
from __future__ import annotations

import sys
from pathlib import Path
from xml.etree.ElementTree import iterparse

import pyarrow as pa
import pyarrow.parquet as pq

sys.path.insert(0, str(Path(__file__).parent))
from coverage_probe import KNOWN_ISIN, local  # noqa: E402

SOURCES = {
    "vanguard_proxytable_18mb.xml": ("VANGUARD INDEX FUNDS", "36405", "0001104659-26-102001"),
    "vanguard_intl_122mb.xml": ("VANGUARD INTERNATIONAL EQUITY INDEX FUNDS", "857489", "0001104659-26-101952"),
    "blackrock_ishares_70mb.xml": ("iSHARES TRUST", "1100663", "0001438934-26-002282"),
    "blackrock_ishares_185mb.xml": ("iSHARES TRUST", "1100663", "0001438934-26-002278"),
    "spdr_106mb.xml": ("SPDR SERIES TRUST", "1064642", "0001193125-26-351549"),
    "kingdon_small.xml": ("KINGDON CAPITAL MANAGEMENT", "1000097", "0001000097-26-000008"),
}


def extract(path: Path):
    reporter, cik, accession = SOURCES[path.name]
    for _e, elem in iterparse(path, events=("end",)):
        if local(elem.tag) != "proxyTable":
            continue
        rec = {"issuerName": "", "cusip": "", "isin": "", "figi": "", "meetingDate": "",
               "voteDescription": "", "voteSource": "", "sharesVoted": "", "sharesOnLoan": "",
               "voteSeries": ""}
        cats, votes, mgrs = [], [], []
        for c in elem.iter():
            n = local(c.tag)
            if n in rec and c.text:
                rec[n] = c.text.strip()
            elif n == "categoryType" and c.text:
                cats.append(c.text.strip())
            elif n == "voteRecord":
                for g in c:
                    gn = local(g.tag)
                    if gn in ("howVoted", "sharesVoted", "managementRecommendation"):
                        votes.append((gn, (g.text or "").strip()))
            elif n == "otherManager" and c.text:
                mgrs.append(c.text.strip())
        elem.clear()
        isin = rec["isin"]
        issuer = KNOWN_ISIN.get(isin)
        match = "known_isin" if issuer else ("es_isin" if isin.startswith("ES") else None)
        if not match:
            continue
        issuer = issuer or rec["issuerName"]
        for i in range(0, len(votes), 3):
            v = dict(votes[i:i+3])
            yield {
                "reporter": reporter, "reporter_cik": cik, "accession": accession,
                "issuer": issuer, "issuer_name_raw": rec["issuerName"], "isin": isin,
                "cusip": rec["cusip"], "figi": rec["figi"], "meeting_date_raw": rec["meetingDate"],
                "proposal_raw": rec["voteDescription"], "vote_source": rec["voteSource"],
                "categories": "|".join(cats), "how_voted": v.get("howVoted", ""),
                "shares_voted": v.get("sharesVoted") or rec["sharesVoted"],
                "shares_on_loan": rec["sharesOnLoan"],
                "management_recommendation": v.get("managementRecommendation", ""),
                "vote_series": rec["voteSeries"], "other_managers": "|".join(mgrs),
                "match_method": match,
                "source_url": f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession.replace('-','')}/",
            }


def main():
    schema = pa.schema([
        ("reporter", pa.string()), ("reporter_cik", pa.string()), ("accession", pa.string()),
        ("issuer", pa.string()), ("issuer_name_raw", pa.string()), ("isin", pa.string()),
        ("cusip", pa.string()), ("figi", pa.string()), ("meeting_date_raw", pa.string()),
        ("proposal_raw", pa.string()), ("vote_source", pa.string()), ("categories", pa.string()),
        ("how_voted", pa.string()), ("shares_voted", pa.string()), ("shares_on_loan", pa.string()),
        ("management_recommendation", pa.string()), ("vote_series", pa.string()),
        ("other_managers", pa.string()), ("match_method", pa.string()), ("source_url", pa.string()),
    ])
    out = Path("data/coverage/2026.parquet")
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    for name in SOURCES:
        p = Path("data/raw/sec") / name
        if not p.exists():
            print("skip missing", name)
            continue
        n = 0
        for rec in extract(p):
            rows.append(rec)
            n += 1
        print(name, "->", n, "spanish vote records")
    table = pa.Table.from_pylist(rows, schema=schema)
    pq.write_table(table, out, compression="zstd")
    print("wrote", out, table.num_rows, "rows")


if __name__ == "__main__":
    main()
