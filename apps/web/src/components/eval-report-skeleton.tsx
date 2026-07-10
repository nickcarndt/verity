export function EvalReportSkeleton() {
  return (
    <ul className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={index}>
          <div className="mb-1.5 flex justify-between">
            <div className="h-3 w-28 animate-pulse rounded-sm bg-muted" />
            <div className="h-3 w-8 animate-pulse rounded-sm bg-muted" />
          </div>
          <div className="h-1.5 animate-pulse rounded-sm bg-muted" />
        </li>
      ))}
    </ul>
  );
}
