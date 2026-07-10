"""Streaming helpers for the chat graph."""

from collections.abc import AsyncIterator

from langchain_core.messages import HumanMessage

from agent.config import get_settings
from agent.agents.common import build_model
from agent.tracing import langchain_config, trace_run


async def stream_chat_response(message: str) -> AsyncIterator[str]:
    """Stream Claude tokens for a freeform chat message."""
    settings = get_settings()
    model = build_model(settings)

    async with trace_run("invoke", input={"message": message}):
        async for chunk in model.astream(
            [HumanMessage(content=message)],
            config=langchain_config(),
        ):
            content = chunk.content
            if isinstance(content, str) and content:
                yield content
