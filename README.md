# Supadocs

Supadocs is an AI-enabled documentation template built with Next.js, Supabase, and pnpm/TurboRepo. It combines docs-as-code authoring with a semantic search and chat experience so projects ship with Retrieval-Augmented Generation (RAG) on day one.

## Features
- Docs-as-code authoring with Markdown/MDX rendered by `apps/web`
- Supabase pgvector storage and a `reindex` Edge Function for incremental embeddings
- Streaming chat UI backed by Vercel AI SDK and OpenAI-compatible models
- Monorepo sharing via `packages/*` for UI components, core utilities, and future agent runtimes
- GitHub Action that calls the Edge Function after every push or PR merge

## Repository Layout
```
apps/
  web/                 # Next.js App Router UI and API routes
packages/
  core/                # Shared chunking/embedding helpers
  ui/                  # shadcn/ui based component library
  eslint-config/       # ESLint preset consumed across the repo
  typescript-config/   # Base tsconfig used by apps and packages
supabase/
  functions/reindex/   # Edge Function issuing embeddings + upserts
  migrations/          # pgvector table definition and helpers
llm/                   # Product docs, PRD, and planning notes
```

## Requirements
- Node.js 20+
- pnpm 10+
- Supabase CLI
- Docker (for running Supabase locally)

## Getting Started
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy the environment template and fill in credentials:
   ```bash
   cp .env.example .env.local
   ```
   Required values:
   - `NEXT_PUBLIC_SUPABASE_URL` and keys from your Supabase project
   - `OPENAI_API_KEY` (or any API compatible with the OpenAI schema)
   - `EMBEDDING_MODEL`, `OPENAI_CHAT_MODEL`, and `TOKEN_BUDGET` to control model usage
3. Start Supabase locally:
   ```bash
   supabase start
   ```
4. Apply migrations:
   ```bash
   supabase migration up
   ```
5. Run the development servers via Turbo:
   ```bash
   pnpm dev
   ```

The main app runs at `http://localhost:3000` and renders Markdown/MDX content from `apps/web/content/docs`. Updating files in this folder automatically refreshes the UI.

## Supabase Edge Function
The `reindex` Edge Function consumes GitHub webhook payloads and manages pgvector embeddings. To deploy:

```bash
cd supabase
supabase functions deploy reindex
supabase secrets set EDGE_FUNCTION_REINDEX_SECRET=your-secret \
  SERVICE_ROLE_KEY=your-service-role-key \
  OPENAI_API_KEY=sk-... \
  EMBEDDING_MODEL=text-embedding-3-large
```

Configure GitHub Actions (`.github/workflows/reindex.yml`) with the same `EDGE_FUNCTION_REINDEX_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, and Supabase service key so the CI workflow can invoke the function.

## Development Scripts
- `pnpm dev` – Run the Next.js app and watch mode builds
- `pnpm build` – `turbo build` across packages/apps
- `pnpm lint` – Lint all workspaces with the shared config
- `pnpm format` – Apply Prettier across TypeScript/MDX/Markdown files

## Agents Roadmap
Agent runtimes, shared types, and task orchestration will live under upcoming packages:
- `packages/agents-core` for runtime primitives (`registerAgent`, task queue, telemetry)
- `packages/agents-tools` for reusable provider wrappers (LLMs, embeddings, search)
- `scripts/` for Supabase schema syncing and operational tooling

Refer to `llm/prd.md` and `AGENTS.md` for the latest product direction and implementation plans.
