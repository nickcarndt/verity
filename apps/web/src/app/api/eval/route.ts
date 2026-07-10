import { NextResponse } from "next/server";
import { z } from "zod";

import { ExceptionFlagSchema } from "@/lib/agent";
import { allScoresPassed, runEvalScorers } from "@/lib/eval";
import { FIXTURES, type FixtureId } from "@/lib/fixtures";

const RequestSchema = z.object({
  fixture_id: z.enum(["nextera-systems", "harbor-analytics"]),
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
      { detail: "fixture_id and exceptions array are required" },
      { status: 400 },
    );
  }

  const fixtureId = parsed.data.fixture_id as FixtureId;
  const expected = FIXTURES[fixtureId].expectedExceptions;

  const scores = runEvalScorers(parsed.data.exceptions, expected);
  return NextResponse.json({
    fixture_id: fixtureId,
    scores,
    passed: allScoresPassed(scores),
  });
}
