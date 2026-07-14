import Link from "next/link";
import { ArrowRight, GitBranch, ShieldCheck, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

const PROOF_STATS = [
  { label: "Exceptions caught", value: "4" },
  { label: "Dollar impact flagged", value: "$29,450" },
  { label: "Invoices reconciled", value: "5" },
  { label: "Eval scorers passed", value: "4/4" },
] as const;

const STEPS = [
  {
    title: "Extract obligations",
    description:
      "Contract agent pulls fee caps, PO rules, term windows, and duplicate constraints — each tied to a source clause.",
    detail: "MCP · extract_obligations",
  },
  {
    title: "Reconcile invoices",
    description:
      "Reconciliation agent parses every invoice and flags overbilling, missing POs, out-of-term charges, and duplicates.",
    detail: "MCP · reconcile",
  },
  {
    title: "Cite every exception",
    description:
      "Report agent produces a clause-grounded exception summary. Every flag links to the exact contract section.",
    detail: "Claude · cited report",
  },
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              V
            </div>
            <span className="text-sm font-semibold tracking-tight">Verity</span>
          </div>
          <Link href="/app">
            <Button size="sm">Open dashboard</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(11,110,79,0.08),transparent_50%),linear-gradient(180deg,#fafaf8_0%,#f4f4f1_100%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-30 motion-safe:animate-[pulse_8s_ease-in-out_infinite]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(11,110,79,0.06) 39px,rgba(11,110,79,0.06) 40px)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                Clause-grounded invoice reconciliation
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
                Every billing exception, grounded in the contract clause.
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                Verity reconciles vendor agreements against invoice batches with deterministic
                tools, then asks Claude only to write the cited exception report a controller
                can act on.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app">
                  <Button size="lg">
                    Run reconciliation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#architecture">
                  <Button variant="outline" size="lg">
                    See architecture
                  </Button>
                </a>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="rounded-lg border border-border bg-card p-6 pb-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <p className="mb-4 text-xs font-medium uppercase tracking-wide text-subtle">
                  Exception queue · Nextera Systems
                </p>
                <div className="space-y-2">
                  {[
                    { type: "Overbilling", impact: "$2,750", severity: "High" },
                    { type: "Missing PO", impact: "$8,200", severity: "Medium" },
                    { type: "Out of term", impact: "$9,000", severity: "Critical" },
                    { type: "Duplicate", impact: "$9,500", severity: "High" },
                  ].map((row) => (
                    <div
                      key={row.type}
                      className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-0.5 rounded-full bg-primary" />
                        <span className="font-medium">{row.type}</span>
                        <span className="text-xs text-subtle">{row.severity}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold tabular-nums text-critical">
                        {row.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Proof moment */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <p className="text-center text-lg font-medium tracking-[-0.01em] sm:text-xl">
              Verity caught{" "}
              <span className="font-mono font-semibold text-critical">$29,450</span> in billing
              exceptions across{" "}
              <span className="font-semibold tabular-nums">5 invoices</span> — with full clause
              citations and a passing eval harness.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {PROOF_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dt className="text-xs font-medium uppercase tracking-wide text-subtle">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">How it works</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              A fixed three-stage pipeline — deterministic MCP tools for reconciliation,
              Claude only for the cited report.
            </p>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-md border border-border bg-card p-6"
                >
                  <p className="font-mono text-xs text-primary">0{index + 1}</p>
                  <h3 className="mt-2 text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  <p className="mt-4 font-mono text-[11px] text-subtle">{step.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Architecture */}
        <section id="architecture" className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">
              Built for production AI engineering
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              LangGraph pipeline orchestration, custom MCP tools, Braintrust tracing and evals,
              and a premium fintech dashboard — not a wrapper around a chat box.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-border bg-card p-5">
                <GitBranch className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">LangGraph pipeline</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fixed extract → reconcile → report stages as compiled LangGraph subgraphs,
                  traced end to end.
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-5">
                <Zap className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">MCP tool server</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deterministic parse, extract, and reconcile tools — testable, eval-friendly,
                  swappable for LLM extraction later.
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-5">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-sm font-semibold">Evals + tracing</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Four deterministic scorers against labeled fixtures. Every run traced in
                  Braintrust for span-level debugging and offline eval.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-background">
          <div className="mx-auto max-w-6xl px-6 py-20 text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">
              See clause-grounded reconciliation in action
            </h2>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Run the Nextera Systems fixture — 4 labeled exceptions, full agent trace, keyboard
              navigation, and eval report.
            </p>
            <Link href="/app" className="mt-8 inline-block">
              <Button size="lg">
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-subtle">
          <span>Verity — invoice reconciliation agent</span>
          <Link href="/app" className="hover:text-foreground">
            Dashboard →
          </Link>
        </div>
      </footer>
    </div>
  );
}
