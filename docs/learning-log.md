# Learning Log

Decisions, tradeoffs, and interview-ready narratives captured as we build.

---

## Day 1 — Two-service architecture

Chose two-service architecture (Python FastAPI agent + Next.js frontend over HTTP) because LangGraph's Python ecosystem is more mature and it mirrors real production FDE systems where the agent is a deployable service, not bundled into the web app.
