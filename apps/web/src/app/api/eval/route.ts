import { NextResponse } from "next/server";
import { z } from "zod";

import expectedExceptions from "@/data/nextera-systems/expected_exceptions.json";
import { ExceptionFlagSchema } from "@/lib/agent";
import { allScoresPassed, runEvalScorers } from "@/lib/eval";

const RequestSchema = z.object({
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
    return NextResponse.json({ detail: "exceptions array is required" }, { status: 400 });
  }

  const scores = runEvalScorers(
    parsed.data.exceptions,
    z.array(ExceptionFlagSchema).parse(expectedExceptions),
  );
  return NextResponse.json({
    fixture_id: "nextera-systems",
    scores,
    passed: allScoresPassed(scores),
  });
}
