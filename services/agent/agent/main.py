"""FastAPI application — HTTP wrapper around the LangGraph agent."""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request

from agent.auth import require_agent_api_key
from agent.config import get_settings
from agent.graph import compiled_reconcile_graph
from agent.mcp_client import McpClient
from agent.rate_limit import check_reconcile_rate_limit
from agent.schemas import (
    HealthResponse,
    ReconcileRequest,
    ReconcileResponse,
)
from agent.tracing import (
    langchain_config,
    mark_tracing_ready,
    span_permalink,
    trace_run,
    tracing_enabled,
)

_settings = get_settings()

import braintrust

braintrust.auto_instrument()
if _settings.braintrust_api_key:
    braintrust.init_logger(project=_settings.braintrust_project)

mark_tracing_ready()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield


app = FastAPI(
    title="Verity Agent",
    description="LangGraph invoice-reconciliation pipeline",
    version="0.3.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Liveness probe — no API key required."""
    return HealthResponse(
        status="ok",
        service="verity-agent",
        tracing_enabled=tracing_enabled(),
    )


@app.post("/reconcile", response_model=ReconcileResponse)
async def reconcile(
    request: ReconcileRequest,
    raw_request: Request,
    _: None = Depends(require_agent_api_key),
) -> ReconcileResponse:
    """Run MCP tools end-to-end on a fixture and return a cited exception report."""
    check_reconcile_rate_limit(raw_request)

    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY is not configured",
        )

    trace_url: str | None = None
    result: dict[str, object] | None = None
    mcp = McpClient(settings.mcp_server_url)
    try:
        async with mcp:
            mcp.bind_to_run()
            try:
                async with trace_run(
                    "reconcile",
                    input={"fixture_id": request.fixture_id},
                    metadata={"fixture_id": request.fixture_id},
                ) as span:
                    result = await compiled_reconcile_graph.ainvoke(
                        {
                            "fixture_id": request.fixture_id,
                            "contract_path": "",
                            "invoice_paths": [],
                            "obligations": [],
                            "reconciliation_results": [],
                            "exceptions": [],
                            "report": "",
                            "report_error": None,
                            "agent_trace": [],
                        },
                        config=langchain_config(metadata={"fixture_id": request.fixture_id}),
                    )
                    if span is not None:
                        report_text = str(result.get("report") or "")
                        span.log(
                            output={
                                "exception_count": len(result["exceptions"]),
                                "report_preview": report_text[:500],
                                "report_error": result.get("report_error"),
                            },
                        )
                        trace_url = span_permalink(span)
            finally:
                mcp.unbind_from_run()
    except TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail=f"Upstream timeout talking to MCP/Claude: {exc}",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"MCP server unavailable at {settings.mcp_server_url}: {exc}",
        ) from exc

    if result is None:
        raise HTTPException(status_code=500, detail="Reconcile produced no result")

    exceptions = result["exceptions"]
    return ReconcileResponse(
        fixture_id=request.fixture_id,
        report=str(result["report"]),
        report_error=result.get("report_error"),
        exception_count=len(exceptions),
        exceptions=exceptions,
        reconciliation_results=result["reconciliation_results"],
        agent_trace=result.get("agent_trace", []),
        braintrust_trace_url=trace_url,
    )


def run() -> None:
    """Entry point for local development (`python -m agent.main`)."""
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "agent.main:app",
        host=settings.agent_host,
        port=settings.agent_port,
        reload=True,
    )


if __name__ == "__main__":
    run()
