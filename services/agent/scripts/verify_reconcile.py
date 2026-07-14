"""Smoke-test the reconcile graph against nextera-systems."""

from __future__ import annotations

import asyncio

from shared.fixtures import load_fixture

from agent.graph import compiled_reconcile_graph


async def main() -> None:
    """Run reconciliation and assert labeled exceptions are found."""
    fixture = load_fixture("nextera-systems")
    expected_ids = {exc.invoice_id for exc in fixture.expected_exceptions}

    result = await compiled_reconcile_graph.ainvoke(
        {
            "fixture_id": "nextera-systems",
            "contract_path": "",
            "invoice_paths": [],
            "obligations": [],
            "reconciliation_results": [],
            "exceptions": [],
            "report": "",
            "agent_trace": [],
        },
    )

    found_ids = {
        exc.invoice_id if hasattr(exc, "invoice_id") else exc["invoice_id"]
        for exc in result["exceptions"]
    }
    assert found_ids == expected_ids
    assert len(result["report"]) > 100
    assert len(result["agent_trace"]) == 3
    print(
        "OK: exceptions =",
        len(result["exceptions"]),
        "| report chars =",
        len(result["report"]),
        "| trace events =",
        len(result["agent_trace"]),
    )


if __name__ == "__main__":
    asyncio.run(main())
