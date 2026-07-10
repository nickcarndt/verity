"""Braintrust tracing helpers for the Verity agent."""

from __future__ import annotations

from collections.abc import AsyncIterator, Mapping
from contextlib import asynccontextmanager
from typing import Any

_enabled = False


def mark_tracing_ready() -> None:
    """Record that Braintrust auto-instrumentation bootstrap completed."""
    global _enabled
    _enabled = True


def tracing_enabled() -> bool:
    """Return whether Braintrust tracing bootstrap ran."""
    return _enabled


def span_permalink(span: Any | None) -> str | None:
    """Return a Braintrust UI deep link for a span, if available."""
    if span is None:
        return None
    try:
        url = span.permalink()
        return url if isinstance(url, str) and url else None
    except Exception:
        return None


def langchain_config(metadata: Mapping[str, Any] | None = None) -> dict[str, Any]:
    """Build a LangGraph config dict; LLM tracing is handled by auto-instrumentation."""
    if not metadata:
        return {}
    return {"metadata": dict(metadata)}


@asynccontextmanager
async def trace_run(
    name: str,
    *,
    input: Mapping[str, Any] | None = None,
    metadata: Mapping[str, Any] | None = None,
) -> AsyncIterator[Any]:
    """Open a top-level Braintrust span around an agent run."""
    if not _enabled:
        yield None
        return

    from braintrust import start_span

    with start_span(name=name, input=input, metadata=metadata) as span:
        yield span
