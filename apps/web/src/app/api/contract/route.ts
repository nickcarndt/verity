import { NextResponse } from "next/server";

import { FIXTURES, type FixtureId } from "@/lib/fixtures";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fixtureId = searchParams.get("fixture_id") ?? "nextera-systems";

  if (!(fixtureId in FIXTURES)) {
    return NextResponse.json({ detail: "Unknown fixture_id" }, { status: 400 });
  }

  return NextResponse.json(FIXTURES[fixtureId as FixtureId].contract);
}
