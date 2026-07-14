# Verity — Staff Engineer Portfolio Audit

**Audience:** A skeptical staff engineer at Ramp (or equivalent) deciding whether to advance an FDE / Applied AI candidate.  
**Scope:** Entire repository as of 2026-07-14 (includes uncommitted chat-removal WIP).  
**Method:** Source read end-to-end — not README-only.

---

## Verdict (read this first)

| | |
|--|--|
| **Grade** | **B−** |
| **Helps or hurts?** | **Helps if you own the honest story. Hurts if you pitch the README/spec story.** |
| **One-line** | A real, eval-backed deterministic reconcile engine dressed in multi-agent marketing, with a serious product UI and several demo-theater tells a staff interviewer will find in under 15 minutes. |

**Single biggest doubt trigger:** Calling a fixed `START → A → B → C → END` graph a “supervisor-routed multi-agent system,” then fabricating a supervisor “plan” span after the fact in `finalize_trace`. That is the tell that either (a) you don’t know what multi-agent means, or (b) you optimized for LinkedIn copy over engineering honesty. Either is fatal in a live whiteboard defense.

---

## 1. First impression (30-second skim)

### What they open first
1. `README.md`
2. Top-level tree (`apps/`, `services/`, `packages/`, `infra/`, `docs/`)
3. `docs/PROJECT_SPEC.md` (portfolio purpose names Ramp/Hebbia/OpenAI by name — bold and risky)
4. Maybe the landing page if deployed

### What they conclude in 30 seconds

**Positive signals (serious engineer):**
- Real monorepo with deployable boundaries (web / agent / MCP), not a single Next.js toy.
- `packages/evals` + labeled fixtures under `data/fixtures/` — this is the strongest first-glance tell. Most AI portfolios have zero ground truth.
- `infra/` with Postgres+pgvector implies systems thinking (even if unused — see below).
- Design tokens in `apps/web/src/app/globals.css` look intentional, not default shadcn purple.

**Negative signals (tutorial follower / AI-assisted portfolio):**
- README still documents `/invoke` freeform chat and “chat with the agent in the sidebar” (lines 74–80, 129) after chat was deleted. Stale docs = iterate-with-AI-without-cleanup.
- Spec claims “production multi-agent system,” “streaming chat,” “pgvector stores contract-clause embeddings,” and MCP tools `flag_exceptions` / `write_audit_record` that **do not exist** (`docs/PROJECT_SPEC.md:6–32, 43–48`).
- Opening sentence of README: “autonomous invoice-reconciliation agent.” Autonomy is oversold — detection is a rule engine.
- Learning log reads like an interview script (`docs/learning-log.md`). Staff engineers recognize this genre immediately; it’s not always bad, but it raises the bar for every claim inside it.
- Only ~6 commits from skeleton → “end-to-end.” Either you moved very fast (impressive) or large chunks landed as AI-generated blobs (suspicious). You will be asked which.

**30-second verdict:** “Competent AI portfolio demo with production *shapes*. Claims ahead of implementation. Dig into the reconcile path — if that’s real, keep talking; if the supervisor is fake, kill.”

---

## 2. Architecture assessment

### End-to-end reality

```
Browser Dashboard
  → POST /api/reconcile  (Next.js zod: fixture_id)
  → POST {AGENT}/reconcile  (FastAPI)
  → LangGraph linear pipeline:
       contract_agent → reconciliation_agent → report_agent → finalize_trace
         │                    │                     │
         │                    │                     └─ Claude (markdown only)
         │                    └─ MCP: parse_invoice × N, reconcile × N
         └─ MCP: extract_obligations
  → UI: exception table, clause panel, eval report, “agent trace”
```

**LLM is not in the detection loop.** Exceptions come from Python rules in `services/mcp/mcp_server/tools/reconcile.py`. Claude formats a report in `services/agent/agent/agents/report_agent.py`. That separation is *good engineering* — if you claim it honestly.

### Coherent or accidental?

**Coherent core:**
- Deterministic tools behind MCP → eval-friendly.
- Shared Pydantic domain models in `packages/shared`.
- Agent as separate FastAPI service (correct FDE pattern).
- Frontend never holds Anthropic keys (proxy via `/api/reconcile`).

**Accidental / aspirational scaffolding:**
- Postgres + pgvector in `infra/` with **zero application reads/writes**. Extension created; never used. Spec still claims embeddings for grounding.
- `packages/shared/shared/audit.py` (`AuditRecord`) — unused.
- `services/agent/agent/nodes/` — empty package.
- Spec lists MCP tools that were never built.
- Chat stack removed from code; docs still advertise it.

### Design mistakes / smells

#### Smell A — Multi-agent theater (critical)

```15:48:services/agent/agent/agents/supervisor.py
def finalize_trace(state: ReconcileState) -> dict[str, object]:
    """Emit a clean multi-agent trace after all specialists complete."""
    ...
            trace_entry(
                "supervisor",
                "plan",
                "Routed contract_agent → reconciliation_agent → report_agent",
            ),
```

```67:72:services/agent/agent/agents/supervisor.py
    graph.add_edge(START, "contract_agent")
    graph.add_edge("contract_agent", "reconciliation_agent")
    graph.add_edge("reconciliation_agent", "report_agent")
    graph.add_edge("report_agent", "finalize_trace")
    graph.add_edge("finalize_trace", END)
```

There is no router, no conditional edge, no tool choice, no handoff protocol. The “plan” is written *after* execution. The UI then labels this “Supervisor-routed” / “Agent reasoning.” An interviewer will open this file first after hearing “multi-agent.”

**What you should have written instead (honest naming):**

```python
def build_reconcile_pipeline() -> CompiledStateGraph:
    """Fixed pipeline: extract → reconcile → report → summarize trace."""
    ...
```

Or implement a real supervisor (LLM/router decides whether to re-extract, skip report, escalate) — only if you have a reason beyond the word “agent.”

#### Smell B — Schema boundary collapse

Shared models exist, then the agent HTTP layer throws them away:

```python
# services/agent/agent/schemas.py
exceptions: list[dict[str, object]]
reconciliation_results: list[dict[str, object]]
```

Meanwhile the web redefines Zod schemas in `apps/web/src/lib/agent.ts`, and `packages/shared/ts` is unused. Three schema sources, zero codegen. Drift is inevitable.

#### Smell C — Fixture / eval duplication

| Truth | Copy |
|-------|------|
| `data/fixtures/*/…` | `apps/web/src/data/*/…` (contracts + expected exceptions) |
| `packages/evals/evals/scorers.py` | `apps/web/src/lib/eval.ts` |
| Agent reconcile loop | `packages/evals/evals/tasks.py` (reimplements MCP loop, skips Claude) |

#### Smell D — Demo wearing production clothes

| Production shape | Demo reality |
|------------------|--------------|
| Separate services + Docker | Yes |
| Healthcheck on agent | Yes |
| Auth / rate limits | **None** |
| Retries / timeouts on LLM & MCP | **None** |
| CI | **None** (no `.github/`) |
| Observability that tells the truth | Partial — `tracing_enabled` always true after bootstrap |
| Braintrust deep links | Intentionally disabled (good honesty) but badge still implies live integration |

### What I would architect differently

1. **Name the system a pipeline with an LLM reporter**, not a multi-agent supervisor — unless you add real routing.
2. **One schema package** consumed by Python + generated TS (or OpenAPI from FastAPI → Zod).
3. **Fixtures as the only data source** — web fetches contract via API; don’t duplicate JSON into the Next bundle for the product path.
4. **Either use pgvector or delete it** from the tree and the pitch. Scaffold that never ships is a resume smell.
5. **Auth the agent** (even a shared bearer for the demo deploy) before claiming production patterning.
6. **Stream real graph events** to the UI instead of a 2200ms fake progress timer.

---

## 3. Code smells & hygiene

### Dead / stale

| Item | Evidence |
|------|----------|
| Chat docs in README | `README.md:74-80, 129` — `/invoke`, sidebar chat |
| PROJECT_SPEC tools/features | `flag_exceptions`, `write_audit_record`, streaming chat, pgvector grounding |
| `AuditRecord` | `packages/shared/shared/audit.py` — never used |
| Empty `agent/nodes/` | placeholder package |
| `/api/contract` | `apps/web/src/app/api/contract/route.ts` — zero callers |
| `@radix-ui/react-separator` | in `package.json`, never imported |
| `packages/shared/ts` | not depended on by web |
| Braintrust settings unused | `braintrust_api_key` / `braintrust_project` in config; `init_logger(project="Verity")` hardcodes name |

### Duplicated logic
- Exception scorers: Python ↔ TypeScript (byte-for-byte conceptual clone).
- Path construction for fixtures duplicated in agent agents and eval tasks.
- Exception UI severity maps vs backend enums — parallel vocabularies.

### Magic / hardcoding
- Progress step interval `2200` ms — `apps/web/src/components/reconcile-progress.tsx:28-30`.
- Report prompt inline — `report_agent.py:15-26`.
- Model default `claude-sonnet-4-6` in config — fine as default, unjustified in docs.
- Exception IDs `exc-overbilling-{invoice.id}` — collide if multiple fee-cap obligations fire (`reconcile.py:32`).
- Empty-state copy hardcodes “5 invoices” in exception table.
- Landing proof stats hardcoded to Nextera (`$29,450`) while Harbor exists.

### Typing weaknesses
- Agent state/HTTP: `dict[str, object]` bags.
- Web fixture imports: `as FixtureContract` casts, no Zod parse at boundary (`fixtures.ts`).
- `dollar_impact` as string + `parseFloat` without NaN guards.
- `AgentTraceEvent.status: z.string()` unconstrained.

### AI-generated / unreviewed tells
1. Capability inflation language (“autonomous,” “supervisor-routed,” “Agent reasoning”) over a linear pipeline.
2. Learning log that still describes deleted streaming chat.
3. DESIGN_SPEC written as an anti-slop prompt to Claude — good intent; the landing still ships the classic 3-feature-card SaaS template.
4. Warm cream background `#FAFAF8` / `#F4F4F1` — intentional per design system, but sits near the common AI-portfolio cream cluster; the green accent saves it *if* the product UI is shown first.
5. Spec naming target companies — reads as resume SEO. Prefer letting the work imply the fit.
6. Fabricated supervisor plan span — the strongest “AI wrote the narrative layer” tell in the repo.

### What’s *not* AI slop
- `reconcile_invoice` is clear, typed, and defendable.
- Labeled fixtures with expected exceptions are real work.
- Exception table + clause cross-highlight is product thinking, not template.
- Eval scorers measure the right things for the deterministic core.

---

## 4. Robustness & error handling

### Unhappy paths

| Failure | Behavior today | Severity |
|---------|----------------|----------|
| Agent down | Next returns 503 with hardcoded “port 8000” message | Medium — wrong message if `AGENT_API_URL` differs |
| MCP down | `RuntimeError` → 503 | OK |
| Bad `fixture_id` | Agent accepts any string; may path-probe / 500 | **High** |
| Malformed MCP JSON | Unguarded `json.loads` in mcp_client | High |
| One bad invoice mid-batch | Entire reconcile fails — no per-invoice isolation | Medium |
| Claude timeout / rate limit | Uncaught → 500 | **High** |
| Empty exceptions | Report still called; eval recall/precision edge cases return 1.0 | Low |
| Corrupt fixture JSON in web bundle | Cast succeeds; UI breaks later | Medium |

### Missing production primitives
- No HTTP timeouts on agent→MCP or Next→agent.
- No retries with backoff.
- No circuit breaker / graceful degradation (e.g. return structured exceptions without LLM report).
- No request IDs / structured logs.
- `tracing_enabled` reports bootstrap, not “API key present and exporting”:

```12:20:services/agent/agent/tracing.py
def mark_tracing_ready() -> None:
    global _enabled
    _enabled = True

def tracing_enabled() -> bool:
    return _enabled
```

### Trust boundaries
- Web eval API allowlists fixture IDs; agent reconcile does **not**.
- MCP path check exists but allowlists the **entire repo** (see Security).
- Report agent dumps full tool JSON into the LLM prompt — injection surface for future uploads.

**Where it breaks in production:** Unauthenticated `/reconcile` + no timeouts = anyone can burn your Anthropic budget. One hung Claude call ties a worker. MCP can read any file in the container image under `repo_root`.

---

## 5. Security

### Secrets
- `.env` is gitignored — good.
- Spot-check of git history for `sk-ant-` style keys: no committed Anthropic secrets found in this audit pass.
- Default Postgres password `verity` in compose — acceptable for local only; do not expose compose DB publicly.

### Path / tool safety (important)

```21:26:services/mcp/mcp_server/paths.py
    allowed_roots = (
        cfg.repo_root.resolve(),
        cfg.fixtures_root.resolve(),
    )
    if not any(resolved.is_relative_to(root) for root in allowed_roots):
        raise ToolError("file_path must be within the repository")
```

`fixtures_root` is a subset of `repo_root`, so the effective allowlist is **the whole repository**. Any readable file in the container (source, `.env` if copied into the image, infra templates) is tool-reachable. For a demo with only fixtures this is latent risk; for a portfolio claiming production patterning it is a real finding.

**Fix:**

```python
allowed_roots = (cfg.fixtures_root.resolve(),)
# reject .. and absolute escapes; error: "must be under data/fixtures"
```

### Other security issues
- **No auth** on agent or MCP HTTP surfaces.
- **Prompt injection:** narrow today (synthetic fixtures), real if you add uploads — report prompt trusts exception/clause text.
- **Eval API** trusts client-supplied exceptions — fine for demo scoring, useless as a trust boundary (anyone can POST labels as “actuals” and pass).
- **Public Braintrust links** were correctly demoted to a non-link badge after 404s — good call; keep the TODO.

### Injection
- No SQL (pg unused).
- No shell.
- Prompt injection is the live category — document it and validate report citations against structured `clause_ref` if you want guardrails credit.

---

## 6. Testing & verifiability

### What exists

| Asset | Meaningful? |
|-------|-------------|
| `services/mcp/scripts/verify_tools.py` | Yes — smoke for Nextera flags | Manual, one fixture |
| `packages/evals` + `run_local.py` | **Yes — best part of the repo** | Both fixtures, 4 scorers |
| `services/agent/scripts/verify_reconcile.py` | Partial — needs live Anthropic + MCP | Not CI-able as-is |
| Frontend tests | **None** | |
| Unit tests (`test_*.py` in project) | **None** | |
| CI (`.github/workflows`) | **None** | |

### Easy vs important paths
- **Tested:** deterministic MCP reconcile vs labels (important — good).
- **Untested:** report faithfulness, path traversal, agent HTTP validation, frontend, schema drift, MCP session failures, Claude errors.

### Clone-and-run (literal README follow-through)

| Step | Result |
|------|--------|
| `docker compose up` for Postgres | Works, but **nothing in the app needs it** — confusing |
| `pip install -e .` in `services/mcp` | **Breaks** on `verity-shared @ file:../../packages/shared` path resolution in clean envs; README’s evals section correctly uses `--no-deps`, MCP section does not |
| Chat curl `/invoke` | **404 / missing** after chat removal |
| Sidebar chat | **Gone** |
| `npm run dev` | Works if agent is up |
| Evals `run_local.py` | Works with the `--no-deps` dance |

**Staff takeaway:** Setup instructions are partially wrong. That alone can fail a take-home vibe check.

---

## 7. AI / LLM-specific engineering

| Question | Answer |
|----------|--------|
| Prompts versioned? | **No** — one inline `_REPORT_SYSTEM` string |
| Output quality eval? | **Partial** — exceptions scored; **report unscored** |
| Observability? | Braintrust auto-instrument + top-level span — real, but health flag lies; UI permalink disabled |
| Token/cost management? | **None** — no max_tokens, no caching, new MCP session per tool call |
| Guardrails? | Prompt text “do not invent”; no structured output schema, no citation verifier |
| Model choice justified? | Default Sonnet in config; no writeup of why not Haiku for report / why not LLM extract |
| Retrieval? | **None** — pgvector is theater. Extraction is keyword/regex |
| Tool calling safe/scoped/observable? | Imperative MCP calls (good — not unbounded ReAct). Path scope too wide. Per-call sessions hurt observability signal-to-noise |

### The honest architecture (defend this)

> “Correctness lives in deterministic MCP tools. The LLM writes the controller-facing narrative. Evals score the tools against labeled fixtures. LangGraph packages the pipeline for tracing. I deliberately did not put Claude in the detection loop because financial flags must be deterministic and evalable.”

That narrative is **stronger** than “multi-agent autonomous reconciliation.” Use it.

### Keyword extraction fragility (know this cold)

`extract_obligations` matches phrases like `"not to exceed"`, `"purchase order"`, `"duplicate"`. It is fixture-tuned. An interviewer will ask what happens on a real MSA with different language. Answer: “It’s a stand-in for structured clause tags or a later LLM extract with eval gates — I kept it deterministic so Phase 4 evals are meaningful.”

---

## 8. Interview attack surface

### 10 hardest questions

1. **Walk me through `supervisor.py`. Where does the supervisor make a decision?**  
   (Trap: there is no decision.)

2. **Why is the plan span created in `finalize_trace` after specialists run?**  
   (Trap: you’ll either confess theater or dig a deeper hole.)

3. **What percentage of exceptions are determined by the LLM vs the rule engine?**  
   (Answer must be ~0% LLM for detection.)

4. **Show me where pgvector is queried.**  
   (It isn’t. Why is it in the README architecture?)

5. **Your MCP path allowlist includes `repo_root`. Can the tool read `.env`?**  
   (Yes, if present under repo root in the container.)

6. **Why duplicate scorers in TypeScript and Python? Which is source of truth?**  
   (Neither enforced — drift risk.)

7. **How do you know the Claude report didn’t invent a clause?**  
   (You don’t, programmatically.)

8. **`tracing_enabled` returns true with no API key. What does `/health` mean?**  
   (Bootstrap flag, not export readiness.)

9. **Why open a new MCP session per tool call?**  
   (Latency / connection churn — defend or fix.)

10. **README still documents `/invoke` and sidebar chat. Did you ship this, or did a model leave residue?**  
    (Doc hygiene = ownership signal.)

### 5 places that reveal shallow understanding

1. Fabricated supervisor plan (`supervisor.py:21-26`).
2. Spec claiming embeddings/pgvector grounding with no retrieval code.
3. UI “Agent reasoning” over post-hoc narrative strings.
4. Fake reconcile progress timer (`reconcile-progress.tsx:28-30`) presented as “Agent pipeline.”
5. `list[dict[str, object]]` at the service boundary after building a shared schema package — suggests the shared package is resume architecture, not runtime architecture.

### Decisions you’ll struggle to justify
- Keeping Postgres in the critical path of the README when the product doesn’t use it.
- Calling specialists “agents” when each is a 1–2 node subgraph with no autonomy.
- Shipping Braintrust badge that never links after claiming deep links in landing copy (landing was fixed; badge still implies productization).
- Leaving `/api/contract` dead.
- Exception ID scheme that can collide.

### What I’d probe to see if you built it
- Ask you to add a fifth exception type live (e.g. tax mismatch) — touch schema, MCP rule, fixture label, scorer, UI badge.
- Ask you to break a fixture label and show the eval failing locally.
- Ask why fee cap uses `invoice.total_amount` not line items / period.
- Ask you to explain `resolve_readable_path` and then attack it with `../`.
- Ask for the cost of one reconcile (MCP calls × invoices + 1 Claude) — numbers, not vibes.

---

## 9. What’s missing

A staff engineer expects some of:

1. **CI** — at minimum: `ruff`/`pytest` or scripts + `tsc` + `next build` + `run_local.py` on PR.
2. **Auth** on agent (even demo bearer).
3. **Honest README** that matches the code on `main`.
4. **Unit tests** for `reconcile_invoice` and `resolve_readable_path`.
5. **Report faithfulness eval** (LLM-as-judge or citation overlap).
6. **OpenAPI or shared schema codegen** web ↔ agent.
7. **Streaming of real node events** (or no progress UI).
8. **Either retrieval or deletion of pgvector story.**
9. **Structured logging + request IDs.**
10. **Timeouts/retries** on external calls.
11. **Run history / shareable URL** (`?fixture=&run=`).
12. **Invoice viewer** in the UI (controllers want to see the bill).
13. **Dependency declarations that install cleanly** (`pydantic-settings` in MCP; `verity-mcp` in evals).
14. **A design that doesn’t open with a 3-card architecture grid** on the landing page.

---

## 10. Verdict & recommendations

### Does this help or hurt?

**Helps** when framed as:
- Deterministic, clause-grounded reconciliation
- Custom MCP tools
- Labeled fixtures + eval harness
- Separate agent service
- Product-quality exception UX

**Hurts** when framed as:
- Production multi-agent autonomous system
- pgvector-grounded retrieval
- Streaming agent chat product
- “Supervisor reasoning traces”

Ramp/Hebbia/Anthropic interviewers have seen dozens of LangGraph demos. What they have *not* seen enough of: **eval-backed financial correctness with citations**. Lead with that. Demote the agent branding.

### Grade: **B−**

| Dimension | Grade | Note |
|-----------|-------|------|
| Core reconcile correctness | A− | Real rules, real labels, real scorers |
| Architecture honesty | D+ | Theater in naming/traces/docs |
| Product UI (dashboard) | B+ | Actually good |
| Landing / marketing | C | Generic SaaS template |
| Production readiness | C− | Shapes without hardening |
| Testing/CI | D | Evals good; no CI; no unit tests |
| AI engineering depth | B | Right split (tools vs LLM); shallow prompts/guardrails |
| Repo hygiene | C− | Stale docs, dead code, unused infra |

### Top 5 changes (impact-ranked)

1. **Honesty pass (highest ROI)**  
   Rename supervisor → pipeline; delete fabricated plan span; rewrite README/SPEC to match code; remove or implement pgvector/audit claims.  
   *Perception delta: “AI portfolio” → “engineer who knows what they built.”*

2. **Add CI that runs evals + MCP verify + `tsc` + `next build`.**  
   *Perception delta: amateur → ships.*

3. **Harden trust boundaries**  
   Fixture allowlist on agent; MCP paths = `data/fixtures` only; bearer auth on `/reconcile`.  
   *Perception delta: demo → FDE instincts.*

4. **Single schema source + typed agent responses**  
   Kill `dict[str, object]` bags; generate or share TS types.  
   *Perception delta: systems engineer.*

5. **Make the UI tell the truth during runs**  
   Stream/post real node events; delete fake 2200ms progress; cinematic landing with real product footage; invoice pane.  
   *Perception delta: product sense for FDE roles.*

### Single biggest doubt trigger
The fabricated supervisor “plan” in `finalize_trace` while the graph has only fixed edges — especially when the UI and landing call it multi-agent routing.

---

## Appendix A — UI/UX recommendations (2026)

Goal: make the surface look as serious as the deterministic core.

### What’s working
- Dashboard density, severity system, clause cross-highlight, keyboard nav.
- Restraint in product chrome (closer to Ramp than to “AI purple SaaS”).
- Removing ungrounded chat was the correct product decision.

### What’s hurting perception
1. Landing = eyebrow + headline + dual CTA + fake queue card + 3 steps + 3 icon cards + CTA. That is 2023 template structure.
2. Fake “Agent pipeline” progress.
3. Non-interactive Braintrust chip (better than a 404; still feels like a sticker).
4. No invoice body in the UI — exception without the bill feels abstract.
5. Brand mark is a small “V” in the nav; first viewport brand signal is weak per your own design rules.
6. Harbor fixture invisible on marketing (proof strip is Nextera-only).

### 2026 AI-product UI principles to apply

| Principle | Apply to Verity |
|-----------|-----------------|
| **Show the artifact, not the chat** | You already killed chat — double down. Hero = real exception→clause moment (video loop or interactive scrub). |
| **Honest system status** | Progress = real graph events or elapsed time + “calling MCP…” — never a theater timer. |
| **One composition hero** | Landing first viewport: brand + one line + one CTA + full-bleed product visual. Kill the 3 architecture cards or replace with one annotated diagram. |
| **Evidence UI** | Split view: invoice lines \| exception \| clause. Controllers think in documents. |
| **Quiet luxury / tool aesthetic** | Keep cream+green; increase information density above the fold; reduce `gap-12`; metrics + table as one composition. |
| **Motion with meaning** | 2–3 motions: clause highlight pulse, metric count-up (have it), drawer spring. No gradient orbs. |
| **Shareable state** | `/app?fixture=harbor-analytics&exception=exc-…` |
| **Eval as product** | Keep the eval report — it’s differentiating. Make it visually primary after run, not a side card. |
| **Trace as timeline, not badge** | In-app timeline is the artifact; Braintrust is “exported for eng debugging” copy, not a faux button. |

### Concrete landing redesign (minimal scope)
1. Delete the three equal architecture cards.
2. Replace hero right column with a looping capture of: run → exception select → clause highlight.
3. One proof line under the fold with live numbers from the same fixture JSON the app uses (or “Open the live demo”).
4. Move “How it works” to a single horizontal pipeline graphic: `Extract → Reconcile → Cite → Eval`.
5. CTA only once in the hero; secondary text link for architecture.

### Concrete dashboard redesign
1. Replace `ReconcileProgress` fake steps with binding to `agent_trace` as events arrive (or a simple indeterminate + elapsed ms until you have streaming).
2. Add a collapsible invoice panel fed by reconcile response (extend API to return parsed invoices — you already have them server-side).
3. Promote Eval report beside the exception queue (same row), demote decorative metrics if needed.
4. Fix a11y: no `<Link><Button>`, fixture picker roving tabindex, `aria-sort` on table.
5. Remove always-“Flagged” status column or make it real.

---

## Appendix B — Suggested honest README opening

```markdown
# Verity

Clause-grounded invoice reconciliation for vendor agreements.

Deterministic MCP tools flag overbilling, missing POs, out-of-term charges,
and duplicates against labeled fixtures. A LangGraph pipeline orchestrates
those tools and asks Claude only to write the controller-facing cited report.
Braintrust traces each run; an eval harness scores detection quality.
```

That paragraph is more hireable than “autonomous multi-agent system.”

---

*End of audit.*
