# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed with pnpm + Turbo. Main app lives in `apps/web` (Next.js 15) with routes under `app/`, shared UI in `components/`, and docs/MDX content in `content/`.
- Shared libraries sit in `packages`: `core` (Supabase + Zod utilities), `ui` (Radix/Tailwind-based components and styles), `eslint-config`, and `typescript-config`.
- Database assets are in `supabase/` (migrations, config). Environment files for the web app live at `apps/web/.env.local`.

## Build, Test, and Development Commands
- `pnpm install` — install workspace deps (Node >= 20).
- `pnpm dev` — Turbo dev mode; starts app watchers (use `pnpm --filter web dev` for only the Next app).
- `pnpm build` — Turbo build across packages; honors `.env` files.
- `pnpm lint` — run ESLint for all packages; `pnpm --filter web typecheck` for TS-only validation.
- `pnpm format` — Prettier on `*.ts/tsx/md`.

## Coding Style & Naming Conventions
- TypeScript + React with module resolution driven by workspace TS configs. Prefer functional components and hooks; name hooks `useXYZ` and components in PascalCase.
- Follow the shared ESLint config (`@workspace/eslint-config`); fail on warnings. Keep imports ordered/unused imports removed.
- Two-space indentation, trailing commas where Prettier applies, and avoid broad `any`. Co-locate helpers in `lib/` and keep MDX content snake/kebab-case in `content/`.

## Testing Guidelines
- No committed automated tests yet; add coverage alongside features. Use `*.test.ts`/`*.test.tsx` near the code or in a `__tests__` folder for larger suites.
- Prefer lightweight unit tests for shared packages and Playwright/React Testing Library for UI flows. Always run `pnpm lint` and `pnpm --filter web typecheck` before opening a PR.

## Commit & Pull Request Guidelines
- Commit style follows conventional commits (`fix:`, `chore:`, `add:`) with short, imperative summaries.
- PRs should describe intent, list notable changes, and link issues. Call out schema migrations (`supabase/migrations`) or new env vars (`apps/web/.env.local`) explicitly; include screenshots/gifs for visible UI updates.

## Security & Configuration Tips
- Required keys: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `NEXT_PUBLIC_SITE_URL` in `apps/web/.env.local`; keep keys out of commits.
- Use `supabase link --project-ref <ref>` and `supabase db push` to sync migrations before running the app locally.

## Do
- Write your responses to me in Japanese, but write comments in the source code in English.
- Write a semantic commit messages:
  - Example:
    ```
    feat: add hat wobble
    ^--^  ^------------^
    |     |
    |     +-> Summary in present tense.
    |
    +-------> Type: chore, docs, feat, fix, refactor, style, or test.
    ```
  - More Examples:
    - feat: (new feature for the user, not a new feature for build script)
    - fix: (bug fix for the user, not a fix to a build script)
    - docs: (changes to the documentation)
    - style: (formatting, missing semi colons, etc; no production code change)
    - refactor: (refactoring production code, eg. renaming a variable)
    - test: (adding missing tests, refactoring tests; no production code change)
    - chore: (updating grunt tasks etc; no production code change)
- Use `type` instead of `interface` whenever possible.
- When creating a new component file, name the file in kebab case, like `query-provider.tsx`.