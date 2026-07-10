export function ExceptionTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className="flex gap-4 border-b border-border bg-muted/60 px-4 py-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="h-3 flex-1 animate-pulse rounded-sm bg-muted"
          />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, row) => (
        <div
          key={row}
          className={`flex gap-4 px-4 py-[13px] ${row % 2 === 1 ? "bg-muted/40" : "bg-card"}`}
        >
          {Array.from({ length: 7 }).map((_, col) => (
            <div
              key={col}
              className="h-4 flex-1 animate-pulse rounded-sm bg-muted"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
