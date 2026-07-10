import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({
  prompt: z.string().min(1),
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
    return NextResponse.json({ detail: "prompt is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`${agentUrl}/invoke/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: parsed.data.prompt }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Agent stream failed" }));
      return NextResponse.json(error, { status: response.status });
    }

    if (!response.body) {
      return NextResponse.json({ detail: "Empty stream from agent" }, { status: 502 });
    }

    return new Response(response.body, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json(
      { detail: "Agent service unavailable — is it running on port 8000?" },
      { status: 503 },
    );
  }
}
