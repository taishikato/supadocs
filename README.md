# Supadocs 💨

Supadocs is your AI-friendly docs starter built with Next.js, Supabase, and OpenAI.

Out of the box you get:
- a built-in RAG-powered search and chat experience
- handy extras like `copy article as Markdown` and `download Markdown file`

## Tech stack
- Supabase + pgvector to store your chunks and embeddings
- OpenAI for embeddings and completions
- GitHub Actions to keep markdown changes flowing into Supabase

## Usage
Spinning up RAG chat takes just 2 steps:
1. Prepare your database
2. Ingest your docs

### Prepare your database
1. Clone the repo: `git clone git@github.com:taishikato/supadocs.git`
2. Link it to your Supabase project: `supabase link --project-ref <your-ref>`
3. Push the migrations: `supabase db push`
4. Expose on the `docs` schema via Supabase Dashboard settings > API Settings > Exposed schemas

### Ingest your docs
Time to drop your documentation into the database as embeddings. GitHub Actions will handle it on every PR.

In your knowledge base repo, spin up a new action at `.github/workflows/generate_embeddings.yml` with this content:
```yaml
name: 'generate_embeddings'
on: # run on main branch changes
  push:
    branches:
      - main

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/embeddings-generator@v0.0.6 # Update this to the latest version.
        with:
          supabase-url: 'https://your-project-ref.supabase.co' # Update this to your project URL.
          supabase-service-role-key: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          openai-key: ${{ secrets.OPENAI_API_KEY }}
          docs-root-path: 'apps/web/content/docs' # the path to the root of your md(x) files
          embedding-model: 'text-embedding-3-small'
```

Just make sure you set your `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` as repository secrets in your repo settings (settings > secrets > actions).

### One more thing
Create `apps/web/.env.local` and set your env vars:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
OPENAI_API_KEY=<your-openai-key>
```

Install the dependencies:
```bash
pnpm install
```

Start the app:
```bash
pnpm dev
```

The app runs at http://localhost:3000.