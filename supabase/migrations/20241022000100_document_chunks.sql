-- migrate:up

create extension if not exists "pgcrypto";
create extension if not exists vector;

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_path text not null,
  chunk_index integer not null,
  content text not null,
  embedding vector(1536) not null,
  content_hash text not null,
  metadata jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists document_chunks_doc_path_chunk_index_idx
  on public.document_chunks (doc_path, chunk_index);

create unique index if not exists document_chunks_doc_path_content_hash_idx
  on public.document_chunks (doc_path, content_hash);

create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

-- migrate:down

drop index if exists document_chunks_embedding_hnsw_idx;
drop index if exists document_chunks_doc_path_content_hash_idx;
drop index if exists document_chunks_doc_path_chunk_index_idx;
drop table if exists public.document_chunks;
