"""reconcile tool — compare an invoice against contract obligations."""

from decimal import Decimal

from pydantic import TypeAdapter
from shared.contract import Obligation
from shared.enums import ExceptionType, ObligationType, ReconciliationStatus, Severity
from shared.invoice import Invoice
from shared.reconciliation import ExceptionFlag, ReconciliationResult


def _format_money(amount: Decimal) -> str:
    """Format a decimal amount as USD with two decimal places."""
    return f"${amount:,.2f}"


def reconcile_invoice(
    invoice: Invoice,
    obligations: list[Obligation],
    known_invoice_numbers: list[str] | None = None,
) -> ReconciliationResult:
    """Check one invoice against obligations and return matches or exceptions."""
    known = known_invoice_numbers or []
    exceptions: list[ExceptionFlag] = []

    for obligation in obligations:
        if obligation.type == ObligationType.FEE_CAP and obligation.max_amount is not None:
            if invoice.total_amount > obligation.max_amount:
                impact = invoice.total_amount - obligation.max_amount
                exceptions.append(
                    ExceptionFlag(
                        id=f"exc-overbilling-{invoice.id}-{obligation.id}",
                        type=ExceptionType.OVERBILLING,
                        severity=Severity.HIGH,
                        description=(
                            f"Invoice exceeds the {_format_money(obligation.max_amount)} "
                            "monthly fee cap."
                        ),
                        dollar_impact=impact,
                        clause_ref=obligation.clause_ref,
                        invoice_id=invoice.id,
                        evidence=(
                            f"Billed {_format_money(invoice.total_amount)} vs "
                            f"{_format_money(obligation.max_amount)} cap — "
                            f"{_format_money(impact)} over limit."
                        ),
                    ),
                )

        elif obligation.type == ObligationType.PO_REQUIRED and obligation.requires_po:
            if not invoice.po_number:
                exceptions.append(
                    ExceptionFlag(
                        id=f"exc-missing-po-{invoice.id}-{obligation.id}",
                        type=ExceptionType.MISSING_PO,
                        severity=Severity.MEDIUM,
                        description="Invoice submitted without a purchase order reference.",
                        dollar_impact=invoice.total_amount,
                        clause_ref=obligation.clause_ref,
                        invoice_id=invoice.id,
                        evidence=f"Invoice {invoice.invoice_number} has no po_number.",
                    ),
                )

        elif obligation.type == ObligationType.TERM_WINDOW:
            out_of_term = False
            if obligation.valid_from and invoice.invoice_date < obligation.valid_from:
                out_of_term = True
            if obligation.valid_to and invoice.invoice_date > obligation.valid_to:
                out_of_term = True

            if out_of_term:
                exceptions.append(
                    ExceptionFlag(
                        id=f"exc-out-of-term-{invoice.id}-{obligation.id}",
                        type=ExceptionType.OUT_OF_TERM,
                        severity=Severity.CRITICAL,
                        description="Invoice date falls outside the contract term.",
                        dollar_impact=invoice.total_amount,
                        clause_ref=obligation.clause_ref,
                        invoice_id=invoice.id,
                        evidence=(
                            f"Invoice date {invoice.invoice_date} is outside "
                            f"{obligation.valid_from} to {obligation.valid_to}."
                        ),
                    ),
                )

        elif obligation.type == ObligationType.NO_DUPLICATES:
            if invoice.invoice_number in known:
                exceptions.append(
                    ExceptionFlag(
                        id=f"exc-duplicate-{invoice.id}-{obligation.id}",
                        type=ExceptionType.DUPLICATE_INVOICE,
                        severity=Severity.HIGH,
                        description=(
                            f"Duplicate submission of invoice {invoice.invoice_number}."
                        ),
                        dollar_impact=invoice.total_amount,
                        clause_ref=obligation.clause_ref,
                        invoice_id=invoice.id,
                        evidence=(
                            f"Invoice number {invoice.invoice_number} already received."
                        ),
                    ),
                )

    status = (
        ReconciliationStatus.FLAGGED
        if exceptions
        else ReconciliationStatus.MATCHED
    )
    return ReconciliationResult(
        invoice_id=invoice.id,
        status=status,
        exceptions=exceptions,
    )


def reconcile(
    invoice: dict[str, object],
    obligations: list[dict[str, object]],
    known_invoice_numbers: list[str] | None = None,
) -> dict[str, object]:
    """Reconcile an invoice against obligations and return matches + mismatches."""
    parsed_invoice = Invoice.model_validate(invoice)
    parsed_obligations = TypeAdapter(list[Obligation]).validate_python(obligations)
    result = reconcile_invoice(
        parsed_invoice,
        parsed_obligations,
        known_invoice_numbers=known_invoice_numbers,
    )
    return result.model_dump(mode="json")
