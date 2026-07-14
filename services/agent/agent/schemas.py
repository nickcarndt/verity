"""Pydantic schemas for HTTP request/response validation."""

from typing import Literal

from pydantic import BaseModel, Field
from shared.reconciliation import ExceptionFlag, ReconciliationResult

FixtureId = Literal["nextera-systems", "harbor-analytics"]


class AgentTraceEvent(BaseModel):
    """One pipeline stage event shown in the dashboard timeline."""

    agent: str
    step: str
    detail: str
    status: str = "completed"


class ReconcileRequest(BaseModel):
    """Run end-to-end reconciliation on a labeled fixture scenario."""

    fixture_id: FixtureId = Field(
        default="nextera-systems",
        description="Fixture scenario ID under data/fixtures/.",
    )


class ReconcileResponse(BaseModel):
    """Structured reconciliation output plus Claude's cited exception report."""

    fixture_id: FixtureId
    report: str = Field(..., description="Markdown exception report with clause citations.")
    report_error: str | None = Field(
        default=None,
        description=(
            "Set when Claude report generation failed after structured reconcile "
            "succeeded — exceptions remain authoritative."
        ),
    )
    exception_count: int
    exceptions: list[ExceptionFlag]
    reconciliation_results: list[ReconciliationResult]
    agent_trace: list[AgentTraceEvent] = Field(default_factory=list)
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
        description="Whether Braintrust tracing is exporting on this agent instance.",
    )
