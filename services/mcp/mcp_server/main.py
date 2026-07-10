"""Verity MCP server entry point — Streamable HTTP transport."""

from mcp.server.fastmcp import FastMCP

from mcp_server.config import get_settings
from mcp_server.tools import (
    extract_obligations as run_extract_obligations,
    parse_invoice as run_parse_invoice,
    reconcile as run_reconcile,
)

settings = get_settings()

mcp = FastMCP(
    "verity-mcp",
    host=settings.mcp_host,
    port=settings.mcp_port,
    stateless_http=True,
    json_response=True,
)


@mcp.tool()
def parse_invoice(file_path: str) -> dict[str, object]:
    """Parse an invoice JSON file into structured line items and totals."""
    return run_parse_invoice(file_path)


@mcp.tool()
def extract_obligations(contract_file_path: str) -> list[dict[str, object]]:
    """Extract payment obligations with clause references from a contract file."""
    return run_extract_obligations(contract_file_path)


@mcp.tool()
def reconcile(
    invoice: dict[str, object],
    obligations: list[dict[str, object]],
    known_invoice_numbers: list[str] | None = None,
) -> dict[str, object]:
    """Reconcile an invoice against obligations; return matches and mismatches."""
    return run_reconcile(invoice, obligations, known_invoice_numbers)


def run() -> None:
    """Start the MCP server with Streamable HTTP transport."""
    mcp.run(transport="streamable-http")


if __name__ == "__main__":
    run()
