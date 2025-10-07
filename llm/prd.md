# PRD: AI-Powered Open-Source Documentation Template

## Overview
This project aims to build an **open-source documentation template with AI capabilities built-in from day one**.  
It enables developers to create interactive, searchable documentation sites powered by **Next.js**, **Supabase (pgvector)**, and **Tailwind CSS** — where users can **chat with the docs** via Retrieval-Augmented Generation (RAG).

### Concept
> “Just push to GitHub — and your documentation becomes AI-powered.”

This project bridges the gap between simple static docs and modern, AI-driven developer documentation experiences like Mintlify or GitBook — but in an open, self-hostable form.

---

## Goals
1. Provide a **ready-to-use open-source documentation template** with built-in AI (RAG + chat).
2. Preserve the “Docs-as-Code” philosophy — write in Markdown/MDX, manage via Git.
3. Enable **affordable, self-hostable AI integration** via Supabase (Postgres + pgvector).

---

## Target Users
- **Open-source developers** who want intelligent docs for their projects.  
- **Startup teams** needing internal documentation with natural-language Q&A.  
- **Technical writers** seeking an extensible, developer-friendly doc system.

---

## MVP Scope

### Core Features
| Category | Description | Notes |
|-----------|-------------|-------|
| **Documentation Rendering** | Render Markdown / MDX docs in Next.js | Similar structure to Fumadocs (`/docs` folder). |
| **AI Search (RAG)** | Store embeddings in Supabase (pgvector) and query via semantic search | Uses LangChain or Supabase AI SDK. |
| **Chat UI** | Conversational Q&A interface for documentation | Built with shadcn/ui + Tailwind. |
| **Auto-indexing via GitHub Actions** | On push or PR merge, generate embeddings and update Supabase | Triggers Supabase Edge Function via webhook. |
| **Markdown Export** | Allow users to download docs as Markdown | For offline or backup use. |
| **UI Styling** | Tailwind CSS + shadcn/ui | Clean, modern, minimal look. |

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-------------|--------|
| **Frontend** | Next.js (App Router) | SSR + SSG support, SEO-friendly, widely used. |
| **Styling/UI** | Tailwind CSS + shadcn/ui | Rapid UI development and composable components. |
| **Database** | Supabase (Postgres + pgvector) | Open, self-hostable, ideal for AI/RAG workloads. |
| **Backend Logic** | Supabase Edge Functions | Secure webhook endpoint for GitHub Actions. |
| **CI/CD** | GitHub Actions | Simple automation for push or PR events. |
| **Hosting** | Vercel / Supabase | Common OSS-friendly deployment stack. |

---

## System Architecture

```

┌──────────────────────────┐
│       GitHub Repo        │
│  └─ docs/ (Markdown)     │
└────────────┬─────────────┘
│ push / merge
▼
┌──────────────────────────┐
│     GitHub Actions CI     │
│  - detect changed files   │
│  - call Edge Function     │
└────────────┬─────────────┘
▼
┌──────────────────────────┐
│ Supabase Edge Function    │
│  - fetch raw doc files    │
│  - chunk + embed content  │
│  - upsert into pgvector   │
└────────────┬─────────────┘
▼
┌──────────────────────────┐
│ Supabase (pgvector Table) │
│  - doc_path               │
│  - chunk_text             │
│  - embedding vector       │
└────────────┬─────────────┘
▼
┌──────────────────────────┐
│   Next.js Web App (UI)    │
│  - render docs            │
│  - AI chat / Q&A          │
│  - semantic search        │
└──────────────────────────┘

````

---

## Detailed Design

### Database Schema (Supabase)
```sql
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_path text not null,         -- e.g. /docs/getting-started.md
  chunk_index integer not null,
  content text not null,
  embedding vector(1536),         -- OpenAI/Supabase embedding
  content_hash text not null,     -- for idempotency
  updated_at timestamptz default now()
);
````

---

### Data Flow

#### 1. Edit and Push

User edits Markdown locally and pushes changes to GitHub.

#### 2. GitHub Actions Trigger

* Detect changed files.
* Send changed file paths to Supabase Edge Function (`POST /api/reindex`).

#### 3. Edge Function

* Fetch raw Markdown via GitHub raw URLs.
* Parse and split text into chunks (e.g., 400 tokens each).
* Generate embeddings for each chunk (via Supabase AI or OpenAI API).
* Upsert into `document_chunks` (skip duplicates using `content_hash`).

#### 4. Web App (Next.js)

* Query embeddings from Supabase for semantic search.
* Retrieve top-k relevant chunks.
* Pass them to an LLM (e.g., GPT-4o-mini) for contextual Q&A.
* Display answers + source references in chat UI.

---

## UI Overview

| Page                      | Description                                      |
| ------------------------- | ------------------------------------------------ |
| **Home Page**             | Doc index + search bar                           |
| **Doc Page**              | Rendered Markdown + floating AI chat button      |
| **Chat Window**           | Conversational Q&A referencing the docs          |
| **(Optional) Admin Page** | Manual “Reindex” button, logs, etc. (v2 feature) |

---

## Non-Functional Requirements

* **Performance:** Uses Next.js SSG/ISR for fast rendering.
* **Scalability:** pgvector handles large-scale embedding search efficiently.
* **Security:** HMAC signature verification for GitHub → Edge Function calls.
* **OSS Licensing:** MIT License.
* **Development Environment:** Node.js 20+, Supabase CLI, GitHub Actions.

---

## Definition of Done (MVP)

* [x] Markdown/MDX docs render properly in Next.js.
* [x] GitHub push triggers automatic embedding generation and Supabase update.
* [x] Chat UI returns accurate, RAG-based answers.
* [x] Tailwind + shadcn UI functional.
* [x] Open-sourced with clear setup instructions in README.

---

## Future Roadmap (Post-MVP)

* Versioned docs (e.g., `/v1`, `/v2`).
* AI-powered automatic summaries.
* Supabase Auth for private/internal docs.
* Multi-language documentation.
* “Deploy to Vercel” one-click deployment support.

---

## License

MIT License — open and reusable for commercial and community projects.

---

## Author

**Taishi Kato**
[https://github.com/taishikato](https://github.com/taishikato)