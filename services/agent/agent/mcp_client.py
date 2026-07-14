"""Async MCP client for calling Verity tools over Streamable HTTP."""

from __future__ import annotations

import json
from contextvars import ContextVar
from types import TracebackType
from typing import Any, Self

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from agent.config import get_settings

_run_client: ContextVar["McpClient | None"] = ContextVar("verity_mcp_client", default=None)


class McpClient:
    """Thin wrapper around the official MCP Streamable HTTP client.

    Prefer one shared client per reconcile run via ``async with McpClient(...)``
    and ``bind_to_run()``. Falls back to a short-lived session per tool call.
    """

    def __init__(
        self,
        server_url: str,
        *,
        timeout: float | None = None,
        sse_read_timeout: float | None = None,
    ) -> None:
        settings = get_settings()
        self.server_url = server_url
        self.timeout = (
            timeout if timeout is not None else settings.mcp_http_timeout_seconds
        )
        self.sse_read_timeout = (
            sse_read_timeout
            if sse_read_timeout is not None
            else settings.mcp_sse_read_timeout_seconds
        )
        self._http_cm: Any | None = None
        self._session_cm: Any | None = None
        self._session: ClientSession | None = None
        self._token: Any | None = None

    def _http_client(self) -> Any:
        return streamablehttp_client(
            self.server_url,
            timeout=self.timeout,
            sse_read_timeout=self.sse_read_timeout,
        )

    async def __aenter__(self) -> Self:
        self._http_cm = self._http_client()
        read, write, _ = await self._http_cm.__aenter__()
        self._session_cm = ClientSession(read, write)
        self._session = await self._session_cm.__aenter__()
        await self._session.initialize()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        if self._session_cm is not None:
            await self._session_cm.__aexit__(exc_type, exc, tb)
            self._session_cm = None
            self._session = None
        if self._http_cm is not None:
            await self._http_cm.__aexit__(exc_type, exc, tb)
            self._http_cm = None

    def bind_to_run(self) -> None:
        """Make this client the default for ``get_run_client()`` in this task."""
        self._token = _run_client.set(self)

    def unbind_from_run(self) -> None:
        """Clear the run-scoped client binding."""
        if self._token is not None:
            _run_client.reset(self._token)
            self._token = None

    @staticmethod
    def get_run_client() -> McpClient | None:
        """Return the client bound for the current reconcile run, if any."""
        return _run_client.get()

    async def call_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        """Invoke an MCP tool and return the parsed JSON payload."""
        if self._session is not None:
            return await self._call_with_session(self._session, name, arguments)

        async with self._http_client() as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                return await self._call_with_session(session, name, arguments)

    async def _call_with_session(
        self,
        session: ClientSession,
        name: str,
        arguments: dict[str, Any],
    ) -> Any:
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

        try:
            text = result.content[0].text
        except (IndexError, AttributeError) as exc:
            raise RuntimeError("MCP tool returned empty content") from exc

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"MCP tool returned invalid JSON: {exc}") from exc
