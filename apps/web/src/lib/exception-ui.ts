import type { ExceptionFlag } from "@/lib/agent";
import type { BadgeProps } from "@/components/ui/badge";

const exceptionTypeVariants: Record<ExceptionFlag["type"], NonNullable<BadgeProps["variant"]>> = {
  overbilling: "critical",
  out_of_term: "critical",
  missing_po: "warning",
  duplicate_invoice: "info",
};

export function exceptionTypeVariant(type: ExceptionFlag["type"]) {
  return exceptionTypeVariants[type];
}

export type SeverityFilter = ExceptionFlag["severity"] | "all";

export const SEVERITY_FILTERS: Array<{ id: SeverityFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];
