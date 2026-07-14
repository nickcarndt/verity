# Learning Log

Decisions, tradeoffs, and interview-ready narratives captured as we build.

---

## Day 1 — Two-service architecture

Chose two-service architecture (Python FastAPI agent + Next.js frontend over HTTP) because LangGraph's Python ecosystem is more mature and it mirrors real production FDE systems where the agent is a deployable service, not bundled into the web app.

## Day 1 — Phase 1 complete

Agent skeleton: single-node LangGraph graph wrapped in FastAPI, reading `ANTHROPIC_API_KEY` from `infra/.env`. Default model updated to `claude-sonnet-4-6` after `claude-sonnet-4-20250514` retirement.

## Day 2 — Shared schemas + fixtures

Defined the domain model in `packages/shared` (Pydantic for Python, Zod mirror for TypeScript) covering contracts, obligations, invoices, reconciliation results, and audit records. Chose explicit `ExceptionType` and `Severity` enums so MCP tools and the eval harness share a single vocabulary.

Created the `nextera-systems` fixture: one compliant invoice plus four labeled exceptions (overbilling, missing PO, out-of-term, duplicate). Label files (`expected_obligations.json`, `expected_exceptions.json`) are ground truth for Braintrust evals in later phases — we build them now so Phase 4 has something to score against.

## Day 3 — Phase 3 complete

Built `/services/mcp` with the official Python MCP SDK and Streamable HTTP transport (`stateless_http=True`, `json_response=True` for horizontal scaling). Three deterministic tools:

- `parse_invoice` — validates fixture JSON against the shared `Invoice` schema
- `extract_obligations` — keyword-based clause extraction (eval-friendly, swappable for LLM later)
- `reconcile` — checks fee cap, PO requirement, term window, and duplicate invoice number

Chose rule-based extraction over LLM for Phase 3 so tools are fast, free, and produce consistent output for the eval harness. Path inputs are validated against repo boundaries since tool args are untrusted.

## Day 4 — Phase 4 complete

Wired the LangGraph agent to call MCP tools end-to-end via a dedicated reconcile graph:

`setup_fixture → extract_obligations → reconcile_invoices → generate_report`

The first three nodes are deterministic MCP calls over Streamable HTTP; Claude only formats the final cited exception report from structured tool output. This split keeps reconciliation logic testable and eval-friendly while still demonstrating LLM + tools together.

Added `POST /reconcile` returning structured exceptions plus a markdown report. MCP list-return payloads come back in `structuredContent.result` (not `content[0].text`) — the client wrapper handles both shapes.

## Day 5 — Phase 5 complete

Wired Braintrust tracing into the agent service:

- Top-level spans on `/reconcile` (later: Braintrust auto-instrumentation)
- Graceful no-op when `BRAINTRUST_API_KEY` is unset (local dev without an account)

Added deployment skeleton: Dockerfiles for agent + MCP (monorepo-aware, bundles fixtures), Railway configs, and `docs/DEPLOY.md`. Two-service deploy order: MCP first, then agent with `MCP_SERVER_URL` pointing at it.

## Day 6 — Eval harness

Built `packages/evals` with a Braintrust `Eval()` experiment scoring MCP reconcile output against labeled fixtures. Four deterministic scorers: exception recall/precision, clause section accuracy, dollar impact accuracy.

Chose in-process MCP tool execution (not HTTP) for evals — deterministic, no running services required, CI-friendly. Braintrust upload is optional; `--local` mode runs scorers and exits non-zero on failure.

## Day 7 — Frontend dashboard

Built `/apps/web` — Next.js App Router dashboard calling the agent over HTTP via a Next.js API proxy (`/api/reconcile` → agent `POST /reconcile`).

UI includes exception table with severity badges, dollar-impact summary cards, clickable clause citation drawer, loading/empty/error states, and the Claude markdown report. Uses shared Zod schemas for response validation.

## Day 8 — Pipeline trace drawer

Added pipeline trace drawer — shows LangGraph stage execution (extract → reconcile → report) and per-invoice status after a reconciliation run.

*(Streaming sidebar chat was added here historically, then removed — ungrounded chat contradicted the product positioning.)*

## Day 9 — Specialist pipeline split

Split the linear reconcile graph into three specialist subgraphs in a **fixed** pipeline:

- **Contract stage** — fixture setup + obligation extraction (MCP)
- **Reconciliation stage** — invoice parse + reconcile (MCP)
- **Report stage** — Claude cited exception report

Each specialist is a compiled LangGraph subgraph (nested spans in Braintrust). `agent_trace` in state feeds the frontend pipeline trace drawer. There is no LLM router — edges are fixed.

## Day 10 — Citations polish + eval report UI

Added contract citation panel and in-dashboard eval scoring:

- **Contract panel** — full Nextera agreement with cited clauses highlighted; click a clause ref in the exception table or panel to cross-highlight
- **Eval report** — TypeScript port of the four Braintrust scorers (recall, precision, clause citation, dollar impact); auto-runs after reconciliation against bundled `expected_exceptions.json`
- **Report view** — lightweight markdown rendering instead of raw `<pre>`

Fixture labels are bundled in `apps/web/src/data/nextera-systems/` so eval works on Vercel without monorepo filesystem access.

## Day 11 — Design system (DESIGN_SPEC)

Adopted `docs/DESIGN_SPEC.md` across the product UI:

- Warm off-white palette with deep-green accent (`#0B6E4F`) and semantic severity tokens — no raw slate/zinc defaults
- Geist + tabular numerics on dollar amounts and invoice IDs
- 6px card radius, hairline borders, no glassmorphism or decorative shadows
- Exception table rebuilt with TanStack Table — sortable headers, zebra rows, vendor/status columns, severity-colored $ impact
- Pipeline step indicator + table skeleton loaders during reconciliation (no spinners)
- Clause drawer uses left-border citation treatment for authoritative grounding

## Day 12 — Product UI refinement (pass 2)

Tightened dashboard density and trace authority per DESIGN_SPEC §2.5:

- **Exception drawer** — agent reasoning timeline + highlighted source clause (the core value-prop moment)
- **Metric cards** — count-up animation on reconcile complete; run summary bar with real totals
- **Exception table** — severity filter chips, selected-row highlight, sticky header, footer with at-risk total
- **Exception type badges** — semantic colors (overbilling/out-of-term → critical, missing PO → warning, duplicate → info)
- **Eval report** — skeleton loaders while scoring
- **Shared primitives** — `SectionHeading`, `MetaLabel`, `AgentTraceTimeline`, `MetricCard`

## Day 13 — Keyboard navigation

Exception table keyboard workflow per DESIGN_SPEC power-user pattern:

- **↑↓** — move focus through visible (sorted/filtered) rows
- **Enter** — open trace drawer for focused row
- **Esc** — close drawer; focus stays on row
- **Focused row** — subtle left accent border in brand green (not heavy ring highlight)
- Drawer stays in sync when navigating with arrows while open
- Keyboard hints shown in table chrome (`↑↓ navigate · Enter open · Esc close`)

## Day 14 — Braintrust trace links + Vercel deploy

- Agent `/reconcile` returns `braintrust_trace_url` via `span.permalink()` when tracing is enabled
- Dashboard run summary + pipeline drawer link to the full Braintrust span hierarchy
- `/health` exposes `tracing_enabled` for ops visibility
- Vercel deploy docs + monorepo-aware `vercel.json` install command for `@verity/shared`

## Day 15 — Landing page + harbor-analytics fixture

- **Landing page** at `/` — marketing surface per DESIGN_SPEC §3 (hero, proof moment with real $29,450 stats, how-it-works, architecture credibility, CTA)
- **Product dashboard** moved to `/app` — separates marketing wow from product restraint
- **`harbor-analytics` fixture** — second vendor scenario ($15k cap, 4 labeled exceptions) added to eval dataset
- **`DEPLOY_CHECKLIST.md`** — copy-paste Railway → Vercel deploy sequence

## Day 16 — Fixture picker

Dashboard fixture switcher for Nextera Systems and Harbor Analytics:

- Segmented control in dashboard header — switching fixtures clears prior run state
- Contract panel, eval report, and exception drawer load per-fixture contract + labels
- `/api/eval` and `/api/contract` accept `fixture_id`

## Day 17 — Honesty pass (pipeline naming + chat removal)

Portfolio audit cleanup:

- Removed ungrounded Agent Chat UI + `/api/chat` + agent `/invoke` endpoints
- Renamed supervisor framing → fixed `build_reconcile_pipeline` (no fabricated plan span)
- Docs/README/SPEC aligned: deterministic tools + Claude report; pgvector marked future
- Braintrust UI is a non-link “traced” badge (permalinks aren’t publicly readable)
