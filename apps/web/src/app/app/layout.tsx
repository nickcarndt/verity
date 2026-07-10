import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                V
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Verity</p>
                <p className="text-xs text-muted-foreground">Invoice reconciliation</p>
              </div>
            </Link>
          </div>
          <p className="hidden text-xs font-medium text-subtle sm:block">
            Clause-grounded exceptions
          </p>
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
