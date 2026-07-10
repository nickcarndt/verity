"""Invoice schemas."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


class LineItem(BaseModel):
    """Single billed line on an invoice."""

    description: str
    quantity: Decimal = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)
    amount: Decimal = Field(..., ge=0)


class Invoice(BaseModel):
    """Structured vendor invoice for reconciliation."""

    id: str
    invoice_number: str
    vendor_name: str
    invoice_date: date
    po_number: str | None = None
    line_items: list[LineItem] = Field(..., min_length=1)
    total_amount: Decimal = Field(..., ge=0)

    @model_validator(mode="after")
    def line_items_sum_to_total(self) -> "Invoice":
        """Ensure line items sum to the declared total (within penny tolerance)."""
        computed = sum((item.amount for item in self.line_items), Decimal("0"))
        if abs(computed - self.total_amount) > Decimal("0.01"):
            msg = f"line_items sum {computed} != total_amount {self.total_amount}"
            raise ValueError(msg)
        return self
