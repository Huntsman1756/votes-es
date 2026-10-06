"""G0 probe: count Spanish-issuer records inside already-downloaded N-PX vote tables.

Matching: known ISIN set (incl. non-ES ISINs e.g. Ferrovial NL, ArcelorMittal LU)
+ ES* ISIN prefix + issuer-name regex fallback. Every record keeps which rule hit.
"""
from __future__ import annotations

import json
import re
import sys
import time
from collections import Counter, defaultdict
from pathlib import Path
from xml.etree.ElementTree import iterparse

KNOWN_ISIN = {
    "ES0105046009": "Aena", "ES0109067019": "Amadeus", "ES0113900J37": "Santander",
    "ES0113211835": "BBVA", "ES0113860A34": "Sabadell", "ES0167050915": "ACS",
    "ES0105066007": "Cellnex", "ES0178430E18": "Telefonica", "ES0173516115": "Repsol",
    "NL0015001FS8": "Ferrovial", "ES0144580Y14": "Iberdrola", "ES0148396007": "Inditex",
    "ES0140609019": "CaixaBank", "ES0113679I37": "Bankinter", "ES0124244E34": "Mapfre",
    "ES0125220311": "Acciona", "ES0105563003": "Acciona Energia", "ES0116870314": "Naturgy",
    "ES0130670112": "Endesa", "ES0130960018": "Enagas", "ES0173093024": "Redeia",
    "ES0171996087": "Grifols", "ES0118594417": "Indra", "ES0105025003": "Merlin",
    "ES0137650018": "Fluidra", "ES0139140174": "Colonial", "ES0132105018": "Acerinox",
    "LU1598757687": "ArcelorMittal", "ES0105027009": "Logista", "ES0184262212": "Viscofan",
    "ES0157261019": "Rovi", "ES0165386014": "Solaria", "ES0183746314": "Vidrala",
    "ES0105630315": "CIE Automotive", "ES0112501012": "Ebro Foods",
}

NAME_RE = re.compile(
    r"IBERDROLA|SANTANDER|INDUSTRIA DE DISENO TEXTIL|INDITEX|TELEFONICA|REPSOL|"
    r"FERROVIAL|AENA |AMADEUS|CELLNEX|ACS,|ACS |BBVA|BANCO BILBAO|SABADELL|"
    r"CAIXABANK|BANKINTER|ACCIONA|NATURGY|ENDESA|ENAGAS|RED ELECTRICA|REDEIA|"
    r"GRIFOLS|INDRA |MERLIN|FLUIDRA|COLONIAL|ACERINOX|ARCELORMITTAL|LOGISTA|"
    r"VISCOFAN|ROVI|SOLARIA|VIDRALA|CIE AUTOMOTIVE|EBRO FOODS|MAPFRE",
    re.I,
)


def local(tag: str) -> str:
    return tag.rpartition("}")[2]


def fields(elem) -> dict:
    rec = {}
    for child in elem.iter():
        name = local(child.tag)
        if name in ("issuerName", "cusip", "isin", "figi", "meetingDate",
                    "voteDescription", "sharesVoted", "sharesOnLoan", "voteSeries"):
            rec.setdefault(name, (child.text or "").strip())
        elif name == "categoryType" and child.text:
            rec.setdefault("_cats", []).append(child.text.strip())
        elif name == "howVoted" and child.text:
            rec.setdefault("_howvoted", []).append(child.text.strip())
        elif name == "managementRecommendation" and child.text:
            rec.setdefault("_mgmtrec", []).append(child.text.strip())
    return rec


def scan(path: Path):
    stats = {
        "file": path.name,
        "spanish_tables": 0,
        "match_rules": Counter(),
        "by_isin_issuer": Counter(),
        "meetings": defaultdict(set),   # issuer -> set(meetingDate)
        "proposals": 0,
        "vote_records": 0,
        "how_voted": Counter(),
        "dissent": 0,
        "dissent_applicable": 0,
        "series": Counter(),
        "issuers": Counter(),
    }
    for _e, elem in iterparse(path, events=("end",)):
        if local(elem.tag) != "proxyTable":
            continue
        rec = fields(elem)
        elem.clear()
        isin = rec.get("isin", "")
        name = rec.get("issuerName", "")
        hit = None
        if isin in KNOWN_ISIN:
            hit = "known_isin"
            issuer = KNOWN_ISIN[isin]
        elif isin.startswith("ES"):
            hit = "es_isin"
            issuer = name
        elif NAME_RE.search(name):
            hit = "name"
            issuer = name
        if not hit:
            continue
        stats["match_rules"][hit] += 1
        stats["spanish_tables"] += 1
        stats["issuers"][issuer] += 1
        stats["meetings"][issuer].add(rec.get("meetingDate", ""))
        nvotes = len(rec.get("_howvoted", []))
        stats["vote_records"] += nvotes
        for hv, mg in zip(rec.get("_howvoted", []), rec.get("_mgmtrec", [])):
            stats["how_voted"][hv] += 1
            if hv and mg:
                stats["dissent_applicable"] += 1
                if hv != mg:
                    stats["dissent"] += 1
        if rec.get("voteSeries"):
            stats["series"][rec["voteSeries"]] += 1
    stats["n_meetings"] = sum(len(v) for v in stats["meetings"].values())
    stats["n_issuers"] = len(stats["issuers"])
    return stats


if __name__ == "__main__":
    out = []
    for p in sys.argv[1:]:
        t0 = time.perf_counter()
        s = scan(Path(p))
        s["wall_s"] = round(time.perf_counter() - t0, 2)
        out.append(s)
        print(json.dumps({
            "file": s["file"], "spanish_tables": s["spanish_tables"],
            "issuers": s["n_issuers"], "meetings": s["n_meetings"],
            "vote_records": s["vote_records"], "match_rules": dict(s["match_rules"]),
            "how_voted": dict(s["how_voted"]),
            "dissent": s["dissent"], "dissent_applicable": s["dissent_applicable"],
            "n_series": len(s["series"]), "wall_s": s["wall_s"],
        }, indent=1))
        top = s["issuers"].most_common(15)
        print("top issuers:", top)
    Path("data/coverage").mkdir(parents=True, exist_ok=True)
    with open("data/coverage/probe_local.json", "w") as f:
        json.dump([{k: (dict(v) if isinstance(v, Counter) else {kk: sorted(vv) for kk, vv in v.items()} if isinstance(v, defaultdict) else v) for k, v in s.items()} for s in out], f, indent=1, default=str)
