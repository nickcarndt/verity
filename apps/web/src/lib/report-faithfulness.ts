import type { ExceptionFlag } from "@/lib/agent";
import type { EvalScore } from "@/lib/eval";

export type ReportFaithfulnessChecks = {
  invoice_ids_grounded: boolean;
  clause_sections_grounded: boolean;
  dollar_amounts_grounded: boolean;
};

export type ReportFaithfulnessResult = {
  score: number;
  passed: boolean;
  checks: ReportFaithfulnessChecks;
  scores: EvalScore[];
};

const INVOICE_ID_RE = /\b(inv-[a-z0-9-]+)\b/gi;
const SECTION_RE = /(?:section|§)\s*([0-9]+(?:\.[0-9]+)*)/gi;
const DOLLAR_RE = /\$\s*([\d,]+(?:\.\d{2})?)/g;

function normalizeMoney(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

function moneyFromText(text: string): Set<number> {
  const amounts = new Set<number>();
  for (const match of text.matchAll(DOLLAR_RE)) {
    amounts.add(normalizeMoney(match[1]));
  }
  return amounts;
}

function nearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 0.01;
}

function setContainsMoney(allowed: Set<number>, value: number): boolean {
  for (const candidate of allowed) {
    if (nearlyEqual(candidate, value)) return true;
  }
  return false;
}

export function scoreReportFaithfulness(args: {
  report: string;
  exceptions: ExceptionFlag[];
  invoiceIds: string[];
  contractSections: string[];
}): ReportFaithfulnessResult {
  const { report, exceptions, invoiceIds, contractSections } = args;

  if (!report.trim()) {
    const checks = {
      invoice_ids_grounded: false,
      clause_sections_grounded: false,
      dollar_amounts_grounded: false,
    };
    return emptyResult(checks);
  }

  const citedInvoices = new Set(
    [...report.matchAll(INVOICE_ID_RE)].map((m) => m[1].toLowerCase()),
  );
  const citedSections = new Set([...report.matchAll(SECTION_RE)].map((m) => m[1]));
  const citedDollars = moneyFromText(report);

  const okInvoices = new Set(invoiceIds.map((id) => id.toLowerCase()));
  const okSections = new Set(contractSections);
  const okDollars = new Set<number>();
  let impactSum = 0;
  for (const exc of exceptions) {
    okSections.add(exc.clause_ref.section);
    for (const match of exc.clause_ref.text.matchAll(SECTION_RE)) {
      okSections.add(match[1]);
    }
    for (const match of exc.evidence.matchAll(SECTION_RE)) {
      okSections.add(match[1]);
    }
    for (const match of exc.description.matchAll(SECTION_RE)) {
      okSections.add(match[1]);
    }

    const impact = parseFloat(exc.dollar_impact);
    impactSum += impact;
    okDollars.add(impact);
    for (const amount of moneyFromText(exc.evidence)) okDollars.add(amount);
    for (const amount of moneyFromText(exc.description)) okDollars.add(amount);
    for (const amount of moneyFromText(exc.clause_ref.text)) okDollars.add(amount);
  }
  okDollars.add(impactSum);

  let invoiceOk = true;
  for (const id of citedInvoices) {
    if (!okInvoices.has(id)) invoiceOk = false;
  }

  let sectionOk = true;
  for (const section of citedSections) {
    if (!okSections.has(section)) sectionOk = false;
  }

  let dollarOk = true;
  for (const amount of citedDollars) {
    if (!setContainsMoney(okDollars, amount)) dollarOk = false;
  }

  const checks: ReportFaithfulnessChecks = {
    invoice_ids_grounded: invoiceOk,
    clause_sections_grounded: sectionOk,
    dollar_amounts_grounded: dollarOk,
  };

  const scores: EvalScore[] = [
    {
      name: "invoice_ids_grounded",
      label: "Invoice IDs grounded",
      score: invoiceOk ? 1 : 0,
      passed: invoiceOk,
    },
    {
      name: "clause_sections_grounded",
      label: "Clause sections grounded",
      score: sectionOk ? 1 : 0,
      passed: sectionOk,
    },
    {
      name: "dollar_amounts_grounded",
      label: "Dollar amounts grounded",
      score: dollarOk ? 1 : 0,
      passed: dollarOk,
    },
  ];

  const score = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  return {
    score,
    passed: scores.every((s) => s.passed),
    checks,
    scores,
  };
}

function emptyResult(checks: ReportFaithfulnessChecks): ReportFaithfulnessResult {
  const scores: EvalScore[] = [
    {
      name: "invoice_ids_grounded",
      label: "Invoice IDs grounded",
      score: 0,
      passed: false,
    },
    {
      name: "clause_sections_grounded",
      label: "Clause sections grounded",
      score: 0,
      passed: false,
    },
    {
      name: "dollar_amounts_grounded",
      label: "Dollar amounts grounded",
      score: 0,
      passed: false,
    },
  ];
  return { score: 0, passed: false, checks, scores };
}
