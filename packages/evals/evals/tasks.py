"""Eval task functions — run the reconcile pipeline in-process."""

from __future__ import annotations

from typing import Any

from mcp_server.tools.extract_obligations import extract_obligations
from mcp_server.tools.parse_invoice import parse_invoice
from mcp_server.tools.reconcile import reconcile
from shared.fixtures import load_fixture


def run_fixture_reconcile(input: dict[str, Any]) -> dict[str, Any]:
    """Run MCP reconcile tools on a fixture and return structured exceptions.

    Runs in-process (no HTTP) so evals are deterministic and CI-friendly.
    """
    fixture_id = input["fixture_id"]
    fixture = load_fixture(fixture_id)
    base = f"data/fixtures/{fixture_id}"

    contract_path = f"{base}/{fixture.manifest.contract_file}"
    obligations = extract_obligations(contract_path)

    known_numbers: list[str] = []
    reconciliation_results: list[dict[str, Any]] = []
    exceptions: list[dict[str, Any]] = []

    for invoice_file in fixture.manifest.invoice_files:
        invoice_path = f"{base}/{invoice_file}"
        invoice = parse_invoice(invoice_path)
        result = reconcile(
            invoice,
            obligations,
            known_invoice_numbers=known_numbers,
        )
        reconciliation_results.append(result)
        exceptions.extend(result.get("exceptions", []))
        known_numbers.append(invoice["invoice_number"])

    return {
        "fixture_id": fixture_id,
        "exceptions": exceptions,
        "reconciliation_results": reconciliation_results,
    }
