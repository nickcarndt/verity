import { cn } from "@/lib/utils";

interface KeyboardHintsProps {
  className?: string;
}

export function KeyboardHints({ className }: KeyboardHintsProps) {
  return (
    <p className={cn("text-xs text-subtle", className)}>
      <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
      <span className="mx-2 text-border">·</span>
      <Kbd>Enter</Kbd> open trace
      <span className="mx-2 text-border">·</span>
      <Kbd>Esc</Kbd> close
    </p>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}
