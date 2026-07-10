"""parse_invoice tool — load and validate structured invoice JSON."""

import json

from shared.invoice import Invoice

from mcp_server.paths import resolve_readable_path


def parse_invoice(file_path: str) -> dict[str, object]:
    """Parse an invoice JSON file into structured line items.

    Phase 3 uses pre-structured JSON fixtures instead of OCR. The tool
    validates the file against the shared Invoice schema and returns the
    full invoice dict (line items + totals).
    """
    path = resolve_readable_path(file_path)
    raw = json.loads(path.read_text(encoding="utf-8"))
    invoice = Invoice.model_validate(raw)
    return invoice.model_dump(mode="json")
