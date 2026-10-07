# votes-es — single-image build: web assets + Python API + gold data
FROM node:22-alpine AS web
WORKDIR /build
COPY web/package.json web/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM python:3.13-slim AS runtime
WORKDIR /app
RUN pip install --no-cache-dir uv==0.11.*
COPY pyproject.toml uv.lock* ./
COPY src/ src/
RUN uv pip install --system --no-cache .
COPY --from=web /build/dist web/dist
# data/gold/votes.duckdb is expected as a volume (built by the ingest job)
ENV VOTES_ES_DB=/data/gold/votes.duckdb
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "votes_es.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
