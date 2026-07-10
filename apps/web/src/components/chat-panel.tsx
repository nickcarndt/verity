"use client";

import { useCompletion } from "@ai-sdk/react";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Ask me about invoice reconciliation, exception types, or how Verity grounds flags in contract clauses.",
};

export function ChatPanel() {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState("");

  const { complete, completion, isLoading, error } = useCompletion({
    api: "/api/chat",
    streamProtocol: "text",
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, completion, isLoading]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setDraft("");

    const result = await complete(text);
    if (result) {
      setMessages((prev) => [...prev, { role: "assistant", content: result }]);
    }
  }

  return (
    <Card className="flex h-full min-h-[520px] flex-col">
      <CardHeader className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-subtle" />
          <CardTitle>Agent chat</CardTitle>
        </div>
        <CardDescription>
          Streaming responses from the LangGraph agent via Claude.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-0">
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-muted/60 text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && completion && (
            <div className="flex justify-start">
              <div className="max-w-[90%] rounded-md border border-border bg-muted/60 px-3 py-2 text-sm leading-relaxed">
                <p className="whitespace-pre-wrap">{completion}</p>
              </div>
            </div>
          )}

          {isLoading && !completion && (
            <div className="space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded-sm bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded-sm bg-muted" />
            </div>
          )}

          {error && (
            <p className="text-sm text-critical">
              {error.message || "Chat failed — is the agent running?"}
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-border px-4 py-4">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about exceptions, clauses, reconciliation…"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
            disabled={isLoading}
          />
          <Button type="submit" size="sm" disabled={isLoading || !draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
