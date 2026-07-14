# Verity

Clause-grounded invoice reconciliation for vendor agreements.

Deterministic MCP tools flag overbilling, missing POs, out-of-term charges, and
duplicates against labeled fixtures. A LangGraph pipeline orchestrates those tools
and asks Claude only to write the controller-facing cited report. Braintrust traces
each run; an eval harness scores detection quality.

## Architecture

Monorepo with two deployable services:

- **`/apps/web`** — Next.js frontend (Vercel)
- **`/services/agent`** — LangGraph reconcile pipeline wrapped in FastAPI (Railway / Render / Modal)
- **`/services/mcp`** — Custom MCP server for agent tools
- **`/infra`** — Docker Compose for local Postgres + pgvector (**future** — not used by the current product path)

See [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) for the full blueprint and build phases.

## Local development

Copy env template when wiring services:

```bash
cp infra/.env.example infra/.env   # add ANTHROPIC_API_KEY locally
```

Optional (not required for reconcile / dashboard):

```bash
cd infra
docker compose up -d   # Postgres + pgvector for future retrieval work
```

### Shared schemas + fixtures (Phase 2)

```bash
cd packages/shared
python3 -m venv .venv && source .venv/bin/activate
pip install -e .
python -c "from shared.fixtures import load_fixture; print(load_fixture('nextera-systems').manifest.name)"
```

Fixtures live in `data/fixtures/` — see [`data/fixtures/README.md`](data/fixtures/README.md).

### MCP server (Phase 3)

```bash
cd services/mcp
python3 -m venv .venv && source .venv/bin/activate
pip install -e ../../packages/shared
pip install "mcp>=1.28.0" "pydantic>=2.0" "pydantic-settings>=2.0"
pip install --no-deps -e .
python -m mcp_server.main
```

MCP endpoint: `http://localhost:8001/mcp`

Verify tools against fixtures (from repo root, with the venv active):

```bash
python services/mcp/scripts/verify_tools.py
```

Tools exposed: `parse_invoice`, `extract_obligations`, `reconcile`

`extract_obligations` is fixture-era keyword extraction over clause text — deterministic for evals, not production NLP.

### Agent service (Phase 4)

Requires MCP server running on port 8001.

```bash
cd services/agent
python3 -m venv .venv && source .venv/bin/activate
pip install -e ../../packages/shared
pip install -e .
python -m agent.main
```

Health check: `curl http://localhost:8000/health`

End-to-end reconciliation (calls MCP tools on a fixture, then Claude writes the report):

```bash
curl -X POST http://localhost:8000/reconcile \
  -H "Content-Type: application/json" \
  -d '{"fixture_id": "nextera-systems"}'
```

Verify reconcile graph:

```bash
python scripts/verify_reconcile.py
```

### Braintrust tracing + deploy (Phase 5)

Set `BRAINTRUST_API_KEY` in `infra/.env` to enable tracing. Every `/reconcile` run logs spans to the configured Braintrust project (LangGraph nodes, Claude calls, MCP tool calls).

Deploy: see [`docs/DEPLOY.md`](docs/DEPLOY.md) for Railway Docker deployment of both services.

```bash
# Optional: build and smoke-test containers locally
docker build -f services/mcp/Dockerfile -t verity-mcp .
docker build -f services/agent/Dockerfile -t verity-agent .
```

### Eval harness

```bash
cd packages/evals
python3 -m venv .venv && source .venv/bin/activate
pip install -e ../../packages/shared && pip install "mcp>=1.28.0" "pydantic>=2.0" \
  && pip install --no-deps -e ../../services/mcp && pip install --no-deps -e .
python scripts/run_local.py   # no Braintrust API key needed
```

See [`packages/evals/README.md`](packages/evals/README.md) for Braintrust upload.

### Frontend dashboard

```bash
cd apps/web
cp .env.example .env.local   # AGENT_API_URL=http://localhost:8000
npm install
npm run dev
```

Open `http://localhost:3000` — run reconciliation on the dashboard for Nextera Systems or Harbor Analytics.
