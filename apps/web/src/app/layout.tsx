import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Verity — Invoice Reconciliation",
  description: "Autonomous invoice reconciliation grounded in contract clauses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="min-h-screen">
          <header className="border-b border-border bg-card">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                  V
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">Verity</p>
                  <p className="text-xs text-muted-foreground">Invoice reconciliation</p>
                </div>
              </div>
              <p className="hidden text-xs font-medium text-subtle sm:block">
                Clause-grounded exceptions
              </p>
            </div>
          </header>
          <main className="px-6 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
