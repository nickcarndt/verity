"""Report faithfulness scorer — grounds Claude prose against structured reconcile output.

Detection scorers live in scorers.py. This module is intentionally separate so
report quality is never folded into exception recall/precision.
"""

from __future__ import annotations

import re
from decimal import Decimal
from typing import Any

# Invoice IDs in fixtures look like inv-2025-002 / inv-ha-003.
_INVOICE_ID_RE = re.compile(r"\b(inv-[a-z0-9-]+)\b", re.IGNORECASE)
# "Section 3.1", "§3.1", "section 2.1:"
_SECTION_RE = re.compile(
    r"(?:section|§)\s*([0-9]+(?:\.[0-9]+)*)",
    re.IGNORECASE,
)
_DOLLAR_RE = re.compile(
    r"\$\s*([\d,]+(?:\.\d{2})?)",
)


def _normalize_money(raw: str) -> Decimal:
    return Decimal(raw.replace(",", ""))


def _money_from_text(text: str) -> set[Decimal]:
    return {_normalize_money(m) for m in _DOLLAR_RE.findall(text)}


def allowed_invoice_ids(output: dict[str, Any], metadata: dict[str, Any] | None) -> set[str]:
    """Invoice IDs that may appear in the report (fixture inventory)."""
    meta = metadata or {}
    from_meta = {str(i).lower() for i in meta.get("invoice_ids", [])}
    if from_meta:
        return from_meta

    ids: set[str] = set()
    for exc in output.get("exceptions", []):
        ids.add(str(exc["invoice_id"]).lower())
    for result in output.get("reconciliation_results", []):
        ids.add(str(result["invoice_id"]).lower())
    return ids


def allowed_clause_sections(
    output: dict[str, Any],
    metadata: dict[str, Any] | None,
) -> set[str]:
    """Contract sections that may be cited.

    Includes fixture clause inventory plus section numbers that appear inside
    structured clause_ref / evidence text (quoted clauses often mention other
    sections, e.g. "terminated per Section 9").
    """
    meta = metadata or {}
    sections = {str(s) for s in meta.get("contract_sections", [])}

    for exc in output.get("exceptions", []):
        ref = exc.get("clause_ref") or {}
        if ref.get("section"):
            sections.add(str(ref["section"]))
        for text in (
            str(ref.get("text", "")),
            str(exc.get("evidence", "")),
            str(exc.get("description", "")),
        ):
            sections.update(m.group(1) for m in _SECTION_RE.finditer(text))
    return sections


def allowed_dollar_amounts(output: dict[str, Any]) -> set[Decimal]:
    """Dollar amounts present in structured reconciliation output."""
    amounts: set[Decimal] = set()
    for exc in output.get("exceptions", []):
        amounts.add(Decimal(str(exc["dollar_impact"])))
        amounts |= _money_from_text(str(exc.get("evidence", "")))
        ref = exc.get("clause_ref") or {}
        amounts |= _money_from_text(str(ref.get("text", "")))
        amounts |= _money_from_text(str(exc.get("description", "")))

    if amounts:
        amounts.add(sum(Decimal(str(e["dollar_impact"])) for e in output["exceptions"]))

    return amounts


def build_faithful_report(output: dict[str, Any]) -> str:
    """Synthesize a grounded report for CI (no Claude call)."""
    exceptions = output.get("exceptions", [])
    total = sum(Decimal(str(e["dollar_impact"])) for e in exceptions)
    lines = [
        "# Invoice Reconciliation Exception Report",
        "",
        (
            f"**Executive Summary:** {len(output.get('reconciliation_results', []))} invoices "
            f"reviewed; {len(exceptions)} exceptions flagged with combined impact "
            f"**${total:,.2f}**."
        ),
        "",
        "## Exceptions",
    ]
    for exc in exceptions:
        section = exc["clause_ref"]["section"]
        clause = exc["clause_ref"]["text"]
        lines.extend(
            [
                "",
                f"### {exc['type']} — {exc['invoice_id']}",
                f"- **Dollar Impact:** ${Decimal(str(exc['dollar_impact'])):,.2f}",
                f"- **Evidence:** {exc['evidence']}",
                f"- **Clause Citation — Section {section}:**",
                f'> *"{clause}"*',
            ],
        )
    lines.extend(["", "## Clean Invoices"])
    for result in output.get("reconciliation_results", []):
        if result.get("status") == "matched":
            lines.append(f"- **{result['invoice_id']}** — matched")
    return "\n".join(lines)


def build_unfaithful_report(output: dict[str, Any]) -> str:
    """Synthesize a report with invented IDs/sections/amounts for CI negative check."""
    return (
        "# Bad Report\n"
        "Invoice **inv-fabricated-999** overbilled **$999,999.00**.\n"
        "Clause Citation — Section 99.9: invented.\n"
    )


def score_report_faithfulness(
    report: str,
    output: dict[str, Any],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return overall score + per-check booleans for dashboard/CI."""
    if not report or not report.strip():
        return {
            "name": "report_faithfulness",
            "score": 0.0,
            "checks": {
                "invoice_ids_grounded": False,
                "clause_sections_grounded": False,
                "dollar_amounts_grounded": False,
            },
        }

    cited_invoices = {m.group(1).lower() for m in _INVOICE_ID_RE.finditer(report)}
    cited_sections = {m.group(1) for m in _SECTION_RE.finditer(report)}
    cited_dollars = _money_from_text(report)

    ok_invoices = allowed_invoice_ids(output, metadata)
    ok_sections = allowed_clause_sections(output, metadata)
    ok_dollars = allowed_dollar_amounts(output)

    invoice_ok = cited_invoices <= ok_invoices if cited_invoices else True
    # If the report cites sections, every one must exist on the contract.
    section_ok = cited_sections <= ok_sections if cited_sections else True
    # Every $ amount in the report must appear in structured reconcile output.
    dollar_ok = cited_dollars <= ok_dollars if cited_dollars else True

    checks = {
        "invoice_ids_grounded": invoice_ok,
        "clause_sections_grounded": section_ok,
        "dollar_amounts_grounded": dollar_ok,
    }
    score = sum(1.0 for passed in checks.values() if passed) / len(checks)
    return {"name": "report_faithfulness", "score": score, "checks": checks}


def report_faithfulness(
    input: dict[str, Any],
    output: dict[str, Any],
    expected: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Braintrust-compatible scorer — uses output['report'] when present."""
    report = output.get("report") or ""
    result = score_report_faithfulness(report, output, metadata)
    return {"name": result["name"], "score": result["score"]}
