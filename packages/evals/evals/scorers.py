"""Deterministic scorers for reconciliation evals."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

ExceptionKey = tuple[str, str]


def _exception_keys(exceptions: list[dict[str, Any]]) -> set[ExceptionKey]:
    """Normalize exceptions to (invoice_id, type) pairs for set comparison."""
    return {(exc["invoice_id"], exc["type"]) for exc in exceptions}


def _matched_pairs(
    actual: list[dict[str, Any]],
    expected: list[dict[str, Any]],
) -> list[tuple[dict[str, Any], dict[str, Any]]]:
    """Pair actual and expected exceptions by (invoice_id, type)."""
    expected_by_key = {(e["invoice_id"], e["type"]): e for e in expected}
    pairs: list[tuple[dict[str, Any], dict[str, Any]]] = []
    for act in actual:
        key = (act["invoice_id"], act["type"])
        if key in expected_by_key:
            pairs.append((act, expected_by_key[key]))
    return pairs


def exception_recall(
    input: dict[str, Any],
    output: dict[str, Any],
    expected: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Fraction of labeled exceptions that were detected."""
    actual = _exception_keys(output.get("exceptions", []))
    expected_set = _exception_keys(expected)
    if not expected_set:
        return {"name": "exception_recall", "score": 1.0}

    matched = len(actual & expected_set)
    return {"name": "exception_recall", "score": matched / len(expected_set)}


def exception_precision(
    input: dict[str, Any],
    output: dict[str, Any],
    expected: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Fraction of detected exceptions that match a label."""
    actual = _exception_keys(output.get("exceptions", []))
    expected_set = _exception_keys(expected)
    if not actual:
        return {"name": "exception_precision", "score": 1.0 if not expected_set else 0.0}

    matched = len(actual & expected_set)
    return {"name": "exception_precision", "score": matched / len(actual)}


def clause_section_accuracy(
    input: dict[str, Any],
    output: dict[str, Any],
    expected: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Among matched exceptions, fraction with correct clause section citation."""
    pairs = _matched_pairs(output.get("exceptions", []), expected)
    if not pairs:
        return {"name": "clause_section_accuracy", "score": 0.0}

    correct = sum(
        1
        for act, exp in pairs
        if act["clause_ref"]["section"] == exp["clause_ref"]["section"]
    )
    return {"name": "clause_section_accuracy", "score": correct / len(pairs)}


def dollar_impact_accuracy(
    input: dict[str, Any],
    output: dict[str, Any],
    expected: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Among matched exceptions, fraction with correct dollar impact (±$0.01)."""
    pairs = _matched_pairs(output.get("exceptions", []), expected)
    if not pairs:
        return {"name": "dollar_impact_accuracy", "score": 0.0}

    correct = 0
    for act, exp in pairs:
        actual_amount = Decimal(str(act["dollar_impact"]))
        expected_amount = Decimal(str(exp["dollar_impact"]))
        if abs(actual_amount - expected_amount) <= Decimal("0.01"):
            correct += 1

    return {"name": "dollar_impact_accuracy", "score": correct / len(pairs)}


ALL_SCORERS = [
    exception_recall,
    exception_precision,
    clause_section_accuracy,
    dollar_impact_accuracy,
]
