"""LangGraph graph definitions for Verity."""

from langgraph.graph.state import CompiledStateGraph

from agent.agents.pipeline import build_reconcile_pipeline


def build_reconcile_graph() -> CompiledStateGraph:
    """Build the fixed reconcile pipeline (extract → reconcile → report)."""
    return build_reconcile_pipeline()


compiled_reconcile_graph = build_reconcile_graph()
