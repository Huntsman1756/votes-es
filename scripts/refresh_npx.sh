#!/usr/bin/env bash
# Weekly-ish N-PX refresh: discover -> fetch new/changed -> rebuild -> release
# -> ship -> atomic switch. Any QA FAIL = no switch, site keeps serving.
set -euo pipefail
cd "$(dirname "$0")/.."

votes ingest npx-season --season 2026 --retry-failed
votes build
VOTES_PUBLISH_VOTE_SOURCES=sec_npx python scripts/release.py
GEN=$(cat dist/CURRENT)
scp -r "dist/generations/$GEN" h1756-vps1:/data/votes-es/generations/
ssh h1756-vps1 "cd /data/votes-es/generations/$GEN && sha256sum -c SHA256SUMS --quiet && \
    cd /data/votes-es && ln -sfn generations/$GEN NEW_CURRENT && mv -T NEW_CURRENT CURRENT && \
    readlink CURRENT"
echo "published $GEN"
