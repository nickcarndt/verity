"""Baseline reconcile eval — MCP tools vs labeled fixtures (+ report faithfulness CI)."""

from __future__ import annotations

import argparse
import os
import sys

from braintrust import Eval

from evals.datasets import build_reconcile_dataset
from evals.report_faithfulness import (
    build_faithful_report,
    build_unfaithful_report,
    score_report_faithfulness,
)
from evals.scorers import ALL_SCORERS
from evals.tasks import run_fixture_reconcile


def run_local() -> int:
    """Run detection scorers + synthetic report faithfulness checks (no Claude)."""
    rows = build_reconcile_dataset()
    all_pass = True

    for row in rows:
        fixture_id = row["input"]["fixture_id"]
        print(f"\n=== {fixture_id} (detection) ===")
        output = run_fixture_reconcile(row["input"])

        for scorer in ALL_SCORERS:
            result = scorer(row["input"], output, row["expected"], row.get("metadata"))
            score = result["score"]
            status = "PASS" if score == 1.0 else "FAIL"
            if score != 1.0:
                all_pass = False
            print(f"  {result['name']}: {score:.2f} [{status}]")

        print(f"\n=== {fixture_id} (report faithfulness — synthetic) ===")
        faithful = {**output, "report": build_faithful_report(output)}
        good = score_report_faithfulness(
            faithful["report"],
            faithful,
            row.get("metadata"),
        )
        good_status = "PASS" if good["score"] == 1.0 else "FAIL"
        if good["score"] != 1.0:
            all_pass = False
        print(f"  report_faithfulness (faithful): {good['score']:.2f} [{good_status}] {good['checks']}")

        bad_report = build_unfaithful_report(output)
        bad = score_report_faithfulness(bad_report, output, row.get("metadata"))
        bad_status = "PASS" if bad["score"] < 1.0 else "FAIL"
        if bad["score"] == 1.0:
            all_pass = False
        print(f"  report_faithfulness (unfaithful): {bad['score']:.2f} [{bad_status}] {bad['checks']}")

    return 0 if all_pass else 1


def run_braintrust(experiment_name: str | None = None) -> None:
    """Upload detection eval results to Braintrust."""
    project = os.environ.get("BRAINTRUST_PROJECT", "verity")
    Eval(
        project,
        experiment_name=experiment_name or "mcp-reconcile-baseline",
        data=build_reconcile_dataset(),
        task=run_fixture_reconcile,
        scores=ALL_SCORERS,
        metadata={"pipeline": "mcp-tools-in-process"},
    )


def main() -> None:
    """CLI entry point for the reconcile baseline eval."""
    parser = argparse.ArgumentParser(description="Run Verity reconcile eval harness")
    parser.add_argument(
        "--local",
        action="store_true",
        help="Run scorers locally without uploading to Braintrust",
    )
    parser.add_argument(
        "--experiment",
        default="mcp-reconcile-baseline",
        help="Braintrust experiment name (when uploading)",
    )
    args = parser.parse_args()

    if args.local:
        sys.exit(run_local())

    if not os.environ.get("BRAINTRUST_API_KEY"):
        print("BRAINTRUST_API_KEY not set — running local eval instead.")
        sys.exit(run_local())

    run_braintrust(args.experiment)


if __name__ == "__main__":
    main()
