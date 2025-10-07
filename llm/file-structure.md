# File structure

```
repo-root/
├─ apps/
│  └─ web/                          # Next.js (App Router)
│     ├─ app/
│     │  ├─ api/
│     │  │  └─ chat/route.ts        # RAG回答API（OpenAI + Supabase）
│     │  ├─ chat/page.tsx           # チャットUI
│     │  ├─ docs/
│     │  │  ├─ page.tsx             # ドキュメント一覧
│     │  │  └─ [...slug]/page.tsx   # MDXドキュメント表示
│     │  ├─ layout.tsx
│     │  └─ page.tsx                # Hero + CTA
│     ├─ components/
│     │  ├─ chat/chat-panel.tsx     # チャット画面（クライアント）
│     │  └─ providers.tsx           # Theme Provider
│     ├─ content/docs/              # Markdown/MDXドキュメント原稿
│     ├─ lib/
│     │  ├─ docs.ts                 # MDXローダー
│     │  ├─ env.ts                  # 環境変数バリデーション
│     │  └─ supabase.ts             # サーバー用 Supabase client
│     ├─ next.config.mjs
│     ├─ tailwind.config.ts
│     ├─ postcss.config.mjs
│     └─ package.json
│
├─ packages/
│  ├─ core/                         # 共有ロジック（チャンク/埋め込み等）
│  │  └─ src/                       # Deno/Node両対応を意識
│  ├─ ui/                           # 共通UI（Shadcn UI）
│  │  └─ src/
│  ├─ eslint-config/                # 共通ESLint
│  └─ typescript-config/            # 共通TSConfig
│
├─ supabase/                        # supabase init の成果物（ルート推奨）
│  ├─ config.toml
│  ├─ migrations/
│  │  └─ 0001_init.sql              # document_chunks, index など
│  └─ functions/
│     └─ reindex/
│        ├─ index.ts                # Edge Function: 差分→埋め込み→upsert
│        └─ deno.json
│
├─ .github/
│  └─ workflows/
│     └─ reindex.yml                # push/PRで Edge Function を叩く
│
├─ .env.example                     # NEXT_PUBLIC_SUPABASE_URL 等
├─ turbo.json
├─ pnpm-workspace.yaml
├─ package.json
├─ tsconfig.json
└─ README.md
```
