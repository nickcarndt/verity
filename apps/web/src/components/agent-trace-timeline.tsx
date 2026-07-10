import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AgentTraceEvent } from "@/lib/agent";
import { cn } from "@/lib/utils";

const AGENT_LABELS: Record<string, string> = {
  supervisor: "Supervisor",
  contract_agent: "Contract agent",
  reconciliation_agent: "Reconciliation agent",
  report_agent: "Report agent",
};

interface AgentTraceTimelineProps {
  events: AgentTraceEvent[];
  highlightAgent?: string;
  compact?: boolean;
}

export function AgentTraceTimeline({
  events,
  highlightAgent,
  compact = false,
}: AgentTraceTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Agent trace unavailable for this run.
      </p>
    );
  }

  return (
    <ol className={compact ? "space-y-3" : "space-y-4"}>
      {events.map((event, index) => {
        const highlighted = highlightAgent === event.agent;

        return (
          <li key={`${event.agent}-${event.step}-${index}`} className="flex gap-3">
            <div className="mt-0.5 flex flex-col items-center">
              <CheckCircle2
                className={highlighted ? "h-4 w-4 text-primary" : "h-4 w-4 text-success"}
              />
              {index < events.length - 1 && (
                <div className="mt-1 h-full w-px flex-1 bg-border" />
              )}
            </div>
            <div className={cn("flex-1", !compact && "pb-3")}>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-subtle">
                  {AGENT_LABELS[event.agent] ?? event.agent}
                </p>
                {highlighted && (
                  <Badge variant="brand" className="text-[10px]">
                    relevant
                  </Badge>
                )}
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">{event.step}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{event.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
