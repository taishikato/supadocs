-- migrate:up

alter table if exists public.document_chunks
  add column if not exists created_at timestamptz not null default now();

-- migrate:down

alter table if exists public.document_chunks
  drop column if exists created_at;
