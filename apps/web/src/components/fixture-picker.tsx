"use client";

import type { FixtureId } from "@/lib/fixtures";
import { FIXTURE_LIST } from "@/lib/fixtures";
import { cn } from "@/lib/utils";

interface FixturePickerProps {
  value: FixtureId;
  disabled?: boolean;
  onChange: (fixtureId: FixtureId) => void;
}

export function FixturePicker({ value, disabled, onChange }: FixturePickerProps) {
  return (
    <div
      className="inline-flex rounded-md border border-border bg-muted/40 p-0.5"
      role="tablist"
      aria-label="Fixture scenario"
    >
      {FIXTURE_LIST.map((fixture) => {
        const selected = value === fixture.id;

        return (
          <button
            key={fixture.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(fixture.id)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                : "text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {fixture.name}
          </button>
        );
      })}
    </div>
  );
}
