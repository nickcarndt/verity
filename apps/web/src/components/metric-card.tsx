"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { cn, formatCurrency } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  animate?: boolean;
  valueClassName?: string;
  format?: "number" | "currency";
}

export function MetricCard({
  label,
  value,
  subtitle,
  animate = false,
  valueClassName,
  format = "number",
}: MetricCardProps) {
  const numericValue = typeof value === "number" ? value : parseFloat(value);
  const animated = useAnimatedNumber(numericValue, animate && typeof value === "number");

  const displayValue =
    format === "currency"
      ? formatCurrency(animate && typeof value === "number" ? animated : numericValue)
      : animate && typeof value === "number"
        ? Math.round(animated).toString()
        : value.toString();

  return (
    <Card>
      <CardHeader className="gap-1 pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn("font-mono text-[28px] leading-none tabular-nums", valueClassName)}
        >
          {displayValue}
        </CardTitle>
        {subtitle && <p className="text-xs text-subtle">{subtitle}</p>}
      </CardHeader>
    </Card>
  );
}
