# Repository Guidelines

## Project Structure & Module Organization
`apps/web` runs the Next.js App Router UI; routes live in `app`, MDX docs in `content`, and shared UI in `components`. Workspace packages supply reuse: `packages/core` bundles Supabase utilities, `packages/ui` exports design system primitives, while `packages/eslint-config` and `packages/typescript-config` centralize linting/TS presets. Database assets reside in `supabase`, and Turbo plus pnpm workspace files at the root wire everything together.

## Build, Test, and Development Commands
- `pnpm install` — bootstrap workspace dependencies (Node 20+, pnpm 10).
- `pnpm dev` — Turbo dev pipeline; serves `apps/web` on :3000 and watches packages.
- `pnpm --filter web dev` — start only the web app with Turbopack HMR.
- `pnpm lint` — ESLint across the monorepo; warnings fail by default.
- `pnpm build` — `turbo build` for Next.js production output and package type checks.
- `pnpm --filter web typecheck` — no-emit TypeScript check for the web app.
- `pnpm format` — Prettier on `ts|tsx|md`; run before committing docs.

## Coding Style & Naming Conventions
TypeScript is the default; keep strict typing and prefer named exports. Prettier handles layout (two-space indent, trailing commas) — never hand-format. React components use `PascalCase`, hooks start with `use`, and shared utilities stay in `packages/core/src` or `packages/ui/src/lib`. Avoid importing from `apps/web` into packages. Adjust lint rules in `packages/eslint-config` instead of adding inline disables.

## Testing Guidelines
Automated tests are not scaffolded yet, so linting and typing guard regressions. When adding tests, colocate `*.test.ts(x)` or use `__tests__` folders to keep Turborepo caching effective. Define test scripts in the owning package and expose them via `turbo.json`, and include manual QA notes in PRs until CI testing is in place.

## Commit & Pull Request Guidelines
With no published history, adopt Conventional Commits (`feat:`, `fix:`) so scopes stay clear. Bundle related work together, and reference Supabase migration filenames when schemas change. PRs should link to an issue/goal, outline the change, list the local checks run, and attach screenshots or clips for UI updates. Request review once checks pass locally.

## Environment & Configuration
Create `.env.local` (not committed) for Next.js and shared packages; document new keys as they appear. Current essentials: `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. Use the Supabase CLI with `supabase/config.toml` when running `supabase migration up`, and keep credentials in your team’s secret manager.
