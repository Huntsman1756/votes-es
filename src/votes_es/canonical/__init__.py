"""G10 — canonical proposal model v2.

Four distinct concepts, kept separate:

    source observation   raw vote row from a filing
    source wording       distinct reporter phrasing (voteDescription,
                         MAPFRE proposal text) — NEVER called canonical
    legacy proposal      silver proposal_id cluster (v0.1 identity —
                         preserved, never rewritten)
    canonical proposal   the real meeting voting item; OFFICIAL_AGENDA-
                         anchored when issuer evidence exists

    votes → legacy_proposal_id → proposal_anchor_links → canonical
"""
