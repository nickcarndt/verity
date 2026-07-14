"""Coarse in-process rate limiting for abuse resistance (demo-scale)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from agent.config import get_settings

_hits: dict[str, deque[float]] = defaultdict(deque)


def client_ip(request: Request) -> str:
    """Best-effort client IP (honors first X-Forwarded-For hop)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client is not None:
        return request.client.host
    return "unknown"


def check_reconcile_rate_limit(request: Request) -> None:
    """Raise 429 when the caller exceeds the configured reconcile budget."""
    settings = get_settings()
    key = client_ip(request)
    now = time.monotonic()
    window = settings.reconcile_rate_window_seconds
    limit = settings.reconcile_rate_limit

    bucket = _hits[key]
    while bucket and now - bucket[0] > window:
        bucket.popleft()

    if len(bucket) >= limit:
        raise HTTPException(
            status_code=429,
            detail=(
                f"Rate limit exceeded — max {limit} reconcile requests "
                f"per {int(window)}s"
            ),
            headers={"Retry-After": str(int(window))},
        )

    bucket.append(now)
