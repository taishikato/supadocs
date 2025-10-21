# Supadocs Agents

Supadocs は pnpm/TurboRepo ベースのモノレポに移行しました。本ドキュメントは、エージェント機能を既存のリポジトリ構成にどう落とし込むかを示す実装計画の最新版です。仕様が確定し次第、ここを更新し続けてください。

## Monorepo Layout Snapshot
- `apps/web/` – Next.js App Router。本番 UI とサーバーアクションはここに常駐させる。
- `packages/ui/` – shadcn/ui ベースの共有コンポーネント。ランタイムの UI 部品（タイムライン、再実行ボタン等）はここに追加。
- `packages/eslint-config/`, `packages/typescript-config/` – 共通設定。新パッケージはこれらを継承する。
- `llm/prd.md` – 既存の AI/RAG PRD。エージェント仕様と整合させる。
- （新設予定）`packages/agents-core/` – ランタイム、型定義、キュー連携、テレメトリの共有実装を配置。
- （新設予定）`packages/agents-tools/` – モデル呼び出しやインデクサなど、再利用可能なツール群を切り出す。
- （新設予定）`scripts/` – Supabase スキーマ同期などのユーティリティ CLI を置く。

## Scope & Goals
- **Automate documentation workflows.** Collector → Composer → Reviewer の流れを自動化し、Supadocs の RAG 基盤と連携できる設計にする。
- **Keep everything auditable.** 全てのタスクに correlation ID を割り当て、入力・出力・使用ツールを Supabase に記録する。
- **Stay privacy-first.** `.env` と Supabase 上の安全なストレージを利用し、未承認ベンダーへのデータ送信を禁止する。

## Agent Taxonomy
- **Collector Agent** – `content/` ディレクトリの Markdown/MDX をクロールし、埋め込みやメタデータを生成。初期リリースの対象。
- **Composer Agent** – コンテキストをまとめてドラフト/FAQ/Changelog を生成。Collector の成果を前提に後続で実装。
- **Reviewer Agent** – ガイドライン順守と事実検証を行い、修正提案と不確実性タグを付与する。
- **Router Agent**（オプション） – 実行結果と信頼度を監視し、次に呼ぶエージェントを選択する。MVP ではルールベース。

各エージェントはキューを介して独立に動作し、再実行可能なイベントストリームを残す。

## Runtime & Architecture
1. **Entry Points（apps/web）**  
   - `app/api/agents/[agent]/route.ts` 経由の API Route と Server Action を提供。Cron/Edge Functions を検討するが、MVP は Server Action を優先。  
   - タスクを `packages/agents-core` の `enqueueTask()` に委譲する。
2. **Task Orchestrator（packages/agents-core）**  
   - `runtime.ts` に `registerAgent()`、`runTask()`、`AgentRegistry` を実装。  
   - インメモリキュー → Supabase キュー（`agent_runs`）→ 将来的な外部ワーカーへの移行を想定したインターフェースを用意。
3. **Types & Contracts（packages/agents-core/src/types.ts）**  
   - `AgentTask`, `AgentResult`, `AgentContext`, `AgentToolInvocation`, `AuditEvent` などを定義。  
   - タスク間の payload を JSON Schema でバリデーションする（Zod を想定）。
4. **Tools（packages/agents-tools）**  
   - `model.ts` にプロバイダー抽象化を実装（`OPENAI_API_KEY` を使用）。  
   - 検索、フォーマッタ、埋め込み生成など再利用可能な関数を格納。  
   - 将来的に `packages/agents-tools-search`, `packages/agents-tools-format` などの分割も視野。
5. **Persistence & Audit**  
   - Supabase の `agent_runs`, `agent_events`, `agent_artifacts` テーブルでタスクライフサイクルを保存。  
   - すべてのロギングに `correlation_id`, `task_id`, `agent_name` を付与し、Next.js クライアントのエラートーストに連携。
6. **Output Delivery**  
   - `/agents` ページから server-sent events もしくは Supabase realtime を使いストリーム更新。  
   - ランタイムから返却される `AgentResult` を UI の `Timeline` コンポーネントへ渡す。

## Implementation Roadmap
1. **Bootstrap shared runtime**  
   - `packages/agents-core` を作成し、`src/runtime.ts`, `src/registry.ts`, `src/index.ts` を実装。  
   - `registerAgent()` は `AgentDefinition` を受け取り、ハンドラ、ツールセット、メタデータ（token budget, retry policy）を登録。  
   - `runTask()` は型安全な復帰値・例外伝播を保証。
2. **Define contracts & tests**  
   - `src/types.ts` に `AgentTask`, `AgentResult`, `AgentRun`, `AgentEvent` を定義。  
   - `tests/runtime.test.ts` を Vitest or Jest で作成し、ハッピーケース／失敗時のエラーバブル／再試行制御をカバー。  
   - Turbo pipeline に `pnpm test --filter agents-core` を追加。
3. **Tooling & Provider integration**  
   - `.env.local`（ルートで共有し Next.js にエクスポート）に `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` を定義。  
   - `packages/agents-tools/src/model.ts` でプロバイダー呼び出しをラップし、最大トークン数を強制。  
   - 将来の差し替えを想定し、プロバイダー設定を `apps/web/app/config/agents.ts` に集約。
4. **Persistence & schema sync**  
   - `supabase/migrations/` に `agent_runs`, `agent_events`, `agent_artifacts` の DDL を作成。  
   - `scripts/sync-schema.ts` で Supabase CLI を叩きローカル環境へ適用（pnpm script を追加）。  
   - ランタイムで `agent_runs` にステータス、`agent_events` に逐次ログ、`agent_artifacts` に生成物を保存。
5. **Ship Collector Agent (MVP)**  
   - `packages/agents-core/src/agents/collector.ts` に Collector を実装し、`content/` の Markdown/MDX を走査。  
   - Embedding の更新結果を `agent_artifacts` に保存し、必要に応じて Supabase pgvector へ書き込むフックを用意。  
   - `apps/web/app/api/agents/collect/route.ts` と `app/actions/agents/collect.ts` から Collector を呼び出し、HTTP 200/4xx/5xx を整理。
6. **UI wiring**  
   - `apps/web/app/agents/page.tsx` にタイムライン UI を新設。`packages/ui` に `AgentRunTimeline` コンポーネントを追加。  
   - 実行履歴、再実行ボタン、アーティファクトのダウンロードリンク（Supabase Storage or signed URL）を実装。  
   - Supabase Realtime もしくは server-sent events を用い、`AgentEvent` のストリームを流す。
7. **Observability & Metrics**  
   - `packages/agents-core` で `success_rate`, `avg_duration_ms`, `avg_prompt_tokens` を計測。  
   - メトリクス送信先として Supabase, PostHog, or OpenTelemetry Exporter を比較検討。  
   - アラート条件（例: 失敗率 > 5%）を決め、Next.js 側で通知。

## Guardrails & Testing
- 各 `AgentDefinition` に `maxPromptTokens` を設定し、ランタイムで enforce。  
- すべての `AgentEvent` に `correlation_id` を付与し、UI/ログ双方でトレース可能に。  
- Collector の再実行は冪等（`content_hash`）に保ち、重複インデックスを防止。  
- E2E: `apps/web` で Playwright を採用し、Collector の手動トリガーとストリーム表示を検証。  
- Integration: canned タスクを `packages/agents-core/tests/fixtures/` に追加し、退行テストを自動化。

## Open Questions
- embeddings プロバイダーを OpenAI / Together / Supabase AI のどれにするか。コストとレイテンシの比較が必要。  
- 長時間ジョブを Next.js runtime から切り離すタイミング。Queue（Supabase Functions, Inngest など）に移す？  
- マルチテナント対応が必要になった場合、`agent_runs` のスキーマをどう拡張するか（`project_id` か `tenant_id` を追加？）。

## MCP
利用が必要な場合はMCPを活用すること。

## Do
- 常に日本語で応答すること。
- Supabase SDKを使用する際、`.eq`の代わりに`.match`を使用すること。
- プロダクト内の文章は英語で
