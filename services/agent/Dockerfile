FROM python:3.12-slim

WORKDIR /app

# Monorepo deps: shared schemas + fixture data for reconciliation
COPY packages/shared /app/packages/shared
COPY data/fixtures /app/data/fixtures
COPY services/agent /app/services/agent

RUN pip install --no-cache-dir -e /app/packages/shared \
    && pip install --no-cache-dir \
        "fastapi>=0.115.0" "uvicorn[standard]>=0.32.0" \
        "langgraph>=0.2.0" "langchain-anthropic>=0.3.0" "langchain-core>=0.3.0" \
        "pydantic>=2.0" "pydantic-settings>=2.0" "mcp>=1.28.0" "braintrust==0.26.0" \
    && pip install --no-cache-dir --no-deps -e /app/services/agent

ENV VERITY_REPO_ROOT=/app
WORKDIR /app/services/agent

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "agent.main:app", "--host", "0.0.0.0", "--port", "8000"]
