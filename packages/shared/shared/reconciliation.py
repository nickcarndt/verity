"""Reconciliation result schemas."""

from decimal import Decimal

from pydantic import BaseModel, Field

from shared.contract import ClauseRef
from shared.enums import ExceptionType, ReconciliationStatus, Severity


class ExceptionFlag(BaseModel):
    """A single flagged mismatch with clause grounding and dollar impact."""

    id: str
    type: ExceptionType
    severity: Severity
    description: str
    dollar_impact: Decimal = Field(..., ge=0)
    clause_ref: ClauseRef
    invoice_id: str
    evidence: str = Field(
        ...,
        description="Human-readable proof, e.g. 'Billed $12,750 vs $10,000 cap'.",
    )


class ReconciliationResult(BaseModel):
    """Outcome of reconciling one invoice against contract obligations."""

    invoice_id: str
    status: ReconciliationStatus
    exceptions: list[ExceptionFlag] = Field(default_factory=list)
