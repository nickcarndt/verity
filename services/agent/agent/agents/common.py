"""Shared helpers for specialist agent subgraphs."""

from __future__ import annotations

from langchain_anthropic import ChatAnthropic

from agent.config import Settings, get_settings
from agent.mcp_client import McpClient
from agent.schemas import AgentTraceEvent


def mcp_client() -> McpClient:
    """Return the run-scoped MCP client, or a new one-shot client."""
    bound = McpClient.get_run_client()
    if bound is not None:
        return bound
    settings = get_settings()
    return McpClient(settings.mcp_server_url)


def build_model(settings: Settings) -> ChatAnthropic:
    """Create a ChatAnthropic client from settings."""
    if not settings.anthropic_api_key:
        raise ValueError("ANTHROPIC_API_KEY is not set")

    return ChatAnthropic(
        model=settings.agent_model,
        api_key=settings.anthropic_api_key,
    )


def trace_entry(agent: str, step: str, detail: str) -> AgentTraceEvent:
    """Build one pipeline trace event for the frontend timeline."""
    return AgentTraceEvent(
        agent=agent,
        step=step,
        detail=detail,
        status="completed",
    )
