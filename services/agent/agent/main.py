"""FastAPI application — HTTP wrapper around the LangGraph agent."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse

from agent.config import get_settings
from agent.graph import compiled_graph, compiled_reconcile_graph
from agent.schemas import (
    HealthResponse,
    InvokeRequest,
    InvokeResponse,
    ReconcileRequest,
    ReconcileResponse,
)
from agent.streaming import stream_chat_response
from agent.tracing import configure_tracing, langchain_config, span_permalink, trace_run, tracing_enabled


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize Braintrust tracing on startup."""
    configure_tracing()
    yield


app = FastAPI(
    title="Verity Agent",
    description="LangGraph invoice-reconciliation agent",
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


@app.post("/invoke", response_model=InvokeResponse)
async def invoke(request: InvokeRequest) -> InvokeResponse:
    """Run the freeform chat graph on a message and return Claude's response."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY is not configured",
        )

    async with trace_run("invoke", input={"message": request.message}):
        result = await compiled_graph.ainvoke(
            {"message": request.message, "response": ""},
            config=langchain_config(),
        )
    return InvokeResponse(response=result["response"])


@app.post("/invoke/stream")
async def invoke_stream(request: InvokeRequest) -> StreamingResponse:
    """Stream Claude's reply as plain text for the Vercel AI SDK text protocol."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY is not configured",
        )

    return StreamingResponse(
        stream_chat_response(request.message),
        media_type="text/plain; charset=utf-8",
    )


@app.post("/reconcile", response_model=ReconcileResponse)
async def reconcile(request: ReconcileRequest) -> ReconcileResponse:
    """Run MCP tools end-to-end on a fixture and return a cited exception report."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY is not configured",
        )

    trace_url: str | None = None
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
                    "agent_trace": [],
                },
                config=langchain_config(metadata={"fixture_id": request.fixture_id}),
            )
            if span is not None:
                span.log(
                    output={
                        "exception_count": len(result["exceptions"]),
                        "report_preview": result["report"][:500],
                    },
                )
                trace_url = span_permalink(span)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"MCP server unavailable: {exc}",
        ) from exc

    exceptions = result["exceptions"]
    return ReconcileResponse(
        fixture_id=request.fixture_id,
        report=result["report"],
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
