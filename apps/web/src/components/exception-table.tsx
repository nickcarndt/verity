"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { KeyboardHints } from "@/components/keyboard-hints";
import { Badge } from "@/components/ui/badge";
import { useExceptionKeyboardNav } from "@/hooks/use-exception-keyboard-nav";
import type { ExceptionFlag } from "@/lib/agent";
import { exceptionTypeVariant, type SeverityFilter, SEVERITY_FILTERS } from "@/lib/exception-ui";
import {
  cn,
  formatCurrency,
  formatExceptionType,
  severityImpactClass,
} from "@/lib/utils";

const severityVariant = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
} as const;

interface SeverityBadgeProps {
  severity: ExceptionFlag["severity"];
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <Badge variant={severityVariant[severity]} className="capitalize">
      {severity}
    </Badge>
  );
}

interface ExceptionTableProps {
  exceptions: ExceptionFlag[];
  vendorName?: string;
  focusedId: string | null;
  drawerOpen: boolean;
  keyboardEnabled?: boolean;
  highlightedSection: string | null;
  onFocusChange: (exception: ExceptionFlag) => void;
  onOpen: (exception: ExceptionFlag) => void;
  onCloseDrawer: () => void;
  onClauseClick: (section: string) => void;
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="h-3 w-3" />;
  if (sorted === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" />;
}

export function ExceptionTable({
  exceptions,
  vendorName = "Nextera Systems, Inc.",
  focusedId,
  drawerOpen,
  keyboardEnabled = true,
  highlightedSection,
  onFocusChange,
  onOpen,
  onCloseDrawer,
  onClauseClick,
}: ExceptionTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "dollar_impact", desc: true },
  ]);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const filteredExceptions = useMemo(() => {
    if (severityFilter === "all") return exceptions;
    return exceptions.filter((exc) => exc.severity === severityFilter);
  }, [exceptions, severityFilter]);

  const totalImpact = useMemo(
    () =>
      filteredExceptions.reduce((sum, exc) => sum + parseFloat(exc.dollar_impact), 0),
    [filteredExceptions],
  );

  const columns = useMemo<ColumnDef<ExceptionFlag>[]>(
    () => [
      {
        accessorKey: "invoice_id",
        header: "Invoice #",
        cell: ({ row }) => (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {row.original.invoice_id}
          </span>
        ),
      },
      {
        id: "vendor",
        header: "Vendor",
        cell: () => <span className="text-sm">{vendorName}</span>,
        enableSorting: false,
      },
      {
        accessorKey: "type",
        header: "Exception",
        cell: ({ row }) => (
          <Badge variant={exceptionTypeVariant(row.original.type)}>
            {formatExceptionType(row.original.type)}
          </Badge>
        ),
      },
      {
        accessorKey: "severity",
        header: "Severity",
        cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
      },
      {
        accessorKey: "dollar_impact",
        header: () => <span className="block w-full text-right">$ Impact</span>,
        cell: ({ row }) => (
          <span className={cn("block text-right", severityImpactClass(row.original.severity))}>
            {formatCurrency(row.original.dollar_impact)}
          </span>
        ),
        sortingFn: (a, b) =>
          parseFloat(a.original.dollar_impact) - parseFloat(b.original.dollar_impact),
      },
      {
        id: "clause",
        header: "Clause",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            type="button"
            className="font-mono text-xs text-primary underline-offset-2 hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              onClauseClick(row.original.clause_ref.section);
            }}
          >
            §{row.original.clause_ref.section}
            {highlightedSection === row.original.clause_ref.section && (
              <span className="ml-1 text-warning">●</span>
            )}
          </button>
        ),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: () => <Badge variant="warning">Flagged</Badge>,
      },
    ],
    [vendorName, highlightedSection, onClauseClick],
  );

  const table = useReactTable({
    data: filteredExceptions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const visibleRows = table.getRowModel().rows.map((row) => row.original);

  const scrollToRow = useCallback((id: string) => {
    const row = scrollRef.current?.querySelector(`[data-row-id="${id}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, []);

  useExceptionKeyboardNav({
    rows: visibleRows,
    focusedId,
    drawerOpen,
    enabled: keyboardEnabled && visibleRows.length > 0,
    onFocusChange,
    onOpen,
    onCloseDrawer,
    scrollToRow,
  });

  // Seed focus on first visible row when data appears or filter/sort changes focus out of view.
  useEffect(() => {
    if (visibleRows.length === 0) return;
    const focusedVisible = visibleRows.some((row) => row.id === focusedId);
    if (!focusedVisible) {
      onFocusChange(visibleRows[0]);
    }
  }, [visibleRows, focusedId, onFocusChange]);

  if (exceptions.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-success-bg px-6 py-14 text-center">
        <p className="text-sm font-medium text-success">No exceptions found</p>
        <p className="mt-1 text-sm text-muted-foreground">
          All 5 invoices reconciled cleanly against contract obligations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-subtle">Severity</span>
          {SEVERITY_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSeverityFilter(filter.id)}
              className={cn(
                "rounded-sm border px-2.5 py-1 text-xs font-medium transition-colors",
                severityFilter === filter.id
                  ? "border-primary bg-brand-subtle text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <KeyboardHints className="hidden sm:block" />
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <div ref={scrollRef} className="max-h-[min(440px,60vh)] overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-subtle",
                          header.id === "dollar_impact" && "text-right",
                        )}
                      >
                        {canSort ? (
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1 hover:text-foreground",
                              header.id === "dollar_impact" && "ml-auto",
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <SortIcon sorted={header.column.getIsSorted()} />
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, index) => {
                const isFocused = focusedId === row.original.id;
                const isOpen = drawerOpen && isFocused;

                return (
                  <tr
                    key={row.id}
                    data-row-id={row.original.id}
                    aria-selected={isFocused}
                    className={cn(
                      "h-11 cursor-pointer border-b border-border border-l-2 transition-colors last:border-b-0",
                      index % 2 === 1 ? "bg-muted/40" : "bg-card",
                      isFocused
                        ? "border-l-primary bg-brand-subtle/40"
                        : "border-l-transparent hover:bg-muted/70",
                      isOpen && "bg-brand-subtle/55",
                    )}
                    onClick={() => {
                      onFocusChange(row.original);
                      onOpen(row.original);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/30 px-3 py-2 text-xs">
          <span className="text-subtle">
            Showing {filteredExceptions.length} of {exceptions.length} exceptions
          </span>
          <div className="flex items-center gap-4">
            <KeyboardHints className="sm:hidden" />
            <span className="font-mono font-semibold tabular-nums text-critical">
              {formatCurrency(totalImpact)} at risk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
