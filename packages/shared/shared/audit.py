"""Audit trail schemas (reserved for future persistence — not used by the current product path)."""

from datetime import datetime

from pydantic import BaseModel, Field


class AuditRecord(BaseModel):
    """Persisted record of an exception decision or action."""

    id: str
    exception_id: str
    timestamp: datetime
    action: str = Field(..., description="e.g. 'flagged', 'reviewed', 'disputed'.")
    notes: str = ""
