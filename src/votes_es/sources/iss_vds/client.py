"""ISS Voting Disclosure Service client.

Undocumented internal JSON API behind `https://vds.issgovernance.com/vds/`.
Request contract reconstructed from live captures (data/raw/vds_capture.txt,
docs/sources/*/SOURCE-MEMO.md):

    GET /vds/                                        session bootstrap (cookies)
    GET /vds/api/getVdsData/4   actionCode=100       fund list
    GET /vds/api/getVdsData/14  actionCode=100       meeting list (paginated)
    GET /vds/api/getVdsData/7   actionCode=114       per-fund per-proposal votes

Common params: customerID (base64), sessionToken (numeric string), liveSiteYN=1,
fromDate/toDate, locale=en, random=<float>, _search=false, nd=<epoch ms>.

The customerID is the base64 fragment in the public dashboard URL
(e.g. `NzIxNg==` → BBVA AM 7216). Keep this client thin: if ISS changes the
contract, only this module and its contract tests should need updates.
"""
from __future__ import annotations

import random
import secrets
import time
from datetime import date
from typing import Any, Self

import httpx

VDS_BASE = "https://vds.issgovernance.com"
UA = ("Mozilla/5.0 (compatible; votes-es/0.1; +https://votes.h1756.es) "
      "public-disclosure-research")


class VdsClient:
    """Polite JSON client. Default rate: 1 req/s, declared UA."""

    def __init__(self, customer_id_b64: str, min_interval: float = 1.0,
                 timeout: float = 60.0):
        self.customer_id = customer_id_b64
        self.min_interval = min_interval
        self._last = 0.0
        self.session_token = str(secrets.randbelow(10**12))
        self.http = httpx.Client(
            base_url=VDS_BASE, timeout=timeout, follow_redirects=True,
            headers={"User-Agent": UA, "Accept": "application/json, text/plain, */*"},
        )

    def _throttle(self) -> None:
        wait = self.min_interval - (time.monotonic() - self._last)
        if wait > 0:
            time.sleep(wait)
        self._last = time.monotonic()

    def _params(self, action_code: int, from_date: str = "",
                to_date: str = "", **extra: Any) -> dict:
        return {
            "customerID": self.customer_id,
            "actionCode": str(action_code),
            "fromDate": from_date, "toDate": to_date,
            "liveSiteYN": "1", "locale": "en",
            "sessionToken": self.session_token,
            "random": f"{random.random():.16f}",
            "_search": "false", "nd": str(int(time.time() * 1000)),
            **extra,
        }

    def bootstrap(self) -> None:
        self._throttle()
        self.http.get("/vds/")  # cookies
        self.config = self.get_vds_data(2, **self._params(100)).get("data", [{}])[0]

    def clamp_window(self, from_date: date, to_date: date) -> tuple[date, date]:
        """Each register enforces a configured window (api/2 StartDate/EndDate);
        out-of-range dates silently return {}. Clamp, never guess."""
        cfg = getattr(self, "config", {})
        def _d(v):
            try:
                return date.fromisoformat(str(v)[:10])
            except Exception:
                return None
        start, end = _d(cfg.get("StartDate")), _d(cfg.get("EndDate"))
        return (max(from_date, start) if start else from_date,
                min(to_date, end) if end else to_date)

    def get_vds_data(self, endpoint: int, **params: Any) -> Any:
        self._throttle()
        r = self.http.get(f"/vds/api/getVdsData/{endpoint}", params=params)
        r.raise_for_status()
        return r.json()

    def funds(self) -> list[dict]:
        return self.get_vds_data(
            4, **self._params(100, language="en")).get("data", [])

    def meetings(self, from_date: date, to_date: date, rows: int = 200,
                 page: int = 1) -> list[dict]:
        return self.get_vds_data(
            14, **self._params(
                100, from_date=from_date.isoformat(),
                to_date=to_date.isoformat(),
                signMeeting="All", MeetingTypeList="", CountryList="",
                VotedList="", rows=rows, page=page,
                # NOTE: SortByColumn=MeetingDate returns {} on some customers
                # (verified CaixaBank 11006); CompanyName works on all.
                SortByColumn="CompanyName", OrderBy="asc"),
        ).get("data", [])

    def all_meetings(self, from_date: date, to_date: date,
                     rows: int = 200) -> list[dict]:
        from_date, to_date = self.clamp_window(from_date, to_date)
        out: list[dict] = []
        page = 1
        while True:
            batch = self.meetings(from_date, to_date, rows=rows, page=page)
            if not batch:
                break
            out.extend(batch)
            total = batch[0].get("TotalRows") or 0
            if len(out) >= int(total) or len(batch) < rows:
                break
            page += 1
        return out

    def votes(self, meeting_id: int, fund_id: int) -> list[dict]:
        payload = self.get_vds_data(
            7, **self._params(
                114, fundValue=fund_id, meetingID=meeting_id,
                signMeeting="All", signVote="All",
                rows=2000, page=1,
                SortByColumn="BallotItemNumber", OrderBy="asc"))
        return payload if isinstance(payload, list) else payload.get("data", [])

    def close(self) -> None:
        self.http.close()

    def __enter__(self) -> Self:
        self.bootstrap()
        return self

    def __exit__(self, *_a) -> None:
        self.close()
