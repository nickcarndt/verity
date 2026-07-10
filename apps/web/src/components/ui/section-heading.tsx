import { cn } from "@/lib/utils";

interface MetaLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function MetaLabel({ children, className }: MetaLabelProps) {
  return (
    <p
      className={cn(
        "text-xs font-medium uppercase tracking-wide text-subtle",
        className,
      )}
    >
      {children}
    </p>
  );
}

interface SectionHeadingProps {
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeading({ title, description, className }: SectionHeadingProps) {
  return (
    <div className={className}>
      <h3 className="text-xl font-semibold tracking-[-0.01em]">{title}</h3>
      {description && (
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
