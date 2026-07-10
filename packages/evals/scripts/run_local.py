"""Run the reconcile eval locally (no Braintrust API key required)."""

from evals.experiments.reconcile_baseline import run_local

if __name__ == "__main__":
    raise SystemExit(run_local())
