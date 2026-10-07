"""Issuer universe construction.

Definition (documented in METHODOLOGY.md): the Spanish-listed universe is
issuer-centric and identifier-driven —

    equity instruments (CFI E*) with a live XMAD listing
    ∪ committed seed entries (manual additions/overrides)

Explicitly NOT `ISIN startswith 'ES'`: Ferrovial (NL) and ArcelorMittal (LU)
are XMAD-listed Spanish-market issuers; ES-ISIN foreign-operating issuers stay
in the universe but carry their true jurisdiction.

Output: data/reference/universe.parquet — issuers + instruments + aliases in
one denormalized artifact the resolver and silver builder consume.
"""
from __future__ import annotations

import csv
import importlib.resources as res
from dataclasses import dataclass
from pathlib import Path

import pyarrow as pa
import pyarrow.parquet as pq

from votes_es import ids
from votes_es.identity.openinstrument import OiSnapshot, locate_snapshot
from votes_es.normalization.text import normalize_issuer_name

BME_EQUITY_MICS = ("XMAD",)  # SIBE continuous market; BME Growth/MAB are separate MICs, see methodology

UNIVERSE_SCHEMA = pa.schema([
    ("issuer_id", pa.string()),
    ("canonical_name", pa.string()),
    ("country", pa.string()),
    ("lei", pa.string()),
    ("isin", pa.string()),
    ("ticker", pa.string()),
    ("universe_basis", pa.string()),   # XMAD_LISTED | SEED | SEED_OVERRIDE
    ("alias_normalized", pa.string()), # normalized name key for suspect matching
])


@dataclass
class UniverseRow:
    issuer_id: str
    canonical_name: str
    country: str | None
    lei: str | None
    isin: str
    ticker: str | None
    universe_basis: str
    alias_normalized: str


def load_seed() -> list[dict]:
    seed = res.files("votes_es.reference").joinpath("issuer_seed.csv")
    with seed.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build_universe(out_path: Path, oi: OiSnapshot | None = None) -> list[UniverseRow]:
    """Build the universe artifact. `oi=None` → seed-only (offline/CI mode)."""
    rows: dict[str, UniverseRow] = {}          # key: isin
    issuer_ids: dict[str, str] = {}            # key: lei or isin → issuer_id

    seed = load_seed()
    seed_isins = {r["isin"].strip() for r in seed if r.get("isin")}

    # --- lane 1: XMAD-listed equities from OpenInstrument
    if oi is not None:
        for isin, lei, legal_name, jur, _cfi in oi.equity_isins_on_mics(BME_EQUITY_MICS):
            name = legal_name or isin
            iid = issuer_ids.setdefault(lei or isin, ids.issuer_id(lei, isin))
            rows[isin] = UniverseRow(
                issuer_id=iid, canonical_name=name, country=jur, lei=lei,
                isin=isin, ticker=None, universe_basis="XMAD_LISTED",
                alias_normalized=normalize_issuer_name(name),
            )

    # --- lane 2: seed (overrides canonical_name; adds issuers OI lacks)
    oi_lookup = {}
    missing = sorted(seed_isins - set(rows))
    if missing and oi is not None:
        oi_lookup = oi.resolve_isins(missing)
    for s in seed:
        isin = (s.get("isin") or "").strip()
        if not isin:
            continue
        meta = oi_lookup.get(isin, {})
        lei = (s.get("lei") or "").strip() or meta.get("lei")
        jur = meta.get("jurisdiction") or ("ES" if isin.startswith("ES") else isin[:2])
        existing = rows.get(isin)
        if existing:
            existing.canonical_name = s["canonical_name"]
            existing.lei = existing.lei or lei
            existing.ticker = (s.get("ticker") or "").strip() or None
            existing.universe_basis = "SEED_OVERRIDE"
            if lei and existing.issuer_id != ids.issuer_id(lei, isin):
                existing.issuer_id = ids.issuer_id(lei, isin)
        else:
            rows[isin] = UniverseRow(
                issuer_id=ids.issuer_id(lei, isin),
                canonical_name=s["canonical_name"], country=jur, lei=lei,
                isin=isin, ticker=(s.get("ticker") or "").strip() or None,
                universe_basis="SEED",
                alias_normalized=normalize_issuer_name(s["canonical_name"]),
            )

    out = sorted(rows.values(), key=lambda r: r.isin)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(
        pa.Table.from_pylist([r.__dict__ for r in out], schema=UNIVERSE_SCHEMA),
        out_path, compression="zstd",
    )
    return out


def build_universe_cli(out_path: Path) -> tuple[int, str]:
    """Entry point for `votes universe build`. Returns (n_rows, provenance)."""
    snap = locate_snapshot()
    if snap is None:
        rows = build_universe(out_path, oi=None)
        return len(rows), "seed-only (OpenInstrument snapshot not found)"
    oi = OiSnapshot(snap)
    try:
        rows = build_universe(out_path, oi=oi)
    finally:
        oi.close()
    return len(rows), f"OpenInstrument {snap.generation} + seed"
