FROM python:3.12-slim

WORKDIR /app

COPY packages/shared /app/packages/shared
COPY data/fixtures /app/data/fixtures
COPY services/mcp /app/services/mcp

RUN pip install --no-cache-dir -e /app/packages/shared \
    && pip install --no-cache-dir "mcp>=1.28.0" "pydantic>=2.0" \
    && pip install --no-cache-dir --no-deps -e /app/services/mcp

ENV VERITY_REPO_ROOT=/app
WORKDIR /app/services/mcp

EXPOSE 8001

CMD ["python", "-m", "mcp_server.main"]
