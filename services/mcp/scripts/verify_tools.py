"""Smoke-test MCP tools against the nextera-systems fixture."""

from __future__ import annotations

from shared.fixtures import load_fixture

from mcp_server.tools.extract_obligations import extract_obligations
from mcp_server.tools.parse_invoice import parse_invoice
from mcp_server.tools.reconcile import reconcile


def main() -> None:
    """Run all three tools on the nextera-systems fixture."""
    fixture = load_fixture("nextera-systems")
    contract_path = "data/fixtures/nextera-systems/contract.json"

    obligations = extract_obligations(contract_path)
    assert len(obligations) == len(fixture.expected_obligations)

    known_numbers: list[str] = []
    flagged: list[str] = []

    for invoice_file in fixture.manifest.invoice_files:
        invoice_path = f"data/fixtures/nextera-systems/{invoice_file}"
        invoice = parse_invoice(invoice_path)
        result = reconcile(invoice, obligations, known_invoice_numbers=known_numbers)

        if result["status"] == "flagged":
            flagged.append(invoice["id"])
        known_numbers.append(invoice["invoice_number"])

    assert flagged == ["inv-2025-002", "inv-2025-003", "inv-2025-004", "inv-2025-005"]
    print("OK: obligations =", len(obligations), "| flagged invoices =", flagged)


if __name__ == "__main__":
    main()
