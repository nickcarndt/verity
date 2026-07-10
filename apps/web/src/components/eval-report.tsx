"use client";

import { CheckCircle2, ClipboardCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { EvalReportSkeleton } from "@/components/eval-report-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExceptionFlag } from "@/lib/agent";
import type { EvalScore } from "@/lib/eval";
import { cn } from "@/lib/utils";

interface EvalReportProps {
  exceptions: ExceptionFlag[] | null;
}

export function EvalReport({ exceptions }: EvalReportProps) {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<EvalScore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runEval() {
    if (!exceptions?.length) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exceptions }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Eval failed" }));
        throw new Error(typeof err.detail === "string" ? err.detail : "Eval failed");
      }
      const data = await response.json();
      setScores(data.scores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eval failed");
      setScores(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (exceptions?.length) {
      void runEval();
    } else {
      setScores(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-score when exception set changes
  }, [exceptions]);

  const allPassed = scores?.every((s) => s.passed) ?? false;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-subtle" />
            <CardTitle>Eval report</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Scores reconciliation output against labeled fixture ground truth.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runEval}
          disabled={loading || !exceptions?.length}
        >
          {loading ? "Scoring…" : "Re-run"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {!exceptions?.length && (
          <p className="text-sm text-muted-foreground">
            Run reconciliation first to score against labels.
          </p>
        )}

        {loading && !scores && <EvalReportSkeleton />}

        {error && <p className="text-sm text-critical">{error}</p>}

        {scores && (
          <>
            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                allPassed ? "bg-success-bg text-success" : "bg-critical-bg text-critical",
              )}
            >
              {allPassed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {allPassed ? "All scorers passed" : "Some scorers failed"}
            </div>

            <ul className="space-y-3">
              {scores.map((score) => (
                <li key={score.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{score.label}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {(score.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-sm bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-sm transition-all duration-500",
                        score.passed ? "bg-success" : "bg-critical",
                      )}
                      style={{ width: `${score.score * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
