# Verity — Interview defense (90 seconds + deep dive)

## One-sentence pitch

Verity reconciles vendor invoices against contract obligations with **deterministic MCP tools**, then asks Claude only to write a **cited controller report** — scored by labeled fixtures and a separate report-faithfulness check.

## Architecture (honest)

```
Dashboard (Next.js / Vercel)
  → POST /api/reconcile  (fixture allowlist + timeout + Bearer to agent)
  → Agent (FastAPI / Railway)
       fixed LangGraph pipeline:
         extract_obligations → parse/reconcile invoices → Claude report
       MCP tools hold correctness; Claude formats only
  → UI: exceptions ↔ clause panel, detection evals, report faithfulness
```

**Not claimed:** multi-agent router, autonomous detection, live pgvector retrieval (next).

## What Claude does / does not do

| Does | Does not |
|------|----------|
| Write markdown report from structured JSON | Decide which invoices are exceptions |
| Cite `clause_ref` text already returned by tools | Replace keyword obligation extract (fixture-era) |

## Eval story

1. **Detection scorers** — recall/precision/section/dollar vs labeled fixtures (MCP path; CI; no Anthropic).
2. **Report faithfulness** — invoice IDs, sections, dollars in prose ⊆ structured output (synthetic in CI; live report on dashboard).

100% detection on fixtures is expected: labels match the rule engine. Faithfulness is the prose check.

## Known limits (say these first)

- Two fixture vendors; keyword/`extract_obligations` is fixture-era, not production NLP
- Postgres + pgvector in `infra/` is **optional / next spine**, not on the product path yet
- Demo auth is shared Bearer + fail-closed flag — not end-user identity
- Rate limit is in-process (coarse abuse resistance)

## 90-second spoken script

> Verity finds billing exceptions grounded in contract clauses. Correctness lives in deterministic MCP tools — fee caps, PO checks, term windows, duplicates — run against labeled fixtures with evals. A fixed LangGraph pipeline orchestrates those tools; Claude only writes the cited report. The dashboard shows dollars at risk, exception→clause linking, detection scores, and a separate report-faithfulness check so we don’t confuse rule quality with prose quality. Next up is wiring pgvector clause retrieval into report grounding — the compose stack is already there but unused on purpose until that lands.

## Attack questions → answers

| Attack | Answer |
|--------|--------|
| Where does the supervisor decide? | It doesn’t — fixed pipeline; we renamed away from supervisor theater. |
| Show pgvector query | Not shipped yet; Phase B. Infra is future-only until then. |
| Why 100% evals? | Labels = tool outputs by design; faithfulness is the separate signal. |
| Path traversal? | `resolve_readable_path` fixtures-only; unit-tested in CI. |
| Burn Anthropic budget? | Bearer auth + `AGENT_REQUIRE_API_KEY` + coarse rate limit + timeouts. |
| Claude down? | Structured exceptions still return; `report_error` set; stub report. |

## Prod smoke (auth)

Verified 2026-07-14:

- Agent: `https://agent-production-6901.up.railway.app`
- Web: `https://verity-navy-five.vercel.app`
- Unauthenticated `POST /reconcile` → 401
- Bearer + dashboard proxy → 200, 4 exceptions

```bash
# Expect 401 without Bearer when AGENT_REQUIRE_API_KEY=true
curl -i -X POST https://agent-production-6901.up.railway.app/reconcile \
  -H "Content-Type: application/json" \
  -d '{"fixture_id":"nextera-systems"}'
```
