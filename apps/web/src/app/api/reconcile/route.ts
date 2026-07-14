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
      // Bound wait: agent Claude timeout (~90s) + MCP + buffer
      signal: AbortSignal.timeout(150_000),
    });

    const data = await response.json().catch(() => ({
      detail: `Agent at ${agentUrl} returned a non-JSON response`,
    }));
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    const timedOut =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    return NextResponse.json(
      {
        detail: timedOut
          ? `Agent request timed out talking to ${agentUrl}`
          : `Agent service unavailable — is it running at ${agentUrl}?`,
      },
      { status: timedOut ? 504 : 503 },
    );
  }
}
