"""Environment-backed configuration for the agent service."""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_INFRA_ENV = Path(__file__).resolve().parents[3] / "infra" / ".env"
_LOCAL_ENV = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    """Agent service settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=(_LOCAL_ENV, _INFRA_ENV),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    anthropic_api_key: str | None = Field(
        default=None,
        description="Anthropic API key for Claude calls.",
    )
    agent_model: str = Field(
        default="claude-sonnet-4-6",
        description="Claude model identifier passed to LangChain.",
    )
    agent_host: str = Field(default="0.0.0.0")
    agent_port: int = Field(default=8000)
    mcp_server_url: str = Field(
        default="http://localhost:8001/mcp",
        description="Streamable HTTP endpoint for the Verity MCP server.",
    )
    braintrust_api_key: str | None = Field(
        default=None,
        description="Braintrust API key for tracing (optional locally).",
    )
    braintrust_project: str = Field(
        default="verity",
        description="Braintrust project name for traces and evals.",
    )
    agent_api_key: str | None = Field(
        default=None,
        description=(
            "Optional shared secret for POST /reconcile. "
            "When set, callers must send Authorization: Bearer <key>."
        ),
    )
    agent_require_api_key: bool = Field(
        default=False,
        description=(
            "When true, refuse to start reconcile auth if AGENT_API_KEY is unset "
            "(production fail-closed). Local leave false."
        ),
    )
    mcp_http_timeout_seconds: float = Field(
        default=30.0,
        description="HTTP timeout for MCP Streamable HTTP connect/request.",
    )
    mcp_sse_read_timeout_seconds: float = Field(
        default=120.0,
        description="SSE read timeout for long-running MCP tool calls.",
    )
    anthropic_timeout_seconds: float = Field(
        default=90.0,
        description="Timeout for Claude report generation calls.",
    )
    reconcile_rate_limit: int = Field(
        default=20,
        description="Max POST /reconcile requests per IP per rate-limit window.",
    )
    reconcile_rate_window_seconds: float = Field(
        default=60.0,
        description="Sliding window length for reconcile rate limiting.",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
