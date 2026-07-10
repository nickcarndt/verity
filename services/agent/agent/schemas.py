"""Pydantic schemas for HTTP request/response validation."""

from pydantic import BaseModel, Field


class InvokeRequest(BaseModel):
    """Validated input for a single agent invocation."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=10_000,
        description="User message sent to the agent.",
    )


class InvokeResponse(BaseModel):
    """Agent response returned to the caller."""

    response: str = Field(..., description="Claude's reply to the message.")


class ReconcileRequest(BaseModel):
    """Run end-to-end reconciliation on a labeled fixture scenario."""

    fixture_id: str = Field(
        default="nextera-systems",
        min_length=1,
        description="Fixture scenario ID under data/fixtures/.",
    )


class ReconcileResponse(BaseModel):
    """Structured reconciliation output plus Claude's cited exception report."""

    fixture_id: str
    report: str = Field(..., description="Markdown exception report with clause citations.")
    exception_count: int
    exceptions: list[dict[str, object]]
    reconciliation_results: list[dict[str, object]]
    agent_trace: list[dict[str, object]] = Field(default_factory=list)
    braintrust_trace_url: str | None = Field(
        default=None,
        description="Deep link to this run's top-level span in Braintrust (when tracing is enabled).",
    )


class HealthResponse(BaseModel):
    """Health check payload."""

    status: str
    service: str
    tracing_enabled: bool = Field(
        default=False,
        description="Whether Braintrust tracing is active on this agent instance.",
    )
