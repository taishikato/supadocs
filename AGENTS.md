# Supadocs Agents

This document sketches the agent system we intend to build inside Supadocs. The application currently only ships the default Next.js starter page; no agent runtime has been implemented yet. Treat the sections below as the high-level contract for the upcoming work.

## Scope & Goals
- **Automate documentation workflows.** Agents help collect source material, draft copies, and maintain consistency across docs.
- **Keep everything auditable.** Every agent action must be reproducible with recorded inputs and outputs.
- **Stay privacy-first.** User content never leaves our controlled infrastructure or approved vendors.

## Agent Taxonomy (proposed)
- **Collector Agent** fetches context from configured sources (e.g. Supabase, markdown repos, product specs).
- **Composer Agent** synthesizes the context into drafts, changelog entries, or FAQs.
- **Reviewer Agent** checks drafts against style rules, verifies facts, and highlights uncertainties.
- **Router Agent** (optional) decides which downstream agent to trigger next based on confidence scores.

Each agent runs independently but communicates via a shared task queue so we can replay or inspect the chain.

## High-Level Architecture
1. **Entry point.** Next.js Server Actions or API routes receive a task request and enqueue it (`agents/tasks.ts`).
2. **Task orchestrator.** A lightweight runtime pulls tasks, resolves dependencies, and dispatches to an agent-specific handler (`agents/runtime.ts`).
3. **Tools.** Reusable capabilities (search, embeddings, formatting) live under `agents/tools/`. Agents compose these rather than talking to services directly.
4. **Audit log.** All steps log structured events to `supabase` (table `agent_events`) so we can trace runs.
5. **Output adapters.** Results flow back to the UI through server actions or websockets so the client can stream intermediate updates.

_Note: directories listed above do not exist yet; create them as part of the implementation work._

## Implementation Checklist
1. **Bootstrap runtime.**
   - Add `agents/` directory with `runtime.ts` exporting `registerAgent()` and `runTask()` helpers.
   - Decide on either Edge Functions or background Cron; default to server actions for MVP.
2. **Define contracts.**
   - Create `AgentTask` and `AgentResult` TypeScript interfaces in `agents/types.ts`.
   - Write unit tests covering happy-path execution and error bubbling.
3. **Integrate provider.**
   - Store API keys in `.env.local` (`AI_PROVIDER_KEY`, `EMBEDDING_MODEL`).
   - Wrap provider calls in `agents/tools/model.ts` so we can swap vendors.
4. **Add persistence.**
   - Extend Supabase schema for `agent_runs`, `agent_events`, `agent_artifacts`.
   - Provide script `scripts/sync-schema.ts` to apply migrations locally.
5. **Ship first agent.**
   - Implement Collector Agent that indexes markdown files from `content/`.
   - Expose `/api/agents/collect` endpoint for manual triggering and integration tests.
6. **UI wiring.**
   - Add timeline view on `/agents` to stream run updates.
   - Surface retry controls plus download of final artifacts.

## Guardrails & Observability
- Always enforce a max token budget per task; default 8k tokens.
- Attach correlation IDs to every log; include them in client-side error toasts.
- Collect metrics (`success_rate`, `avg_duration_ms`, `avg_prompt_tokens`) via your chosen analytics pipeline.
- Add integration tests that replay canned tasks to detect regressions.

## Open Questions
- Which provider powers embeddings (OpenAI, Together, local models)?
- Do we need cross-run shared memory, or is per-task context enough?
- Should we isolate long-running agents into background workers outside the Next.js runtime?

Keep this file updated as decisions land. Once the first agent ships, replace the proposed sections with the concrete implementation details.

## MCP
If you need to use MCP, then use it.

## Do
Always respond in Japanese.