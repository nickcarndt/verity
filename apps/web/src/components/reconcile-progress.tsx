"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const STEPS = [
  { id: "parse", label: "Parsing invoices" },
  { id: "extract", label: "Extracting obligations" },
  { id: "reconcile", label: "Reconciling" },
  { id: "flag", label: "Flagging exceptions" },
] as const;

interface ReconcileProgressProps {
  active: boolean;
}

export function ReconcileProgress({ active }: ReconcileProgressProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setStepIndex((current) => (current < STEPS.length - 1 ? current + 1 : current));
    }, 2200);

    return () => window.clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-subtle">
        Agent pipeline
      </p>
      <ol className="space-y-3">
        {STEPS.map((step, index) => {
          const done = index < stepIndex;
          const current = index === stepIndex;

          return (
            <li key={step.id} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-[10px] font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary bg-brand-subtle text-primary",
                  !done && !current && "border-border bg-muted text-subtle",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-sm",
                  current ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
                {current && (
                  <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
