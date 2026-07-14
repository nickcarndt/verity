"use client";

import { AlertCircle, FileSearch, GitBranch, Play } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { BraintrustTraceLink } from "@/components/braintrust-trace-link";
import { ContractPanel } from "@/components/contract-panel";
import { EvalReport } from "@/components/eval-report";
import { ExceptionDrawer } from "@/components/exception-drawer";
import { ExceptionTable } from "@/components/exception-table";
import { ExceptionTableSkeleton } from "@/components/exception-table-skeleton";
import { FixturePicker } from "@/components/fixture-picker";
import { MetricCard } from "@/components/metric-card";
import { PipelineTraceDrawer } from "@/components/pipeline-trace-drawer";
import { ReconcileProgress } from "@/components/reconcile-progress";
import { ReportView } from "@/components/report-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetaLabel, SectionHeading } from "@/components/ui/section-heading";
import { type ExceptionFlag, type ReconcileResponse, runReconcile } from "@/lib/agent";
import { getFixture, type FixtureId } from "@/lib/fixtures";
import { formatCurrency } from "@/lib/utils";

export function Dashboard() {
  const [fixtureId, setFixtureId] = useState<FixtureId>("nextera-systems");
  const fixture = getFixture(fixtureId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReconcileResponse | null>(null);
  const [selected, setSelected] = useState<ExceptionFlag | null>(null);
  const [focused, setFocused] = useState<ExceptionFlag | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);
  const [metricsAnimate, setMetricsAnimate] = useState(false);

  const totalImpact = useMemo(() => {
    if (!result) return 0;
    return result.exceptions.reduce(
      (sum, exc) => sum + parseFloat(exc.dollar_impact),
      0,
    );
  }, [result]);

  const matchedCount = useMemo(() => {
    if (!result) return 0;
    return result.reconciliation_results.filter((r) => r.status === "matched").length;
  }, [result]);

  function resetRunState() {
    setResult(null);
    setError(null);
    setSelected(null);
    setFocused(null);
    setDrawerOpen(false);
    setTraceOpen(false);
    setHighlightedSection(null);
    setMetricsAnimate(false);
  }

  function handleFixtureChange(nextFixtureId: FixtureId) {
    if (nextFixtureId === fixtureId) return;
    setFixtureId(nextFixtureId);
    resetRunState();
  }

  async function handleReconcile() {
    setLoading(true);
    setError(null);
    setMetricsAnimate(false);
    try {
      const response = await runReconcile(fixtureId);
      setResult(response);
      setMetricsAnimate(true);
      setFocused(null);
      setSelected(null);
      setDrawerOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reconciliation failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const handleFocusChange = useCallback((exception: ExceptionFlag) => {
    setFocused(exception);
    setHighlightedSection(exception.clause_ref.section);
    if (drawerOpen) {
      setSelected(exception);
    }
  }, [drawerOpen]);

  const handleOpenException = useCallback((exception: ExceptionFlag) => {
    setFocused(exception);
    setSelected(exception);
    setHighlightedSection(exception.clause_ref.section);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  function handleClauseClick(section: string) {
    setHighlightedSection((current) => (current === section ? null : section));
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-12">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <MetaLabel>Fixture</MetaLabel>
          <FixturePicker
            value={fixtureId}
            disabled={loading}
            onChange={handleFixtureChange}
          />
          <div>
            <h2 className="text-[30px] font-semibold tracking-[-0.02em]">{fixture.name}</h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {fixture.agreementTitle} — {fixture.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {result && (
            <Button variant="outline" onClick={() => setTraceOpen(true)}>
              <GitBranch className="h-4 w-4" />
              How this run worked
            </Button>
          )}
          <Button onClick={handleReconcile} disabled={loading} size="lg">
            <Play className="h-4 w-4" />
            {loading ? "Reconciling…" : "Run reconciliation"}
          </Button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-md border border-critical/20 bg-critical-bg px-4 py-3 text-sm text-critical">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Reconciliation failed</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 px-6 py-20 text-center">
          <FileSearch className="mb-3 h-9 w-9 text-subtle" />
          <h3 className="text-xl font-semibold tracking-[-0.01em]">Ready to reconcile</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Run the agent pipeline on {fixture.name} to extract obligations, reconcile
            invoices, and surface clause-grounded exceptions.
          </p>
        </div>
      )}

      {loading && (
        <div className="space-y-8">
          <ReconcileProgress active />
          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-md border border-border bg-muted/50" />
            ))}
          </div>
          <div className="space-y-3">
            <div className="h-5 w-40 animate-pulse rounded-sm bg-muted" />
            <ExceptionTableSkeleton />
          </div>
        </div>
      )}

      {result && !loading && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/15 bg-brand-subtle px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success">Reconciled</Badge>
              <p className="text-sm text-foreground">
                <span className="font-semibold tabular-nums">{result.exception_count}</span>{" "}
                exceptions ·{" "}
                <span className="font-mono font-semibold tabular-nums text-critical">
                  {formatCurrency(totalImpact)}
                </span>{" "}
                at risk ·{" "}
                <span className="font-semibold tabular-nums text-success">{matchedCount}</span> clean
                invoice{matchedCount === 1 ? "" : "s"}
              </p>
            </div>
            <BraintrustTraceLink url={result.braintrust_trace_url} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Exceptions flagged"
              value={result.exception_count}
              subtitle={`of ${fixture.invoiceCount} invoices`}
              animate={metricsAnimate}
            />
            <MetricCard
              label="Total dollar impact"
              value={totalImpact}
              format="currency"
              animate={metricsAnimate}
              valueClassName="text-critical"
            />
            <MetricCard
              label="Clean invoices"
              value={matchedCount}
              subtitle={`${fixture.invoiceCount - matchedCount} flagged`}
              animate={metricsAnimate}
              valueClassName="text-success"
            />
          </div>

          <section className="space-y-4">
            <SectionHeading
              title="Exception queue"
              description="Inspect evidence and clause grounding for each flag."
            />
            <ExceptionTable
              exceptions={result.exceptions}
              vendorName={fixture.vendorName}
              invoiceCount={fixture.invoiceCount}
              focusedId={focused?.id ?? null}
              drawerOpen={drawerOpen}
              keyboardEnabled={!traceOpen}
              highlightedSection={highlightedSection}
              onFocusChange={handleFocusChange}
              onOpen={handleOpenException}
              onCloseDrawer={handleCloseDrawer}
              onClauseClick={handleClauseClick}
            />
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <ContractPanel
              contract={fixture.contract}
              exceptions={result.exceptions}
              highlightedSection={highlightedSection}
              onHighlightSection={handleClauseClick}
            />
            <EvalReport fixtureId={fixtureId} exceptions={result.exceptions} />
          </div>

          <ReportView report={result.report} />
        </>
      )}

      <ExceptionDrawer
        exception={selected}
        contract={fixture.contract}
        agentTrace={result?.agent_trace ?? []}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
        }}
      />

      <PipelineTraceDrawer
        result={result}
        open={traceOpen}
        onOpenChange={setTraceOpen}
      />
    </div>
  );
}
