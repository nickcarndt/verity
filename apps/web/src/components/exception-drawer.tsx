import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AgentTraceTimeline } from "@/components/agent-trace-timeline";
import { SeverityBadge } from "@/components/exception-table";
import type { AgentTraceEvent, ExceptionFlag } from "@/lib/agent";
import { formatCurrency, formatExceptionType, severityImpactClass } from "@/lib/utils";

import contract from "@/data/nextera-systems/contract.json";

interface ExceptionDrawerProps {
  exception: ExceptionFlag | null;
  agentTrace: AgentTraceEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function clauseTitle(section: string): string | undefined {
  return contract.clauses.find((clause) => clause.section === section)?.title;
}

export function ExceptionDrawer({
  exception,
  agentTrace,
  open,
  onOpenChange,
}: ExceptionDrawerProps) {
  if (!exception) return null;

  const title = clauseTitle(exception.clause_ref.section);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-lg">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SeverityBadge severity={exception.severity} />
            <SheetTitle>{formatExceptionType(exception.type)}</SheetTitle>
          </div>
          <SheetDescription>{exception.description}</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-8">
          <section>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Dollar impact
            </h4>
            <p className={severityImpactClass(exception.severity)}>
              {formatCurrency(exception.dollar_impact)}
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Agent reasoning
            </h4>
            <div className="rounded-md border border-border bg-card p-4">
              <AgentTraceTimeline
                events={agentTrace}
                highlightAgent="reconciliation_agent"
                compact
              />
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Evidence
            </h4>
            <p className="rounded-md border border-border bg-muted/40 p-4 font-mono text-sm leading-relaxed">
              {exception.evidence}
            </p>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Source clause
            </h4>
            <div className="rounded-md border-l-4 border-primary bg-brand-subtle p-4">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="font-mono text-sm font-semibold">
                  §{exception.clause_ref.section}
                </p>
                {title && (
                  <p className="text-xs text-muted-foreground">{title}</p>
                )}
              </div>
              <p className="text-sm leading-relaxed">
                <mark className="rounded-sm bg-primary/10 px-0.5 text-foreground">
                  {exception.clause_ref.text}
                </mark>
              </p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                Invoice
              </p>
              <p className="mt-1 font-mono text-xs">{exception.invoice_id}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                Exception ID
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{exception.id}</p>
            </div>
          </section>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
