"""Fixed reconcile pipeline: extract → reconcile → report → summarize trace."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from agent.agents.common import trace_entry
from agent.agents.contract_agent import build_contract_agent
from agent.agents.reconciliation_agent import build_reconciliation_agent
from agent.agents.report_agent import build_report_agent
from agent.schemas import AgentTraceEvent
from agent.state import ReconcileState


def finalize_trace(state: ReconcileState) -> dict[str, list[AgentTraceEvent]]:
    """Summarize specialist steps after the pipeline completes."""
    flagged = sum(1 for r in state["reconciliation_results"] if r.status == "flagged")
    matched = len(state["reconciliation_results"]) - flagged

    return {
        "agent_trace": [
            trace_entry(
                "contract_agent",
                "extract_obligations",
                (
                    f"Loaded {state['fixture_id']} — "
                    f"extracted {len(state['obligations'])} obligations"
                ),
            ),
            trace_entry(
                "reconciliation_agent",
                "reconcile_invoices",
                (
                    f"Reconciled {len(state['reconciliation_results'])} invoices — "
                    f"{flagged} flagged, {matched} matched"
                ),
            ),
            trace_entry(
                "report_agent",
                "generate_report",
                f"Generated cited report for {len(state['exceptions'])} exceptions",
            ),
        ],
    }


def build_reconcile_pipeline() -> CompiledStateGraph:
    """Build the fixed specialist pipeline for reconciliation.

    Flow:
      contract_agent → reconciliation_agent → report_agent → finalize_trace

    Each specialist is a compiled LangGraph subgraph — visible as nested spans
    in Braintrust traces. Routing is fixed (not LLM-decided).
    """
    graph = StateGraph(ReconcileState)
    graph.add_node("contract_agent", build_contract_agent())
    graph.add_node("reconciliation_agent", build_reconciliation_agent())
    graph.add_node("report_agent", build_report_agent())
    graph.add_node("finalize_trace", finalize_trace)

    graph.add_edge(START, "contract_agent")
    graph.add_edge("contract_agent", "reconciliation_agent")
    graph.add_edge("reconciliation_agent", "report_agent")
    graph.add_edge("report_agent", "finalize_trace")
    graph.add_edge("finalize_trace", END)
    return graph.compile(name="verity_reconcile_pipeline")


# Back-compat alias for any external imports.
build_supervisor_graph = build_reconcile_pipeline
