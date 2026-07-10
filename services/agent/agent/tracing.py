"""Braintrust tracing setup for the Verity agent."""

from __future__ import annotations

from collections.abc import AsyncIterator, Mapping
from contextlib import asynccontextmanager
from typing import Any

from agent.config import Settings, get_settings

_handler: Any | None = None
_enabled: bool = False


def configure_tracing(settings: Settings | None = None) -> bool:
    """Initialize Braintrust logging and LangChain callback handler.

    Returns True when tracing is active. Skips quietly when BRAINTRUST_API_KEY
    is unset so local dev works without a Braintrust account.
    """
    global _handler, _enabled

    cfg = settings or get_settings()
    if not cfg.braintrust_api_key:
        _enabled = False
        _handler = None
        return False

    from braintrust import init_logger
    from braintrust.integrations.langchain import BraintrustCallbackHandler, set_global_handler

    init_logger(
        project=cfg.braintrust_project,
        api_key=cfg.braintrust_api_key,
    )
    _handler = BraintrustCallbackHandler()
    set_global_handler(_handler)
    _enabled = True
    return True


def tracing_enabled() -> bool:
    """Return whether Braintrust tracing is configured."""
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
    """Build a LangGraph/LangChain config dict with tracing callbacks."""
    config: dict[str, Any] = {}
    if metadata:
        config["metadata"] = dict(metadata)
    if _handler is not None:
        config["callbacks"] = [_handler]
    return config


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
