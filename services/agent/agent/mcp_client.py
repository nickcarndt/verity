"""Async MCP client for calling Verity tools over Streamable HTTP."""

from __future__ import annotations

import json
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from agent.tracing import tracing_enabled


class McpClient:
    """Thin wrapper around the official MCP Streamable HTTP client."""

    def __init__(self, server_url: str) -> None:
        self.server_url = server_url

    async def call_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        """Invoke an MCP tool and return the parsed JSON payload."""
        if tracing_enabled():
            return await self._call_tool_traced(name, arguments)
        return await self._call_tool(name, arguments)

    async def _call_tool_traced(self, name: str, arguments: dict[str, Any]) -> Any:
        """Invoke an MCP tool inside a Braintrust span."""
        from braintrust import traced

        @traced(name=f"mcp.{name}")
        async def _run() -> Any:
            return await self._call_tool(name, arguments)

        return await _run()

    async def _call_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        """Invoke an MCP tool and return the parsed JSON payload."""
        async with streamablehttp_client(self.server_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(name, arguments)
                if result.isError:
                    message = result.content[0].text if result.content else "Unknown MCP error"
                    raise RuntimeError(message)
                return self._parse_tool_result(result)

    @staticmethod
    def _parse_tool_result(result: Any) -> Any:
        """Extract tool output from MCP structured or text content."""
        structured = getattr(result, "structuredContent", None)
        if isinstance(structured, dict) and "result" in structured:
            return structured["result"]

        if not result.content:
            return None

        text = result.content[0].text
        return json.loads(text)
