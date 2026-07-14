"""Safe path resolution for untrusted tool inputs."""

from pathlib import Path

from mcp.server.fastmcp.exceptions import ToolError

from mcp_server.config import Settings, get_settings


def resolve_readable_path(file_path: str, settings: Settings | None = None) -> Path:
    """Resolve and validate a file path stays within data/fixtures.

    Tool inputs are untrusted — reject paths that escape the fixtures root.
    """
    cfg = settings or get_settings()
    candidate = Path(file_path)
    if not candidate.is_absolute():
        candidate = cfg.repo_root / candidate

    resolved = candidate.resolve()
    fixtures_root = cfg.fixtures_root.resolve()
    if not resolved.is_relative_to(fixtures_root):
        raise ToolError("file_path must be under data/fixtures")

    if not resolved.is_file():
        raise ToolError(f"File not found: {file_path}")

    return resolved
