# Deploy checklist

Quick copy-paste sequence. Full details in [`DEPLOY.md`](./DEPLOY.md).

## Prerequisites

- [ ] [Railway](https://railway.app) account
- [ ] [Vercel](https://vercel.com) account (CLI: `vercel login`)
- [ ] `ANTHROPIC_API_KEY`
- [ ] `BRAINTRUST_API_KEY` (optional — enables trace links in UI)

## 1. Railway — MCP service

Open [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo** → select `nickarndt/verity` (or your fork).

- [ ] **New service** → Settings:
  - **Root directory:** leave as repo root (`.`)
  - **Builder:** Dockerfile
  - **Dockerfile path:** `services/mcp/Dockerfile`
  - Or paste `services/mcp/railway.toml` if Railway detects it
- [ ] **Variables** tab → add:
  ```
  MCP_HOST=0.0.0.0
  MCP_PORT=8001
  VERITY_REPO_ROOT=/app
  ```
- [ ] **Settings → Networking → Generate domain** → copy URL, append `/mcp`:
  - Example: `https://verity-mcp-production.up.railway.app/mcp`

## 2. Railway — Agent service

- [ ] In the **same Railway project**, click **+ New** → **GitHub Repo** → same `verity` repo again (second service)
- [ ] Service settings:
  - **Dockerfile path:** `services/agent/Dockerfile`
- [ ] **Variables** tab → add:
  ```
  ANTHROPIC_API_KEY=<key>
  MCP_SERVER_URL=https://<mcp-service>/mcp
  BRAINTRUST_API_KEY=<key>
  BRAINTRUST_PROJECT=verity
  AGENT_HOST=0.0.0.0
  AGENT_PORT=8000
  VERITY_REPO_ROOT=/app
  AGENT_API_KEY=<shared-secret>
  AGENT_REQUIRE_API_KEY=true
  ```
- [ ] **Generate domain** for agent → copy base URL (no path):
  - Example: `https://verity-agent-production.up.railway.app`
- [ ] Smoke test (replace with your URL):
  ```bash
  curl https://<agent>/health
  # Expect 401 without Bearer when AGENT_REQUIRE_API_KEY=true
  curl -X POST https://<agent>/reconcile \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer <shared-secret>" \
    -d '{"fixture_id": "nextera-systems"}'
  ```

## 3. Vercel — Frontend

- [ ] [vercel.com/new](https://vercel.com/new) → Import `nickcarndt/verity`
- [ ] **Root directory:** click Edit → set to `apps/web`
- [ ] **Environment variables:**
  ```
  AGENT_API_URL=https://<agent>.up.railway.app
  AGENT_API_KEY=<same-shared-secret-as-agent>
  ```
- [ ] Deploy
- [ ] Smoke test: open `https://<vercel-app>/app` → Run reconciliation

## 4. Verify end-to-end

- [ ] Dashboard shows 4 exceptions for Nextera
- [ ] Braintrust link appears in run summary (if tracing enabled)
- [ ] Keyboard nav works (↑↓ Enter Esc)
- [ ] Eval report shows all scorers passed
- [ ] Report faithfulness card scores the written report separately

## 5. Prod auth verified (Phase A)

Verified 2026-07-14 against `agent-production-6901.up.railway.app` + `verity-navy-five.vercel.app`:

- [x] Railway agent has `AGENT_API_KEY` + `AGENT_REQUIRE_API_KEY=true`
- [x] Vercel has matching `AGENT_API_KEY` + `AGENT_API_URL` (server-side)
- [x] Unauthenticated `POST /reconcile` → **401**
- [x] Authenticated curl with Bearer → **200** (4 exceptions)
- [x] Dashboard proxy `/api/reconcile` → **200**
- [x] `GET /health` → `tracing_enabled: true` when Braintrust key is set
