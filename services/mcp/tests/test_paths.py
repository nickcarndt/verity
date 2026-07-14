"""Unit tests for fixture-scoped path resolution."""

from __future__ import annotations

from pathlib import Path

import pytest
from mcp.server.fastmcp.exceptions import ToolError

from mcp_server.config import Settings
from mcp_server.paths import resolve_readable_path

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURES_ROOT = REPO_ROOT / "data" / "fixtures"
NEXTERA_CONTRACT = FIXTURES_ROOT / "nextera-systems" / "contract.json"


@pytest.fixture
def settings() -> Settings:
    return Settings(repo_root=REPO_ROOT, fixtures_root=FIXTURES_ROOT)


def test_happy_path_relative(settings: Settings) -> None:
    resolved = resolve_readable_path(
        "data/fixtures/nextera-systems/contract.json",
        settings,
    )
    assert resolved == NEXTERA_CONTRACT.resolve()
    assert resolved.is_file()


def test_happy_path_absolute_under_fixtures(settings: Settings) -> None:
    resolved = resolve_readable_path(str(NEXTERA_CONTRACT), settings)
    assert resolved == NEXTERA_CONTRACT.resolve()


def test_rejects_parent_escape(settings: Settings) -> None:
    with pytest.raises(ToolError, match="data/fixtures"):
        resolve_readable_path("data/fixtures/../PROJECT_SPEC.md", settings)


def test_rejects_repo_root_file(settings: Settings) -> None:
    readme = REPO_ROOT / "README.md"
    with pytest.raises(ToolError, match="data/fixtures"):
        resolve_readable_path(str(readme), settings)


def test_rejects_absolute_outside_fixtures(settings: Settings) -> None:
    with pytest.raises(ToolError, match="data/fixtures"):
        resolve_readable_path("/etc/passwd", settings)


def test_rejects_missing_file_inside_fixtures(settings: Settings) -> None:
    with pytest.raises(ToolError, match="File not found"):
        resolve_readable_path(
            "data/fixtures/nextera-systems/does-not-exist.json",
            settings,
        )


def test_rejects_symlink_escape(tmp_path: Path) -> None:
    """Symlink under fixtures that points outside must be rejected after resolve()."""
    fixtures = tmp_path / "fixtures"
    fixtures.mkdir()
    outside = tmp_path / "secret.txt"
    outside.write_text("nope", encoding="utf-8")
    link = fixtures / "escape-link"
    link.symlink_to(outside)

    local = Settings(repo_root=tmp_path, fixtures_root=fixtures)
    with pytest.raises(ToolError, match="data/fixtures"):
        resolve_readable_path(str(link), local)
