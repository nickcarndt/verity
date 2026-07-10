# Deploy checklist

Quick copy-paste sequence. Full details in [`DEPLOY.md`](./DEPLOY.md).

## Prerequisites

- [ ] [Railway](https://railway.app) account
- [ ] [Vercel](https://vercel.com) account (CLI: `vercel login`)
- [ ] `ANTHROPIC_API_KEY`
- [ ] `BRAINTRUST_API_KEY` (optional — enables trace links in UI)

## 1. Railway — MCP service

- [ ] New project → Deploy from GitHub → `nickcarndt/verity`
- [ ] Service settings:
  - Root: repo root
  - Dockerfile: `services/mcp/Dockerfile`
  - Config: `services/mcp/railway.toml`
- [ ] Env vars:
  ```
  MCP_HOST=0.0.0.0
  MCP_PORT=8001
  VERITY_REPO_ROOT=/app
  ```
- [ ] Generate public domain → note URL: `https://<mcp>.up.railway.app/mcp`

## 2. Railway — Agent service

- [ ] Add second service from same repo
  - Dockerfile: `services/agent/Dockerfile`
  - Config: `services/agent/railway.toml`
- [ ] Env vars:
  ```
  ANTHROPIC_API_KEY=<key>
  MCP_SERVER_URL=https://<mcp-service>/mcp
  BRAINTRUST_API_KEY=<key>
  BRAINTRUST_PROJECT=verity
  AGENT_HOST=0.0.0.0
  AGENT_PORT=8000
  VERITY_REPO_ROOT=/app
  ```
- [ ] Generate public domain → note URL: `https://<agent>.up.railway.app`
- [ ] Smoke test:
  ```bash
  curl https://<agent>/health
  curl -X POST https://<agent>/reconcile \
    -H "Content-Type: application/json" \
    -d '{"fixture_id": "nextera-systems"}'
  ```

## 3. Vercel — Frontend

- [ ] Import `nickcarndt/verity` on Vercel
- [ ] Root directory: `apps/web`
- [ ] Env var:
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
