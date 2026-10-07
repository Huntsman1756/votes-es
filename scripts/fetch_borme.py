"""Fetch BORME convocatoria pages and extract the Orden del día.

Usage: uv run python scripts/fetch_borme.py manifest.csv

manifest.csv columns: isin,meeting_date,borme_url  (one per shared meeting)

Writes:
  data/reference/official_agendas/raw/<isin>_<date>.txt   raw agenda section
  prints parsed items for manual curation into the agenda CSVs.

Curated agenda CSVs (data/reference/official_agendas/*.csv) are the
hand-verified artifact — this script only assists; it never overwrites.
"""
from __future__ import annotations

import csv
import html
import re
import sys
import urllib.request
from pathlib import Path

RAW = Path("data/reference/official_agendas/raw")

ORD_NUM = {"primero": 1, "segundo": 2, "tercero": 3, "cuarto": 4,
           "quinto": 5, "sexto": 6, "séptimo": 7, "septimo": 7,
           "octavo": 8, "noveno": 9, "décimo": 10, "decimo": 10,
           "undécimo": 11, "undecimo": 11, "decimosegundo": 12,
           "duodécimo": 12, "duodecimo": 12, "decimoprimero": 11,
           "decimotercero": 13, "decimocuarto": 14, "decimoquinto": 15,
           "decimosexto": 16, "decimoséptimo": 17, "decimoseptimo": 17,
           "decimoctavo": 18, "decimonoveno": 19, "vigésimo": 20,
           "vigesimo": 20}
ORDINALS = [
    "|".join(k for k in ORD_NUM) + "|Vig[ée]simo|Último",
]
ORD_RE2 = re.compile(
    r"(?:^|(?<=[.\n])\s*|(?<=\n))(" + "|".join(list(ORD_NUM) + ["vig[ée]simo",
                                     "último"]) + r")"
    r"(?:\s*º?\s*([A-H]))?\s*[\.\-]\s*", re.UNICODE | re.IGNORECASE)


def split_items(text: str) -> list[tuple[str, str]]:
    """Split on Spanish ordinals; returns [(official_number, title)].

    'Tercero B.' → 3.B ; numeric sub-parts like '5.1' inside a segment are
    left in the segment text for manual splitting."""
    parts = ORD_RE2.split(text)
    items: list[tuple[str, str]] = []
    i = 1
    while i < len(parts):
        ordw, sub, seg = parts[i], parts[i + 1], parts[i + 2]
        if ordw:
            n = ORD_NUM.get(ordw.lower())
            if n is not None:
                num = f"{n}.{sub.lower()}" if sub else str(n)
                items.append((num, seg[:400]))
        i += 3
    return items


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    raw = urllib.request.urlopen(req, timeout=60).read()
    if raw[:4] == b"%PDF" or url.lower().endswith(".pdf"):
        import io

        import pdfplumber
        with pdfplumber.open(io.BytesIO(raw)) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def agenda_text(page: str) -> str:
    """Extract the Orden del día section from a BORME txt page."""
    seg = re.sub(r"<script.*?</script>", " ", page, flags=re.S)
    seg = re.sub(r"<style.*?</style>", " ", seg, flags=re.S)
    seg = re.sub(r"</p>|<br\s*/?>", "\n", seg)
    seg = re.sub(r"<[^>]+>", " ", seg)
    seg = html.unescape(seg)
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in seg.split("\n")]
    seg = "\n".join(ln for ln in lines if ln)
    for pat in (r"Orden del d[ií]a\s*(.*?)(?:DERECHOS DE ACCIONISTAS|"
                r"DERECHO DE ASISTENCIA|El Consejo de Administración ha|"
                r"Complemento de la convocatoria|\f)",
                r"AGENDA\s*(.*?)(?:SUPPLEMENT TO|ATTENDANCE|PARTICIPATION)",
                r"ORDER OF BUSINESS\s*(.*?)(?:SUPPLEMENT|ATTENDANCE)"):
        m = re.search(pat, seg, re.S | re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return seg


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    with open(sys.argv[1], encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if not row.get("borme_url"):
                continue
            try:
                page = fetch(row["borme_url"])
            except Exception as e:        # noqa: BLE001 — manual-assist tool
                print(f"{row['isin']} {row['meeting_date']} FETCH FAIL {e}")
                continue
            agenda = agenda_text(page)
            (RAW / f"{row['isin']}_{row['meeting_date']}.txt").write_text(
                agenda, encoding="utf-8")
            print(f"\n=== {row['isin']} {row['meeting_date']} ===")
            for num, title in split_items(agenda):
                print(f"  {num:<4} {title[:120]}")
            if not split_items(agenda):
                print("  (no ordinal items parsed — inspect raw txt)")


if __name__ == "__main__":
    main()
