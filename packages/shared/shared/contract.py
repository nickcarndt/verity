"""Contract and obligation schemas."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field

from shared.enums import ObligationType


class ClauseRef(BaseModel):
    """Pointer to a specific contract clause — used for citations."""

    section: str = Field(..., description="Clause section number, e.g. '3.1'.")
    text: str = Field(..., description="Verbatim clause text cited in the exception.")


class Clause(BaseModel):
    """A numbered section of a vendor contract."""

    id: str
    section: str
    title: str
    text: str


class Contract(BaseModel):
    """Vendor master agreement ingested for reconciliation."""

    id: str
    vendor_name: str
    title: str
    effective_date: date
    end_date: date
    clauses: list[Clause]


class Obligation(BaseModel):
    """Structured payment rule extracted from a contract clause."""

    id: str
    type: ObligationType
    description: str
    clause_ref: ClauseRef
    max_amount: Decimal | None = Field(
        default=None,
        description="Monthly fee cap, when type is fee_cap.",
    )
    requires_po: bool = Field(
        default=False,
        description="Whether invoices must reference a purchase order.",
    )
    valid_from: date | None = Field(
        default=None,
        description="Start of the obligation window.",
    )
    valid_to: date | None = Field(
        default=None,
        description="End of the obligation window.",
    )
