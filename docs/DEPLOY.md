# Deploy — votes.h1756.es

## Baseline (verified 2026-10-07 against the live host)

VPS H1756 (OVH): Ubuntu 26.04.1, Docker, **Coolify 4.3.23** + `coolify-proxy`
(Traefik), wildcard `*.h1756.es` → 141.94.220.241. Public TCP: 22/80/443.
Traefik uses the Docker provider with `exposedByDefault=false` plus a file
provider under `/data/coolify/proxy/dynamic/`; Let's Encrypt HTTP challenge
on :80.

Do NOT install another edge proxy (Caddy/nginx host-level), Postgres, Redis,
K8s or systemd units. `votes-es` runs as a labeled container on the
`coolify` Docker network — the Coolify proxy routes and terminates TLS.

Note: Coolify API is disabled and the web UI is 2FA — the app is deployed
as a compose stack with Traefik labels (equivalent routing to a
Coolify-registered app); registering it inside the Coolify UI can be done
later by an operator session.

## Layout on the VPS

```
/data/votes-es/
├── generations/<dataset_version>/
│   ├── gold/votes.duckdb
│   ├── manifest.json  coverage.json  quality.json  SHA256SUMS
│   └── parquets/
├── CURRENT -> generations/<dataset_version>     # atomic switch
├── PREVIOUS                                     # retained generation
├── compose.yml        (compose.production.yaml)
└── image tag votes-es:0.1.0
```

- Mount `/data/votes-es` read-only into the container; the app opens
  `…/CURRENT/gold/votes.duckdb` **per request**, so a `CURRENT` switch is
  effective without container restart.
- Env: `VOTES_PUBLISH_VOTE_SOURCES=sec_npx` — VDS vote rows are never in
  the published dataset.
- Retention: keep CURRENT + PREVIOUS only (dataset ~15 MB per generation).

## Publish a new generation (manual/weekly during 2026-Q4)

```bash
# on the build host
votes ingest npx-season --season 2026          # incremental, resumable
votes build                                   # silver rebuild
VOTES_PUBLISH_VOTE_SOURCES=sec_npx \
    python scripts/release.py                 # → dist/generations/<id>/
# ship
scp -r dist/generations/<id> vps1:/data/votes-es/generations/
ssh vps1 'cd /data/votes-es && sha256sum -c generations/<id>/SHA256SUMS \
    && ln -sfn generations/<id> NEW_CURRENT && mv -T NEW_CURRENT CURRENT'
```

`mv -T` on a prepared symlink = atomic switch. If QA fails the generation
is never uploaded / never switched — the site keeps serving the previous
dataset.

## Image

`Dockerfile` builds SPA + API in one image (`votes-es:<version>` and
`votes-es:<sha>`). Non-root (uid 10001), `/api/v1/health` healthcheck,
no data/tests/dev caches inside. Load on the VPS via
`docker save votes-es:0.1.0 | ssh vps1 docker load` — or push to a registry
if one is configured for the project later.

## Failure mode

If a candidate generation fails `votes validate` → it is not published.
`CURRENT` keeps pointing at the last good generation; the site is never
down because of a data build.
