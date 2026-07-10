import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  fixture_id: z.string().min(1),
});

export async function POST(request: Request) {
  const agentUrl = process.env.AGENT_API_URL ?? "http://localhost:8000";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: "fixture_id is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${agentUrl}/reconcile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "Agent service unavailable — is it running on port 8000?" },
      { status: 503 },
    );
  }
}
