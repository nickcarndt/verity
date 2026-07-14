# Verity — Project Spec

**Verity** — clause-grounded invoice reconciliation that flags billing exceptions and cites the exact source contract clause. It establishes the truth of what's owed versus what's billed, with full provenance.

## What this is
A demo-grade but production-patterned financial-ops workflow: invoice/contract-obligation
reconciliation. It loads a vendor contract + a batch of invoices, extracts payment
obligations and terms with deterministic tools, flags mismatches (overbilling, missing PO,
out-of-term charges, duplicate invoices), and produces an auditable, cited exception report
a controller could act on.

Correctness lives in MCP tools. Claude writes the narrative report only. A LangGraph
pipeline orchestrates the stages for tracing — it is a fixed extract → reconcile → report
flow, not an LLM router.

## Why it exists (portfolio purpose)
Demonstrates production AI-engineering skill across primitives top AI companies screen for:
tool-backed agents, a custom MCP server, a rigorous eval harness, and observability — in a
regulated enterprise domain (fintech / document intelligence / FDE loops).

## Architecture (high level)

**Two-service deployment model:** the agent and frontend are separate deployable services
that communicate over HTTP. LangGraph runs in Python; the UI runs on Vercel (Next.js).

- **Agent service** (`/services/agent`): LangGraph pipeline wrapped in FastAPI.
  Deployed separately (Railway, Render, or Modal). Exposes HTTP endpoints the frontend calls.
- **Frontend** (`/apps/web`): Next.js on Vercel. Calls the agent API over HTTP.
- A custom MCP server exposes deterministic tools (`parse_invoice`, `extract_obligations`, `reconcile`).
- Braintrust captures traces on every run; `packages/evals` scores detection against labeled fixtures.
- The Next.js frontend shows an exception dashboard with clause grounding, eval report, and pipeline trace.

**Future (not in the current product path):** Postgres + pgvector for clause embeddings / retrieval;
audit persistence; auth beyond a shared agent API key.

## Core capabilities (what "done" looks like)
1. Load a contract + invoices (labeled fixtures today).
2. Extract obligations/terms from the contract (with source-clause references).
3. Parse each invoice into structured line items.
4. Reconcile invoices against obligations; detect: overbilling, missing PO,
   out-of-term charges, duplicate invoices.
5. Produce a cited exception report (each flag links to the exact contract clause).
6. Every run is traced; the system is evaluated against a labeled fixture set.

## MCP tools
- `parse_invoice(file)` → structured line items
- `extract_obligations(contract)` → obligations with clause references
- `reconcile(invoice, obligations)` → matches + exceptions

## Repo structure
```
/apps/web            # Next.js frontend (Vercel)
/services/agent      # LangGraph pipeline + FastAPI HTTP service
/services/mcp        # custom MCP server (tools, schemas)
/packages/evals      # Braintrust datasets, scorers, experiments
/packages/shared     # shared types/schemas
/data/fixtures       # synthetic contracts + invoices
/infra               # docker-compose (postgres+pgvector, future), env
/docs                # this spec, notes, learning log
```

## Build phases
- Phase 1: Skeleton — repo structure, docker-compose, FastAPI-wrapped LangGraph, bare Next.js.
- Phase 2: Synthetic fixtures + shared schemas.
- Phase 3: MCP server with 3 working tools.
- Phase 4: Agent pipeline calls MCP tools end-to-end on fixtures + Claude report.
- Phase 5: Braintrust tracing + deploy.
- Later: eval harness, dashboard, citations, eval report UI.

## Out of scope (for now)
Real OCR of scanned PDFs, real accounting-system integrations, full auth/multi-tenancy,
vector retrieval. Keep it demo-grade but production-patterned.
