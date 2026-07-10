"""Environment-backed configuration for the MCP server."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[3]
_INFRA_ENV = _REPO_ROOT / "infra" / ".env"
_LOCAL_ENV = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    """MCP server settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=(_LOCAL_ENV, _INFRA_ENV),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mcp_host: str = Field(default="0.0.0.0")
    mcp_port: int = Field(default=8001)
    repo_root: Path = Field(default=_REPO_ROOT)
    fixtures_root: Path = Field(default=_REPO_ROOT / "data" / "fixtures")


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
