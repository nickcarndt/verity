"use client";

import { CheckCircle2, FileCheck2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { EvalReportSkeleton } from "@/components/eval-report-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExceptionFlag } from "@/lib/agent";
import type { EvalScore } from "@/lib/eval";
import type { FixtureId } from "@/lib/fixtures";
import { cn } from "@/lib/utils";

interface ReportFaithfulnessProps {
  fixtureId: FixtureId;
  report: string | null;
  exceptions: ExceptionFlag[] | null;
}

export function ReportFaithfulnessCard({
  fixtureId,
  report,
  exceptions,
}: ReportFaithfulnessProps) {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<EvalScore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScore() {
    if (!report?.trim() || !exceptions?.length) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/eval/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixture_id: fixtureId,
          report,
          exceptions,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Scoring failed" }));
        throw new Error(typeof err.detail === "string" ? err.detail : "Scoring failed");
      }
      const data = await response.json();
      setScores(data.scores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scoring failed");
      setScores(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (report?.trim() && exceptions?.length) {
      void runScore();
    } else {
      setScores(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-score when inputs change
  }, [fixtureId, report, exceptions]);

  const allPassed = scores?.every((s) => s.passed) ?? false;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-subtle" />
            <CardTitle>Report faithfulness</CardTitle>
          </div>
          <CardDescription className="mt-1">
            Checks that Claude&apos;s prose cites only invoice IDs, clause sections, and
            dollar amounts from structured reconcile output — separate from detection scores.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={runScore}
          disabled={loading || !report?.trim() || !exceptions?.length}
        >
          {loading ? "Scoring…" : "Re-run"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {(!report?.trim() || !exceptions?.length) && (
          <p className="text-sm text-muted-foreground">
            Run reconciliation first to score the written report.
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
              {allPassed ? "Report grounded in structured output" : "Ungrounded citations found"}
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
