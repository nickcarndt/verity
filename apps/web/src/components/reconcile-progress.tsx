"use client";

import { useEffect, useState } from "react";

interface ReconcileProgressProps {
  active: boolean;
}

/** Honest run status — elapsed time only; does not claim live pipeline stages. */
export function ReconcileProgress({ active }: ReconcileProgressProps) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedSec(0);
      return;
    }

    const started = Date.now();
    const interval = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 250);

    return () => window.clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-subtle">
        Running reconciliation
      </p>
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <p className="text-sm text-foreground">
          Extracting obligations, reconciling invoices, and writing the cited report…
          <span className="ml-2 font-mono text-xs tabular-nums text-subtle">
            {elapsedSec}s
          </span>
        </p>
      </div>
    </div>
  );
}
