import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium leading-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-border bg-muted text-foreground",
        outline: "border-border text-foreground",
        critical: "border-transparent bg-critical-bg text-critical",
        high: "border-transparent bg-critical-bg text-critical",
        medium: "border-transparent bg-warning-bg text-warning",
        low: "border-transparent bg-info-bg text-info",
        warning: "border-transparent bg-warning-bg text-warning",
        info: "border-transparent bg-info-bg text-info",
        success: "border-transparent bg-success-bg text-success",
        brand: "border-transparent bg-brand-subtle text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
