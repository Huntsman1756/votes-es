# votes-es — single image: built SPA + Python API; gold data mounts at runtime.
FROM node:22-alpine AS web
WORKDIR /build
COPY web/package.json web/package-lock.json* ./
RUN npm ci --no-audit --no-fund 2>/dev/null || npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM python:3.13-slim AS runtime
WORKDIR /app
RUN pip install --no-cache-dir uv==0.11.*
COPY pyproject.toml uv.lock* ./
COPY src/ src/
RUN uv pip install --system --no-cache .
COPY --from=web /build/dist web/dist

RUN useradd --uid 10001 --create-home appuser \
    && mkdir -p /data && chown appuser /data
USER appuser

# dataset generations mount: /data/gold/votes.duckdb resolved via CURRENT
ENV VOTES_ES_DB=/data/gold/votes.duckdb \
    VOTES_PUBLISH_VOTE_SOURCES=sec_npx \
    PYTHONUNBUFFERED=1
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["python", "-c", "import urllib.request,sys;sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health',timeout=4).status==200 else 1)"]
CMD ["python", "-m", "uvicorn", "votes_es.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
