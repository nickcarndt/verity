# Verity — Project Spec

**Verity** — an autonomous invoice-reconciliation agent that grounds every flagged exception in the exact source contract clause. It establishes the truth of what's owed versus what's billed, with full provenance.

## What this is
A production multi-agent system that automates an enterprise financial-ops
workflow: invoice/contract-obligation reconciliation. It ingests a vendor
contract + a batch of invoices, extracts payment obligations and terms, flags
mismatches (overbilling, missing PO, out-of-term charges, duplicate invoices),
and produces an auditable, cited exception report a controller could act on.

## Why it exists (portfolio purpose)
Demonstrates production AI-engineering skill across the exact primitives top AI
companies screen for: multi-agent orchestration, a custom MCP server, a rigorous
eval harness, and full observability — dressed in a regulated enterprise domain
that flexes to fintech (Ramp), document intelligence (Hebbia/Harvey), and the
frontier-lab FDE loops (OpenAI/Anthropic).

## Architecture (high level)

**Two-service deployment model:** the agent and frontend are separate deployable services
that communicate over HTTP. LangGraph runs in Python (richer AI ecosystem, more mature
LangGraph); the UI runs on Vercel (Next.js). This mirrors real production FDE systems
where the agent is a containerized API, not bundled into the web app.

- **Agent service** (`/services/agent`): LangGraph graph wrapped in FastAPI from day one.
  Deployed separately (Railway, Render, or Modal). Exposes HTTP endpoints the frontend calls.
- **Frontend** (`/apps/web`): Next.js on Vercel. Calls the agent API over HTTP.
- A custom MCP server exposes the tools the agent calls (parse, extract, reconcile, flag, audit).
- Postgres + pgvector stores contract-clause embeddings for grounding/citation.
- Braintrust captures traces on every run and runs the eval harness.
- The Next.js frontend shows a streaming chat + an exception dashboard with clickable traces.

## Core capabilities (what "done" looks like)
1. Ingest a contract + invoices.
2. Extract obligations/terms from the contract (with source-clause references).
3. Parse each invoice into structured line items.
4. Reconcile invoices against obligations; detect: overbilling, missing PO,
   out-of-term charges, duplicate invoices.
5. Produce a cited exception report (each flag links to the exact contract clause).
6. Every run is traced; the system is evaluated against a labeled fixture set.

## MCP tools to expose
- parse_invoice(file) -> structured line items
- extract_obligations(contract) -> obligations with clause references
- reconcile(invoice, obligations) -> matches + mismatches
- flag_exceptions(reconciliation) -> typed exceptions with severity
- write_audit_record(exception) -> persisted audit trail

## Repo structure
/apps/web            # Next.js frontend (Vercel)
/services/agent      # LangGraph graph + FastAPI HTTP service
/services/mcp        # custom MCP server (tools, schemas)
/packages/evals      # Braintrust datasets, scorers, experiments
/packages/shared     # shared types/schemas/prompts
/data/fixtures       # synthetic contracts + invoices
/infra               # docker-compose (postgres+pgvector), env
/docs                # this spec, notes, learning log

## Build phases
- Phase 1 (Day 1): Skeleton — repo structure, docker-compose w/ postgres+pgvector,
  one-node LangGraph graph (FastAPI-wrapped, API-ready) making a single Claude call,
  bare Next.js app deployed to Vercel (frontend calls agent over HTTP when wired).
- Phase 2 (Day 2): Synthetic fixtures + shared schemas.
- Phase 3 (Day 3): MCP server with 3 working tools.
- Phase 4 (Day 4): Agent graph calls MCP tools end-to-end on one fixture.
- Phase 5 (Day 5): Braintrust tracing wired in; skeleton deployed live.
(Later phases: eval harness, multi-agent split, frontend dashboard, citations, eval report.)

## Out of scope (for now)
Real OCR of scanned PDFs, real accounting-system integrations, auth/multi-tenancy.
Keep it demo-grade but production-patterned.
