"""End-to-end production smoke: SPA routes + API surfaces + semantics.

Usage: python scripts/smoke_web.py <base_url>
"""
from __future__ import annotations

import json
import sys
import urllib.request

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:18765"
FAILS: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    print(f"{'PASS' if cond else 'FAIL'}  {name}  {detail}")
    if not cond:
        FAILS.append(name)


def api(path: str):
    with urllib.request.urlopen(BASE + path, timeout=20) as r:
        return json.loads(r.read())


def main() -> int:
    # ---------- API surfaces ----------
    st = api("/api/v1/status")
    check("status votes>0", st["votes"] > 100_000, str(st["votes"]))
    check("status gate=sec_npx only",
          st["publication_vote_sources"] == ["sec_npx"])
    check("status sources=1", st["sources"] == 1, str(st["sources"]))
    iss = api("/api/v1/issuers?q=iberdrola")
    check("search iberdrola", len(iss["issuers"]) > 0)
    iid = iss["issuers"][0]["issuer_id"]
    meets = api(f"/api/v1/issuers/{iid}/meetings")
    check("issuer meetings", len(meets["meetings"]) > 0)
    mid = meets["meetings"][0]["meeting_id"]
    pv = api(f"/api/v1/meetings/{mid}/votes?pivot=true")
    check("meeting pivot", len(pv["pivot"]) > 0, f"{len(pv['pivot'])} rows")
    # source-gate regression: no VDS rows may appear anywhere
    flat = api(f"/api/v1/meetings/{mid}/votes")
    srcs = {v["source_id"] for v in flat["votes"]}
    check("no VDS vote rows", not any("iss_vds" in s for s in srcs),
          str(srcs))
    check("npx semantics: no fabricated mgmt rec",
          all(v["management_recommendation"] is None for v in flat["votes"]
              if v["source_id"] == "sec_npx"))
    vid = flat["votes"][0]["vote_id"]
    vx = api(f"/api/v1/votes/{vid}")
    check("vote explain provenance",
          bool(vx.get("accession") and vx.get("parser_version")))
    src = api("/api/v1/sources")
    gate = {s["source_id"]: s["vote_rows_published"] for s in src["sources"]}
    check("sources publication flag", gate.get("sec_npx") is True
          and all(v is False for k, v in gate.items() if k != "sec_npx"),
          str(gate))
    # error surfaces
    try:
        api("/api/v1/votes/v:does-not-exist")
        check("vote 404", False)
    except urllib.error.HTTPError as e:
        check("vote 404", e.code == 404)
    h = api("/api/v1/health")
    check("health", h["ok"] is True)

    # ---------- SPA ----------
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page()
        errors: list[str] = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(BASE + "/", wait_until="networkidle")
        check("home loads", pg.title().startswith("votes-es"))
        check("home has issuers link", pg.locator("text=Issuers").count() > 0)
        # deep route refresh (SPA fallback)
        pg.goto(f"{BASE}/issuers/{iid}", wait_until="networkidle")
        check("deep issuer URL renders",
              pg.locator("table").count() > 0 or pg.locator("h1").count() > 0)
        pg.goto(f"{BASE}/meetings/{mid}", wait_until="networkidle")
        pg.wait_for_timeout(500)
        check("meeting matrix", pg.locator("table.matrix").count() > 0)
        check("meeting shows real directions",
              pg.locator(".chip").count() > 0, f"{pg.locator('.chip').count()} chips")
        pg.goto(f"{BASE}/votes/{vid}", wait_until="networkidle")
        pg.wait_for_timeout(400)
        body = pg.locator("body").inner_text()
        check("explain view has provenance",
              "accession" in body and "parser version" in body.lower())
        check("no 'Management recommended FOR' fabrication",
              "Management recommended" not in body or
              vx.get("management_recommendation") is not None)
        pg.goto(f"{BASE}/methodology", wait_until="networkidle")
        check("methodology renders", pg.locator("body").inner_text() != "")
        pg.goto(f"{BASE}/sources", wait_until="networkidle")
        check("sources page gate labels",
              "metadata only" in pg.locator("body").inner_text())
        # a bad route still serves the SPA (404 handled client-side)
        pg.goto(f"{BASE}/no-such-page", wait_until="networkidle")
        check("unknown deep URL serves SPA shell",
              "votes-es" in pg.content())
        check("no page errors", not errors, ";".join(errors[:3]))
        br.close()

    print(f"\n{'ALL PASS' if not FAILS else 'FAILURES: ' + str(FAILS)}")
    return 0 if not FAILS else 1


if __name__ == "__main__":
    raise SystemExit(main())
