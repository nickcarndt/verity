# Evals

Braintrust eval harness for Verity — scores reconcile output against labeled fixtures.

## What it measures

| Scorer | Meaning |
|---|---|
| `exception_recall` | Fraction of labeled exceptions detected |
| `exception_precision` | Fraction of detections that match a label |
| `clause_section_accuracy` | Correct contract clause section on matched exceptions |
| `dollar_impact_accuracy` | Correct dollar impact (±$0.01) on matched exceptions |

## Run locally (no API key)

```bash
cd packages/evals
python3 -m venv .venv && source .venv/bin/activate
pip install -e ../../packages/shared
pip install "mcp>=1.28.0" "pydantic>=2.0"
pip install --no-deps -e ../../services/mcp
pip install -e .
python scripts/run_local.py
```

Or via CLI:

```bash
verity-eval --local
```

## Upload to Braintrust

```bash
export BRAINTRUST_API_KEY=<your-key>
export BRAINTRUST_PROJECT=verity
verity-eval --experiment mcp-reconcile-baseline
```

## Architecture

The eval task runs MCP tools **in-process** (not over HTTP) for deterministic, CI-friendly scoring. It compares output to `data/fixtures/*/labels/expected_exceptions.json`.

Later experiments can add agent end-to-end evals (`POST /reconcile`) and LLM-as-judge scorers for report quality.
