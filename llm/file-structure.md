# File structure

```
repo-root/
├─ apps/
│  └─ web/                          # Next.js (App Router)
│     ├─ app/
│     │  ├─ docs/                   # Markdown/MDXドキュメント
│     │  ├─ api/
│     │  │  ├─ chat/route.ts        # RAG回答API
│     │  │  └─ health/route.ts      # ヘルスチェック
│     │  ├─ layout.tsx
│     │  └─ page.tsx
│     ├─ components/
│     │  ├─ chat/                   # ChatPanel, Message 等
│     │  └─ mdx/                    # MDXRenderer 等
│     ├─ lib/
│     │  ├─ supabase.ts             # browser/server client
│     │  ├─ rag.ts                  # 検索→RAG組み立て
│     │  ├─ chunk.ts                # チャンク分割・正規化
│     │  └─ env.ts                  # 環境変数バリデーション
│     ├─ styles/
│     │  └─ globals.css
│     ├─ next.config.mjs
│     ├─ tailwind.config.ts
│     ├─ postcss.config.mjs
│     └─ package.json
│
├─ packages/
│  ├─ core/                         # 共有ロジック（チャンク/埋め込み等）
│  │  └─ src/                       # Deno/Node両対応を意識
│  ├─ ui/                           # 共通UI（必要になったら抽出）
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