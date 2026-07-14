import { z } from "zod";

const ClauseRefSchema = z.object({
  section: z.string(),
  text: z.string(),
});

export const ExceptionFlagSchema = z.object({
  id: z.string(),
  type: z.enum(["overbilling", "missing_po", "out_of_term", "duplicate_invoice"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  description: z.string(),
  dollar_impact: z.string(),
  clause_ref: ClauseRefSchema,
  invoice_id: z.string(),
  evidence: z.string(),
});

export const AgentTraceEventSchema = z.object({
  agent: z.string(),
  step: z.string(),
  detail: z.string(),
  status: z.string(),
});

export const ReconcileResponseSchema = z.object({
  fixture_id: z.enum(["nextera-systems", "harbor-analytics"]),
  report: z.string(),
  exception_count: z.number(),
  exceptions: z.array(ExceptionFlagSchema),
  reconciliation_results: z.array(
    z.object({
      invoice_id: z.string(),
      status: z.enum(["matched", "flagged"]),
      exceptions: z.array(ExceptionFlagSchema),
    }),
  ),
  agent_trace: z.array(AgentTraceEventSchema).default([]),
  braintrust_trace_url: z.string().nullable().optional(),
});

export type ExceptionFlag = z.infer<typeof ExceptionFlagSchema>;
export type AgentTraceEvent = z.infer<typeof AgentTraceEventSchema>;
export type ReconcileResponse = z.infer<typeof ReconcileResponseSchema>;

export async function runReconcile(
  fixtureId: "nextera-systems" | "harbor-analytics",
): Promise<ReconcileResponse> {
  const response = await fetch("/api/reconcile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fixture_id: fixtureId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Reconciliation failed" }));
    throw new Error(
      typeof error.detail === "string" ? error.detail : "Reconciliation failed",
    );
  }

  const data = await response.json();
  return ReconcileResponseSchema.parse(data);
}
