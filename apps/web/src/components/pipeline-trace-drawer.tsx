import { GitBranch } from "lucide-react";

import { AgentTraceTimeline } from "@/components/agent-trace-timeline";
import { BraintrustTraceLink } from "@/components/braintrust-trace-link";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import type { ReconcileResponse } from "@/lib/agent";

interface PipelineTraceDrawerProps {
  result: ReconcileResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PipelineTraceDrawer({
  result,
  open,
  onOpenChange,
}: PipelineTraceDrawerProps) {
  if (!result) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2 pr-8">
            <GitBranch className="h-4 w-4 text-subtle" />
            <SheetTitle>How this run worked</SheetTitle>
          </div>
          <SheetDescription>
            Fixed pipeline stages for this reconciliation run.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-8">
          <AgentTraceTimeline events={result.agent_trace ?? []} />

          <section>
            <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-subtle">
              Per-invoice results
            </h4>
            <ul className="space-y-2">
              {result.reconciliation_results.map((item) => (
                <li
                  key={item.invoice_id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="font-mono text-xs tabular-nums">{item.invoice_id}</span>
                  <Badge
                    variant={item.status === "flagged" ? "warning" : "success"}
                    className="capitalize"
                  >
                    {item.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-md border border-border bg-muted/30 p-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
              Braintrust tracing
            </h4>
            <p className="mb-3 text-sm text-muted-foreground">
              Every reconciliation run is traced in Braintrust — nested LangGraph
              spans, Claude calls, and MCP tool invocations for offline eval and
              debugging.
            </p>
            <BraintrustTraceLink url={result.braintrust_trace_url} />
          </section>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
