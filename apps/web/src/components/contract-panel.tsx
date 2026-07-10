"use client";

import { BookOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExceptionFlag } from "@/lib/agent";
import type { FixtureContract } from "@/lib/fixtures";
import { cn } from "@/lib/utils";

interface ContractPanelProps {
  contract: FixtureContract;
  exceptions: ExceptionFlag[];
  highlightedSection: string | null;
  onHighlightSection: (section: string) => void;
}

export function ContractPanel({
  contract,
  exceptions,
  highlightedSection,
  onHighlightSection,
}: ContractPanelProps) {
  const citedSections = new Set(exceptions.map((e) => e.clause_ref.section));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-subtle" />
          <CardTitle>Source contract</CardTitle>
        </div>
        <CardDescription>
          {contract.vendor_name} — {contract.title}
        </CardDescription>
        <p className="text-xs text-subtle">
          Term: {contract.effective_date} to {contract.end_date}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {contract.clauses.map((clause) => {
          const isCited = citedSections.has(clause.section);
          const isHighlighted = highlightedSection === clause.section;

          return (
            <button
              key={clause.id}
              type="button"
              onClick={() => onHighlightSection(clause.section)}
              className={cn(
                "w-full rounded-md border p-3 text-left transition-colors",
                isHighlighted
                  ? "border-primary bg-brand-subtle"
                  : isCited
                    ? "border-warning/30 bg-warning-bg/40 hover:bg-warning-bg/60"
                    : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-semibold">§{clause.section}</p>
                <div className="flex items-center gap-2">
                  {isCited && (
                    <Badge variant="brand" className="text-[10px]">
                      cited
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{clause.title}</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{clause.text}</p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
