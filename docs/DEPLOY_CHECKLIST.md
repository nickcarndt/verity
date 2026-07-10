# Deploy checklist

Quick copy-paste sequence. Full details in [`DEPLOY.md`](./DEPLOY.md).

## Prerequisites

- [ ] [Railway](https://railway.app) account
- [ ] [Vercel](https://vercel.com) account (CLI: `vercel login`)
- [ ] `ANTHROPIC_API_KEY`
- [ ] `BRAINTRUST_API_KEY` (optional — enables trace links in UI)

## 1. Railway — MCP service

Open [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo** → select `nickcarndt/verity`.

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
  ```
- [ ] **Generate domain** for agent → copy base URL (no path):
  - Example: `https://verity-agent-production.up.railway.app`
- [ ] Smoke test (replace with your URL):
  ```bash
  curl https://<agent>/health
  curl -X POST https://<agent>/reconcile \
    -H "Content-Type: application/json" \
    -d '{"fixture_id": "nextera-systems"}'
  ```

## 3. Vercel — Frontend

- [ ] [vercel.com/new](https://vercel.com/new) → Import `nickcarndt/verity`
- [ ] **Root directory:** click Edit → set to `apps/web`
- [ ] **Environment variables:**
  ```
  AGENT_API_URL=https://<agent>.up.railway.app
  ```
- [ ] Deploy
- [ ] Smoke test: open `https://<vercel-app>/app` → Run reconciliation

## 4. Verify end-to-end

- [ ] Dashboard shows 4 exceptions for Nextera
- [ ] Braintrust link appears in run summary (if tracing enabled)
- [ ] Keyboard nav works (↑↓ Enter Esc)
- [ ] Eval report shows all scorers passed
