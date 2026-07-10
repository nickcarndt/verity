"""LangGraph graph definitions for Verity."""

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph

from agent.agents.supervisor import build_supervisor_graph
from agent.config import Settings, get_settings
from agent.state import AgentState


def _build_model(settings: Settings) -> ChatAnthropic:
    """Create a ChatAnthropic client from settings."""
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set")

    return ChatAnthropic(
        model=settings.agent_model,
        api_key=settings.anthropic_api_key,
    )


def call_claude(state: AgentState) -> dict[str, str]:
    """Graph node: send the user message to Claude and store the reply."""
    settings = get_settings()
    model = _build_model(settings)
    result = model.invoke([HumanMessage(content=state["message"])])
    content = result.content
    if not isinstance(content, str):
        content = str(content)
    return {"response": content}


def build_graph() -> CompiledStateGraph:
    """Build the Phase 1 freeform chat graph."""
    graph = StateGraph(AgentState)
    graph.add_node("call_claude", call_claude)
    graph.set_entry_point("call_claude")
    graph.add_edge("call_claude", END)
    return graph.compile()


def build_reconcile_graph() -> CompiledStateGraph:
    """Build the multi-agent supervisor graph for reconciliation."""
    return build_supervisor_graph()


compiled_graph = build_graph()
compiled_reconcile_graph = build_reconcile_graph()
