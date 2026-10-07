"""Read-side adapter for an OpenInstrument canonical snapshot.

votes-es does NOT rebuild a security master. It consumes the sibling project's
published parquet dataset (canonical/version=N) read-only, pinned to a
generation directory. If OpenInstrument is absent, the universe falls back to
the committed seed CSV (data correctness is preserved; coverage shrinks).
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import duckdb

OI_ROOT_ENV = "OPENINSTRUMENT_ROOT"
OI_DEFAULT_ROOT = Path(r"F:/_Proyectos/openinstrument")


@dataclass(frozen=True)
class OiPaths:
    root: Path
    generation: str
    canonical: Path


def locate_snapshot(root: Path | None = None) -> OiPaths | None:
    root = root or Path(os.environ.get(OI_ROOT_ENV, OI_DEFAULT_ROOT))
    read = root / "data" / "read"
    cur = read / "CURRENT"
    if not cur.exists():
        return None
    generation = cur.read_text().strip()
    canonical = read / generation / "dataset" / "canonical" / "version=1"
    if not (canonical / "instruments.parquet").exists():
        return None
    return OiPaths(root=root, generation=generation, canonical=canonical)


class OiSnapshot:
    """DuckDB-backed read access to the pinned canonical generation."""

    def __init__(self, paths: OiPaths):
        self.paths = paths
        self.con = duckdb.connect()
        self.con.execute("SET memory_limit='2GB'")
        self._p = str(paths.canonical).replace("\\", "/")

    def table(self, name: str) -> str:
        return f"'{self._p}/{name}.parquet'"

    def equity_isins_on_mics(self, mics: tuple[str, ...]) -> list[tuple]:
        """(isin, issuer_lei, legal_name, jurisdiction, cfi) for equities with a
        non-terminated listing on any of the given MICs."""
        q = f"""
        SELECT DISTINCT l.isin, i.issuer_lei, e.legal_name, e.legal_jurisdiction, i.cfi
        FROM {self.table('listings')} l
        JOIN {self.table('instruments')} i USING (isin)
        LEFT JOIN {self.table('legal_entities')} e ON i.issuer_lei = e.lei
        WHERE i.cfi LIKE 'E%'
          AND l.venue_mic IN ({",".join(f"'{m}'" for m in mics)})
          AND (l.termination_date IS NULL OR l.termination_date = '')
        ORDER BY 1
        """
        return self.con.execute(q).fetchall()

    def resolve_isins(self, isins: list[str]) -> dict[str, dict]:
        """isin → {lei, legal_name, jurisdiction, cfi, xmad_listed}"""
        if not isins:
            return {}
        vals = ",".join(f"('{i}')" for i in sorted(set(isins)))
        q = f"""
        WITH wanted(isin) AS (SELECT * FROM (VALUES {vals}) t),
        xm AS (
          SELECT DISTINCT isin, TRUE AS xm FROM {self.table('listings')}
          WHERE venue_mic = 'XMAD' AND (termination_date IS NULL OR termination_date = '')
        )
        SELECT w.isin, i.issuer_lei, e.legal_name, e.legal_jurisdiction, i.cfi,
               COALESCE(xm.xm, FALSE)
        FROM wanted w
        LEFT JOIN {self.table('instruments')} i ON w.isin = i.isin
        LEFT JOIN {self.table('legal_entities')} e ON i.issuer_lei = e.lei
        LEFT JOIN xm ON w.isin = xm.isin
        """
        out = {}
        for isin, lei, name, jur, cfi, xm in self.con.execute(q).fetchall():
            out[isin] = {"lei": lei, "legal_name": name, "jurisdiction": jur,
                         "cfi": cfi, "xmad_listed": bool(xm)}
        return out

    def cusip_to_isin(self, cusips: list[str]) -> dict[str, str]:
        """CUSIP → ISIN via the canonical identifiers table (scheme='CUSIP')."""
        if not cusips:
            return {}
        vals = ",".join(f"('{c}')" for c in sorted(set(cusips)))
        q = f"""
        SELECT value AS cusip, isin FROM {self.table('identifiers')}
        WHERE upper(scheme) LIKE '%CUSIP%' AND value IN (SELECT cusip FROM (VALUES {vals}) t)
        """
        return dict(self.con.execute(q).fetchall())

    def close(self) -> None:
        self.con.close()
