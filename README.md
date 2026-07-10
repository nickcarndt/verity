# Verity

An autonomous invoice-reconciliation agent that grounds every flagged exception in the exact source contract clause.

## Architecture

Monorepo with two deployable services:

- **`/apps/web`** — Next.js frontend (Vercel)
- **`/services/agent`** — LangGraph agent wrapped in FastAPI (Railway / Render / Modal)
- **`/services/mcp`** — Custom MCP server for agent tools
- **`/infra`** — Docker Compose (Postgres + pgvector)

See [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) for the full blueprint and build phases.

## Local development

Start Postgres + pgvector:

```bash
cd infra
docker compose up -d
```

Copy env template when wiring services:

```bash
cp infra/.env.example infra/.env   # add ANTHROPIC_API_KEY locally
```
