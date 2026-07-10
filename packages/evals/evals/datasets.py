"""Build Braintrust datasets from labeled fixtures."""

from __future__ import annotations

from typing import Any

from shared.fixtures import load_fixture


def build_reconcile_dataset() -> list[dict[str, Any]]:
    """Return eval rows — one per fixture scenario.

    Each row has:
      - input: {fixture_id}
      - expected: list of labeled ExceptionFlag dicts
      - metadata: fixture manifest info
    """
    rows: list[dict[str, Any]] = []

    # Expand with more fixture IDs as scenarios are added.
    for fixture_id in ("nextera-systems", "harbor-analytics"):
        fixture = load_fixture(fixture_id)
        rows.append(
            {
                "input": {"fixture_id": fixture_id},
                "expected": [
                    exc.model_dump(mode="json") for exc in fixture.expected_exceptions
                ],
                "metadata": {
                    "fixture_id": fixture_id,
                    "fixture_name": fixture.manifest.name,
                    "invoice_count": len(fixture.invoices),
                },
            },
        )

    return rows
