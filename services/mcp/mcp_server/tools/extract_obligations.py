"""extract_obligations tool — derive payment rules from contract clauses.

Honesty note (fixture era): this is keyword / regex extraction over clause text,
not production NLP or LLM extraction. It is intentionally deterministic for
evals. Swap the body later without changing the tool signature.
"""

import json
import re
from decimal import Decimal

from shared.contract import Clause, ClauseRef, Contract, Obligation
from shared.enums import ObligationType

from mcp_server.paths import resolve_readable_path

_DOLLAR_PATTERN = re.compile(
    r"(?:\$|U\.S\. Dollars\s*\()\s*([\d,]+(?:\.\d{2})?)",
    re.IGNORECASE,
)


def _clause_ref(clause: Clause) -> ClauseRef:
    """Build a citation reference from a contract clause."""
    return ClauseRef(section=clause.section, text=clause.text)


def _parse_dollar_amount(text: str) -> Decimal | None:
    """Extract the first dollar amount from clause text."""
    match = _DOLLAR_PATTERN.search(text)
    if not match:
        return None
    return Decimal(match.group(1).replace(",", ""))


def _obligation_id(clause: Clause, suffix: str) -> str:
    """Stable obligation ID from clause section."""
    section_slug = clause.section.replace(".", "-")
    return f"obl-{section_slug}-{suffix}"


def extract_obligations_from_contract(contract: Contract) -> list[Obligation]:
    """Derive structured obligations from contract clause text.

    Fixture-era keyword extract (not production NLP): matches phrases like
    "not to exceed", "purchase order", term windows, and "duplicate".
    Deterministic and eval-friendly; later phases can swap in LLM extraction
    without changing the tool signature.
    """
    obligations: list[Obligation] = []

    for clause in contract.clauses:
        text = clause.text.lower()
        ref = _clause_ref(clause)

        if "not to exceed" in text or ("monthly" in text and "fee" in text):
            obligations.append(
                Obligation(
                    id=_obligation_id(clause, "fee-cap"),
                    type=ObligationType.FEE_CAP,
                    description=(
                        f"Monthly fee must not exceed cap defined in clause {clause.section}."
                    ),
                    clause_ref=ref,
                    max_amount=_parse_dollar_amount(clause.text),
                ),
            )
            continue

        if "purchase order" in text:
            obligations.append(
                Obligation(
                    id=_obligation_id(clause, "po-required"),
                    type=ObligationType.PO_REQUIRED,
                    description=(
                        f"Invoice must reference a purchase order per clause {clause.section}."
                    ),
                    clause_ref=ref,
                    requires_po=True,
                ),
            )
            continue

        if "effective" in text and "expire" in text:
            obligations.append(
                Obligation(
                    id=_obligation_id(clause, "term-window"),
                    type=ObligationType.TERM_WINDOW,
                    description=(
                        f"Invoice must fall within contract term per clause {clause.section}."
                    ),
                    clause_ref=ref,
                    valid_from=contract.effective_date,
                    valid_to=contract.end_date,
                ),
            )
            continue

        if "duplicate" in text:
            obligations.append(
                Obligation(
                    id=_obligation_id(clause, "no-duplicates"),
                    type=ObligationType.NO_DUPLICATES,
                    description=(
                        "Vendor must not submit duplicate invoices for the same "
                        f"period or number (clause {clause.section})."
                    ),
                    clause_ref=ref,
                ),
            )

    return obligations


def extract_obligations(contract_file_path: str) -> list[dict[str, object]]:
    """Extract payment obligations from a contract JSON file.

    Returns obligations with clause references for downstream reconciliation.
    """
    path = resolve_readable_path(contract_file_path)
    raw = json.loads(path.read_text(encoding="utf-8"))
    contract = Contract.model_validate(raw)
    obligations = extract_obligations_from_contract(contract)
    return [obligation.model_dump(mode="json") for obligation in obligations]
