import { NextResponse } from "next/server";
import { z } from "zod";

import { ExceptionFlagSchema } from "@/lib/agent";
import { FIXTURES, type FixtureId } from "@/lib/fixtures";
import { scoreReportFaithfulness } from "@/lib/report-faithfulness";

const RequestSchema = z.object({
  fixture_id: z.enum(["nextera-systems", "harbor-analytics"]),
  report: z.string().min(1),
  exceptions: z.array(ExceptionFlagSchema),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "fixture_id, report, and exceptions are required" },
      { status: 400 },
    );
  }

  const fixtureId = parsed.data.fixture_id as FixtureId;
  const fixture = FIXTURES[fixtureId];
  // Prefer fixture inventory, plus any IDs present on structured exceptions
  // (covers filename vs invoice.id mismatches like inv-2025-005-duplicate → inv-2025-005).
  const invoiceIds = Array.from(
    new Set([
      ...fixture.invoiceIds,
      ...parsed.data.exceptions.map((e) => e.invoice_id),
    ]),
  );
  const scored = scoreReportFaithfulness({
    report: parsed.data.report,
    exceptions: parsed.data.exceptions,
    invoiceIds,
    contractSections: fixture.contract.clauses.map((c) => c.section),
  });

  return NextResponse.json({
    fixture_id: fixtureId,
    kind: "report_faithfulness",
    score: scored.score,
    passed: scored.passed,
    checks: scored.checks,
    scores: scored.scores,
  });
}
