"""Contract specialist agent — fixture setup and obligation extraction."""

from __future__ import annotations

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from shared.fixtures import load_fixture

from agent.agents.common import mcp_client
from agent.state import ReconcileState


def setup_fixture(state: ReconcileState) -> dict[str, object]:
    """Resolve contract and invoice paths for the requested fixture."""
    fixture = load_fixture(state["fixture_id"])
    base = f"data/fixtures/{state['fixture_id']}"
    contract_path = f"{base}/{fixture.manifest.contract_file}"
    invoice_paths = [f"{base}/{invoice_file}" for invoice_file in fixture.manifest.invoice_files]
    return {
        "contract_path": contract_path,
        "invoice_paths": invoice_paths,
        "obligations": [],
        "reconciliation_results": [],
        "exceptions": [],
        "report": "",
    }


async def extract_obligations(state: ReconcileState) -> dict[str, object]:
    """MCP: extract payment obligations from the contract file."""
    client = mcp_client()
    obligations = await client.call_tool(
        "extract_obligations",
        {"contract_file_path": state["contract_path"]},
    )
    return {"obligations": obligations}


def build_contract_agent() -> CompiledStateGraph:
    """Compile the contract specialist subgraph."""
    graph = StateGraph(ReconcileState)
    graph.add_node("setup_fixture", setup_fixture)
    graph.add_node("extract_obligations", extract_obligations)
    graph.add_edge(START, "setup_fixture")
    graph.add_edge("setup_fixture", "extract_obligations")
    graph.add_edge("extract_obligations", END)
    return graph.compile(name="contract_agent")
