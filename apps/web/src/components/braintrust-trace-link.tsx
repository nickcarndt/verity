import { cn } from "@/lib/utils";

interface BraintrustTraceLinkProps {
  /** Retained for API compatibility; permalinks are not shown publicly. */
  url?: string | null;
  className?: string;
  variant?: "button" | "inline";
}

// TODO: Restore a public "View trace in Braintrust" link if the Braintrust
// project is made publicly viewable (current permalinks 404 without project access).

/** Quiet status copy — not a clickable control. */
export function BraintrustTraceLink({
  className,
}: BraintrustTraceLinkProps) {
  return (
    <p className={cn("text-xs text-subtle", className)}>
      Run traced in Braintrust
    </p>
  );
}
