"""Issuer identity resolver.

Resolution order (only identifier-grade evidence auto-promotes):
    ISIN in universe           → EXACT_ISIN
    ISIN → OI → XMAD-listed    → EXACT_ISIN (universe member by rule)
    CUSIP → OI identifiers → ISIN → universe → EXACT_CUSIP
    normalized name == alias   → NAME_SUSPECT (returned as suspect, NOT resolved)

Unresolved records stay in the data with issuer_id=NULL-equivalent and
review_status=UNRESOLVED; they are counted by QA, never silently dropped.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pyarrow.parquet as pq

from votes_es.domain.enums import MatchMethod, ReviewStatus
from votes_es.identity.openinstrument import OiSnapshot
from votes_es.normalization.text import normalize_issuer_name


@dataclass(frozen=True)
class Resolution:
    issuer_id: str | None
    issuer_name: str | None
    match_method: MatchMethod
    review_status: ReviewStatus
    evidence: str          # human-readable justification, kept on the record


class IdentityResolver:
    def __init__(self, universe_path: Path, oi: OiSnapshot | None = None):
        t = pq.read_table(universe_path).to_pylist()
        self.by_isin: dict[str, dict] = {r["isin"]: r for r in t}
        self.by_alias: dict[str, list[dict]] = {}
        for r in t:
            self.by_alias.setdefault(r["alias_normalized"], []).append(r)
        self._oi = oi
        self._oi_isin_cache: dict[str, dict] = {}
        self._oi_cusip_cache: dict[str, str] = {}

    def warm(self, isins: list[str], cusips: list[str]) -> None:
        """Bulk prefetch: two OI queries cover every resolution thereafter."""
        if not self._oi:
            return
        miss_i = [i for i in set(isins) if i and i not in self._oi_isin_cache
                  and i not in self.by_isin]
        self._oi_isin_cache.update(self._oi.resolve_isins(miss_i))
        for i in miss_i:                       # negative-cache misses
            self._oi_isin_cache.setdefault(i, {})
        miss_c = [c for c in set(cusips) if c and c not in self._oi_cusip_cache]
        self._oi_cusip_cache.update(self._oi.cusip_to_isin(miss_c))
        for c in miss_c:                       # negative-cache misses
            self._oi_cusip_cache.setdefault(c, "")
        # pre-resolve isins reachable via cusip
        via = [i for i in self._oi_cusip_cache.values()
               if i and i not in self._oi_isin_cache and i not in self.by_isin]
        self._oi_isin_cache.update(self._oi.resolve_isins(via))
        for i in via:
            self._oi_isin_cache.setdefault(i, {})

    @classmethod
    def from_universe(cls, path: Path, use_oi: bool = True) -> IdentityResolver:
        oi = None
        if use_oi:
            from votes_es.identity.openinstrument import locate_snapshot
            snap = locate_snapshot()
            if snap is not None:
                oi = OiSnapshot(snap)
        return cls(path, oi)

    def resolve(self, isin: str | None, cusip: str | None,
                issuer_name_raw: str | None) -> Resolution:
        isin = (isin or "").strip() or None
        cusip = (cusip or "").strip() or None

        if isin and isin in self.by_isin:
            r = self.by_isin[isin]
            return Resolution(r["issuer_id"], r["canonical_name"],
                              MatchMethod.EXACT_ISIN, ReviewStatus.EXACT,
                              f"isin={isin} in universe ({r['universe_basis']})")

        if isin and self._oi:
            meta = self._oi_isin_cache.get(isin)
            if meta is None:
                meta = self._oi.resolve_isins([isin]).get(isin, {})
                self._oi_isin_cache[isin] = meta
            if meta.get("xmad_listed") and meta.get("lei"):
                iid = f"lei:{meta['lei']}"
                name = meta.get("legal_name") or issuer_name_raw or isin
                return Resolution(iid, name, MatchMethod.EXACT_ISIN,
                                  ReviewStatus.HIGH_CONFIDENCE,
                                  f"isin={isin} OI→LEI {meta['lei']}, XMAD-listed")

        if cusip and self._oi:
            tgt = self._oi_cusip_cache.get(cusip, "")
            if tgt == "" and cusip not in self._oi_cusip_cache:
                self._oi_cusip_cache.update(self._oi.cusip_to_isin([cusip]))
                self._oi_cusip_cache.setdefault(cusip, "")
                tgt = self._oi_cusip_cache[cusip]
            if tgt:
                if tgt in self.by_isin:
                    r = self.by_isin[tgt]
                    return Resolution(r["issuer_id"], r["canonical_name"],
                                      MatchMethod.EXACT_CUSIP, ReviewStatus.EXACT,
                                      f"cusip={cusip}→isin={tgt} in universe")
                meta = self._oi.resolve_isins([tgt]).get(tgt, {})
                if meta.get("xmad_listed") and meta.get("lei"):
                    return Resolution(f"lei:{meta['lei']}",
                                      meta.get("legal_name") or issuer_name_raw or tgt,
                                      MatchMethod.EXACT_CUSIP, ReviewStatus.HIGH_CONFIDENCE,
                                      f"cusip={cusip}→isin={tgt} OI→LEI, XMAD-listed")

        if issuer_name_raw:
            key = normalize_issuer_name(issuer_name_raw)
            cands = self.by_alias.get(key, [])
            if len(cands) == 1:
                r = cands[0]
                return Resolution(None, r["canonical_name"],
                                  MatchMethod.NAME_SUSPECT, ReviewStatus.AMBIGUOUS,
                                  f"name '{issuer_name_raw}' ~ '{r['canonical_name']}' "
                                  f"(suspect only — no identifier match)")

        return Resolution(None, issuer_name_raw, MatchMethod.UNRESOLVED,
                          ReviewStatus.UNRESOLVED,
                          f"isin={isin} cusip={cusip} name='{issuer_name_raw}'")

    def close(self) -> None:
        if self._oi:
            self._oi.close()
