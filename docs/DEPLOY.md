# Deploy — votes.h1756.es (prepared, gated)

**Gate status: BLOCKED until bulk 2026 + QA pass.** Do not deploy before
`N-PX BULK 2026 PASS` in the exit report.

## Target environment (from `Huntsman1756/h1756-vps-ops` baseline)

- VPS H1756 (OVH), Ubuntu, Coolify already installed + healthy, wildcard
  `*.h1756.es` DNS resolves to the host.
- Edge: Coolify's **Traefik** on 80/443 — our own Caddyfile is for standalone
  dev only; on the VPS the app should be a Coolify service, not its own
  edge proxy.
- Ports: internal Docker ports are blocked externally by DOCKER-USER —
  do not publish ports; attach to the Coolify network and let Traefik route
  `votes.h1756.es`.
- No changes to global VPS security (UFW/DOCKER-USER/Coolify config).

## Shape

```
Coolify service "votes-es" (docker compose):
  votes-es-api  →  FastAPI on :8000 (internal only)
                   serves /api/v1/* + built SPA from web/dist
  volumes:
    votes-gold:/srv/gold  (read-only dataset root)
  env:
    VOTES_PUBLISH_VOTE_SOURCES=sec_npx        # VDS vote rows not published
```

Traefik label: `votes.h1756.es` → :8000.

## Atomic dataset publication

Dataset root layout on the volume:

```
/srv/gold/
  datasets/<run_id>/votes.duckdb   # staging build
  datasets/<run_id>/manifest.json  # counts, checks, git sha, built_at
  CURRENT -> datasets/<run_id>     # symlink switch (atomic)
  datasets/<previous>/             # retained for rollback
```

Publish procedure (manual or scheduled job):

```
votes build            # silver → staging dir (not the served path)
votes validate         # all checks must PASS; on failure DO NOT publish
write manifest.json
ln -sfn datasets/<run_id> CURRENT
```

The API opens `CURRENT/votes.duckdb` read-only per request, so a switch is
instant and rollback is one symlink. Never build directly over the served
file.

## Refresh job

N-PX season cadence is annual (due ~Aug 31) + late amendments. Manual or
weekly-cron during filing season is sufficient:

```
votes ingest npx-season --season 2026 --retry-failed
votes build && votes validate && coverage --season 2026
# publish only if validate == PASS
```

Idempotent: manifest + per-accession bronze make re-runs free.
