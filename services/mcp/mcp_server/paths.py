"""Safe path resolution for untrusted tool inputs."""

from pathlib import Path

from mcp.server.fastmcp.exceptions import ToolError

from mcp_server.config import Settings, get_settings


def resolve_readable_path(file_path: str, settings: Settings | None = None) -> Path:
    """Resolve and validate a file path stays within the repository.

    Tool inputs are untrusted — reject paths that escape allowed roots.
    """
    cfg = settings or get_settings()
    candidate = Path(file_path)
    if not candidate.is_absolute():
        candidate = cfg.repo_root / candidate

    resolved = candidate.resolve()
    allowed_roots = (
        cfg.repo_root.resolve(),
        cfg.fixtures_root.resolve(),
    )
    if not any(resolved.is_relative_to(root) for root in allowed_roots):
        raise ToolError("file_path must be within the repository")

    if not resolved.is_file():
        raise ToolError(f"File not found: {file_path}")

    return resolved
