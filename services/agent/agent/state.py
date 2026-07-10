"""LangGraph state schemas for the Verity agent."""

from typing import TypedDict


class AgentState(TypedDict):
    """State for the freeform chat graph (Phase 1)."""

    message: str
    response: str


class ReconcileState(TypedDict):
    """State for the multi-agent reconciliation graph."""

    fixture_id: str
    contract_path: str
    invoice_paths: list[str]
    obligations: list[dict[str, object]]
    reconciliation_results: list[dict[str, object]]
    exceptions: list[dict[str, object]]
    report: str
    agent_trace: list[dict[str, object]]
