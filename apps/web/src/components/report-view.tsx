import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportViewProps {
  report: string;
  reportError?: string | null;
}

export function ReportView({ report, reportError }: ReportViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent report</CardTitle>
        <CardDescription>
          {reportError
            ? "Structured exceptions succeeded; Claude report generation failed."
            : "Claude-generated exception summary with clause citations."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reportError && (
          <p className="mb-3 rounded-md border border-critical/20 bg-critical-bg px-3 py-2 text-sm text-critical">
            Report error: {reportError}
          </p>
        )}
        <div className="max-h-[32rem] overflow-auto rounded-md border border-border bg-muted/30 p-5">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h2 className="mb-3 text-base font-semibold tracking-[-0.01em] text-foreground first:mt-0">
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h3 className="mb-2 mt-5 text-sm font-semibold text-foreground first:mt-0">
                  {children}
                </h3>
              ),
              h3: ({ children }) => (
                <h4 className="mb-2 mt-4 text-sm font-semibold text-foreground">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground last:mb-0">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
              ul: ({ children }) => (
                <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground last:mb-0">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground last:mb-0">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="mb-3 border-l-2 border-primary/40 bg-brand-subtle/50 py-2 pl-3 pr-3 text-sm italic leading-relaxed text-foreground last:mb-0">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="my-4 border-border" />,
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
              code: ({ className, children }) => {
                const isBlock = Boolean(className?.includes("language-"));
                if (isBlock) {
                  return (
                    <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[12px] text-foreground">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="mb-3 overflow-x-auto rounded-md border border-border bg-card last:mb-0">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="mb-3 overflow-x-auto last:mb-0">
                  <table className="w-full border-collapse text-left text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b border-border text-xs uppercase tracking-wide text-subtle">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
              tr: ({ children }) => <tr className="align-top">{children}</tr>,
              th: ({ children }) => (
                <th className="px-3 py-2 font-medium text-subtle first:pl-0 last:pr-0">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-3 py-2 text-muted-foreground first:pl-0 last:pr-0">{children}</td>
              ),
            }}
          >
            {normalizeReportMarkdown(report)}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

/** Light cleanup so Claude's loose markdown still renders cleanly. */
function normalizeReportMarkdown(report: string): string {
  return report
    .replace(/^[•▪︎]\s+/gm, "- ")
    .replace(/\n\|/g, "\n|")
    .trim();
}
