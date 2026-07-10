import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

interface BraintrustTraceLinkProps {
  url: string | null | undefined;
  className?: string;
  variant?: "button" | "inline";
}

export function BraintrustTraceLink({
  url,
  className,
  variant = "button",
}: BraintrustTraceLinkProps) {
  if (!url) {
    return (
      <p className={cn("text-xs text-subtle", className)}>
        Tracing off — set{" "}
        <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[10px]">
          BRAINTRUST_API_KEY
        </code>{" "}
        on the agent to link runs.
      </p>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline",
          className,
        )}
      >
        View in Braintrust
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted",
        className,
      )}
    >
      <ExternalLink className="h-3.5 w-3.5 text-primary" />
      View trace in Braintrust
    </a>
  );
}
