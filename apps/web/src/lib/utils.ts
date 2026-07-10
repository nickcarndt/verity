import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ExceptionFlag } from "@/lib/agent";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  const amount = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatExceptionType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const severityImpactColors: Record<ExceptionFlag["severity"], string> = {
  critical: "text-critical",
  high: "text-critical",
  medium: "text-warning",
  low: "text-info",
};

/** Dollar-impact styling — the most important number on screen. */
export function severityImpactClass(severity: ExceptionFlag["severity"]): string {
  return cn("font-mono text-[15px] font-semibold tabular-nums", severityImpactColors[severity]);
}
