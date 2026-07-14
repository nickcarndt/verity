"""LangGraph state schemas for the Verity agent."""

from typing import TypedDict

from shared.reconciliation import ExceptionFlag, ReconciliationResult

from agent.schemas import AgentTraceEvent


class ReconcileState(TypedDict):
    """State for the reconcile pipeline graph."""

    fixture_id: str
    contract_path: str
    invoice_paths: list[str]
    obligations: list[dict[str, object]]
    reconciliation_results: list[ReconciliationResult]
    exceptions: list[ExceptionFlag]
    report: str
    report_error: str | None
    agent_trace: list[AgentTraceEvent]
