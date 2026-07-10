import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReportViewProps {
  report: string;
}

export function ReportView({ report }: ReportViewProps) {
  const lines = report.split("\n");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent report</CardTitle>
        <CardDescription>
          Claude-generated exception summary with clause citations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 space-y-1 overflow-auto rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed">
          {lines.map((line, index) => {
            if (line.startsWith("# ")) {
              return (
                <h2 key={index} className="pt-2 text-base font-semibold first:pt-0">
                  {line.slice(2)}
                </h2>
              );
            }
            if (line.startsWith("## ") || line.startsWith("### ")) {
              const level = line.startsWith("### ") ? 3 : 2;
              const text = line.slice(level + 1);
              return (
                <h3
                  key={index}
                  className={cn(
                    "font-semibold text-foreground",
                    level === 2 ? "pt-3 text-sm" : "pt-2 text-sm",
                  )}
                >
                  {text}
                </h3>
              );
            }
            if (line.startsWith("- ")) {
              return (
                <p key={index} className="pl-4 text-muted-foreground">
                  • {line.slice(2)}
                </p>
              );
            }
            if (line.trim() === "---") {
              return <hr key={index} className="my-2 border-border" />;
            }
            if (line.trim() === "") {
              return <div key={index} className="h-2" />;
            }
            return (
              <p key={index} className="text-muted-foreground">
                {line}
              </p>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
