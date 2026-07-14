import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  fixture_id: z.enum(["nextera-systems", "harbor-analytics"]),
});

export async function POST(request: Request) {
  const agentUrl = process.env.AGENT_API_URL ?? "http://localhost:8000";
  const agentApiKey = process.env.AGENT_API_KEY;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: "fixture_id must be nextera-systems or harbor-analytics" },
      { status: 400 },
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (agentApiKey) {
    headers.Authorization = `Bearer ${agentApiKey}`;
  }

  try {
    const response = await fetch(`${agentUrl}/reconcile`, {
      method: "POST",
      headers,
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(120_000),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        detail: `Agent service unavailable — is it running at ${agentUrl}?`,
      },
      { status: 503 },
    );
  }
}
