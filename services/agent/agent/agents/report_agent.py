"""Report specialist agent — Claude cited exception summary."""

from __future__ import annotations

import json

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from agent.agents.common import build_model
from agent.config import get_settings
from agent.state import ReconcileState

_REPORT_SYSTEM = """You are Verity, a clause-grounded invoice-reconciliation reporter.

You receive structured reconciliation results from MCP tools. Write a concise
exception report for a financial controller.

Requirements:
- Lead with a one-line executive summary (invoices reviewed, exceptions found, total dollar impact).
- List only FLAGGED exceptions — do not invent issues not present in the data.
- For each exception include: severity, type, dollar impact, invoice ID, and the exact contract clause citation (section + verbatim text from clause_ref).
- Use markdown headings and bullet points.
- End with a short "Clean invoices" line listing invoice IDs with status "matched".
"""


def _build_report_prompt(state: ReconcileState) -> str:
    """Serialize reconciliation output for Claude's exception report."""
    payload = {
        "fixture_id": state["fixture_id"],
        "contract_path": state["contract_path"],
        "invoice_count": len(state["invoice_paths"]),
        "exception_count": len(state["exceptions"]),
        "exceptions": [exc.model_dump(mode="json") for exc in state["exceptions"]],
        "reconciliation_results": [
            result.model_dump(mode="json") for result in state["reconciliation_results"]
        ],
    }
    return json.dumps(payload, indent=2)


async def generate_report(state: ReconcileState) -> dict[str, object]:
    """Claude: turn structured exceptions into a cited exception report."""
    settings = get_settings()
    model = build_model(settings)
    result = await model.ainvoke(
        [
            SystemMessage(content=_REPORT_SYSTEM),
            HumanMessage(content=_build_report_prompt(state)),
        ],
    )
    content = result.content
    if not isinstance(content, str):
        content = str(content)
    return {"report": content}


def build_report_agent() -> CompiledStateGraph:
    """Compile the report specialist subgraph."""
    graph = StateGraph(ReconcileState)
    graph.add_node("generate_report", generate_report)
    graph.add_edge(START, "generate_report")
    graph.add_edge("generate_report", END)
    return graph.compile(name="report_agent")
