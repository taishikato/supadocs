# MVP To-Do リスト（優先度 P0 > P1 > P2）

## A. プロジェクト基盤
- [x] **P0**: モノレポ初期化（pnpm/turbo）とワークスペース設定
- [x] **P0**: Next.js + Tailwind +（必要なら）shadcn 初期セット（`apps/web`）
- [x] **P0**: 共通TS/ESLint設定（`packages/typescript-config`, `packages/eslint-config`）

## B. Supabase/DB（pgvector）
- [x] **P0**: `supabase init`（ルート）→ `supabase/` 配下に配置
- [x] **P0**: マイグレーション作成  
  - `document_chunks(id, doc_path, chunk_index, content, embedding, content_hash, updated_at)`
  - HNSWインデックス作成（`vector_cosine_ops`）
- [x] **P1**: RPC `match_document_chunks(query_embedding, match_count, similarity_threshold)`

## C. Edge Function（reindex）＋ CI
- [x] **P0**: Edge Function `reindex` 雛形  
  - 署名/シークレット検証  
  - GitHub raw からファイル取得 → チャンク → 埋め込み → upsert（`content_hash` で冪等）
- [x] **P0**: GitHub Actions `reindex.yml`  
  - `push`/`pull_request` 発火  
  - 変更ファイル列挙 → Edge FunctionへPOST（`repoRawBaseUrl`, `changedPaths`）
- [x] **P1**: 手動実行（`workflow_dispatch`）や nightly 全量再インデックス

## D. Embedding/LLM 連携
- [x] **P0**: 埋め込み生成ユーティリティ（Supabase AI or OpenAI）  
- [x] **P0**: チャンク戦略（段落優先、200–400 tokens 目安、ヘッダ保持）

## E. Webアプリ（Docs表示 + チャット）
- [x] **P0**: MDXレンダリング（見出し/コード/リンク、最低限でOK）
- [x] **P0**: `/api/chat` 実装（RAG: embed→match→LLM→回答＋出典）
- [x] **P0**: チャットUI（入力、履歴、引用元リンク表示）
- [x] **P1**: Vercel AI SDK を導入し、ストリーミング応答に対応
- [x] **P1**: `/api/chat` を AI SDK ベースにリファクタリング（トークン管理含む）
- [x] **P1**: Markdownエクスポート（各ページDL）

## F. DX/ドキュメント
- [x] **P0**: `.env.example` 整備（`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`）
- [x] **P0**: README（セットアップ、CI、Edgeデプロイ手順）
- [x] **P1**: サンプルDocs（3–5ページのMDXと内部リンク）

## G. デフォルトUI
- [ ] **P0**: `/docs`配下の基本的なレイアウト(sidebar + main content)
- [x] **P0**: ダミーコンテンツ配置

## H. 完了判定（DoD）
- [x] **P0**: Next.jsでMDXが表示できる
- [ ] **P0**: push/PRで**差分だけ**埋め込みが更新される
- [x] **P0**: チャットUIが文脈＋出典付きで回答する（RAG）
- [ ] **P0**: OSSとして公開・READMEで再現手順が明記
