"""Optional bearer auth for agent HTTP endpoints."""

from __future__ import annotations

from fastapi import Header, HTTPException

from agent.config import get_settings


async def require_agent_api_key(
    authorization: str | None = Header(default=None),
) -> None:
    """Enforce bearer auth when AGENT_API_KEY is configured.

    Local development can leave the key unset (auth disabled). Deployments
    should set AGENT_API_KEY and have the Next.js proxy forward it.
    """
    settings = get_settings()
    expected = settings.agent_api_key
    if not expected:
        return

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Authorization Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.removeprefix("Bearer ").strip()
    if token != expected:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
