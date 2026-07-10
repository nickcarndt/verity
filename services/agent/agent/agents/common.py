"""Shared helpers for specialist agent subgraphs."""

from __future__ import annotations

from langchain_anthropic import ChatAnthropic

from agent.config import Settings, get_settings
from agent.mcp_client import McpClient


def mcp_client() -> McpClient:
    """Create an MCP client from current settings."""
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


def trace_entry(agent: str, step: str, detail: str) -> dict[str, str]:
    """Build one agent trace event for the multi-agent pipeline."""
    return {
        "agent": agent,
        "step": step,
        "detail": detail,
        "status": "completed",
    }
