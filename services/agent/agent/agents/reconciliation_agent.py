"""Reconciliation specialist agent — parse and reconcile invoices via MCP."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from shared.reconciliation import ExceptionFlag, ReconciliationResult

from agent.agents.common import mcp_client
from agent.state import ReconcileState


async def reconcile_invoices(state: ReconcileState) -> dict[str, object]:
    """MCP: parse and reconcile each invoice in fixture order."""
    client = mcp_client()
    known_numbers: list[str] = []
    reconciliation_results: list[ReconciliationResult] = []
    exceptions: list[ExceptionFlag] = []

    for invoice_path in state["invoice_paths"]:
        invoice = await client.call_tool("parse_invoice", {"file_path": invoice_path})
        result = await client.call_tool(
            "reconcile",
            {
                "invoice": invoice,
                "obligations": state["obligations"],
                "known_invoice_numbers": known_numbers,
            },
        )
        parsed = ReconciliationResult.model_validate(result)
        reconciliation_results.append(parsed)
        exceptions.extend(parsed.exceptions)
        known_numbers.append(str(invoice["invoice_number"]))

    return {
        "reconciliation_results": reconciliation_results,
        "exceptions": exceptions,
    }


def build_reconciliation_agent() -> CompiledStateGraph:
    """Compile the reconciliation specialist subgraph."""
    graph = StateGraph(ReconcileState)
    graph.add_node("reconcile_invoices", reconcile_invoices)
    graph.add_edge(START, "reconcile_invoices")
    graph.add_edge("reconcile_invoices", END)
    return graph.compile(name="reconciliation_agent")
