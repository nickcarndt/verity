import type { ExceptionFlag } from "@/lib/agent";

export type EvalScore = {
  name: string;
  label: string;
  score: number;
  passed: boolean;
};

type ExceptionKey = string;

function exceptionKeys(exceptions: ExceptionFlag[]): Set<ExceptionKey> {
  return new Set(exceptions.map((e) => `${e.invoice_id}:${e.type}` as ExceptionKey));
}

function matchedPairs(
  actual: ExceptionFlag[],
  expected: ExceptionFlag[],
): Array<[ExceptionFlag, ExceptionFlag]> {
  const expectedByKey = new Map<string, ExceptionFlag>(
    expected.map((e) => [`${e.invoice_id}:${e.type}`, e]),
  );
  const pairs: Array<[ExceptionFlag, ExceptionFlag]> = [];
  for (const act of actual) {
    const key = `${act.invoice_id}:${act.type}`;
    const exp = expectedByKey.get(key);
    if (exp) pairs.push([act, exp]);
  }
  return pairs;
}

function scoreResult(name: string, label: string, score: number): EvalScore {
  return { name, label, score, passed: score === 1 };
}

export function runEvalScorers(
  actual: ExceptionFlag[],
  expected: ExceptionFlag[],
): EvalScore[] {
  const actualKeys = exceptionKeys(actual);
  const expectedKeys = exceptionKeys(expected);

  const recallMatched = [...actualKeys].filter((k) => expectedKeys.has(k)).length;
  const recall =
    expectedKeys.size === 0 ? 1 : recallMatched / expectedKeys.size;

  const precision =
    actualKeys.size === 0
      ? expectedKeys.size === 0
        ? 1
        : 0
      : recallMatched / actualKeys.size;

  const pairs = matchedPairs(actual, expected);
  const clauseAccuracy =
    pairs.length === 0
      ? 0
      : pairs.filter(([a, e]) => a.clause_ref.section === e.clause_ref.section).length /
        pairs.length;

  const dollarAccuracy =
    pairs.length === 0
      ? 0
      : pairs.filter(([a, e]) => {
          const diff = Math.abs(parseFloat(a.dollar_impact) - parseFloat(e.dollar_impact));
          return diff <= 0.01;
        }).length / pairs.length;

  return [
    scoreResult("exception_recall", "Exception recall", recall),
    scoreResult("exception_precision", "Exception precision", precision),
    scoreResult("clause_section_accuracy", "Clause citation", clauseAccuracy),
    scoreResult("dollar_impact_accuracy", "Dollar impact", dollarAccuracy),
  ];
}

export function allScoresPassed(scores: EvalScore[]): boolean {
  return scores.every((s) => s.passed);
}
