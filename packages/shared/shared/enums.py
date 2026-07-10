"""Domain enumerations shared across agent, MCP, and eval harness."""

from enum import StrEnum


class ExceptionType(StrEnum):
    """Typed reconciliation exceptions the agent flags."""

    OVERBILLING = "overbilling"
    MISSING_PO = "missing_po"
    OUT_OF_TERM = "out_of_term"
    DUPLICATE_INVOICE = "duplicate_invoice"


class Severity(StrEnum):
    """Financial impact tier for an exception."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ObligationType(StrEnum):
    """Contract obligation categories extracted from clauses."""

    FEE_CAP = "fee_cap"
    PO_REQUIRED = "po_required"
    TERM_WINDOW = "term_window"
    NO_DUPLICATES = "no_duplicates"


class ReconciliationStatus(StrEnum):
    """Outcome of reconciling a single invoice."""

    MATCHED = "matched"
    FLAGGED = "flagged"
