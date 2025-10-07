-- migrate:up

create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count integer default 5,
  similarity_threshold double precision default 0.0
)
returns table (
  id uuid,
  doc_path text,
  chunk_index integer,
  content text,
  content_hash text,
  metadata jsonb,
  updated_at timestamptz,
  similarity double precision
)
language sql
stable
set search_path = public
as $function$
  select
    dc.id,
    dc.doc_path,
    dc.chunk_index,
    dc.content,
    dc.content_hash,
    dc.metadata,
    dc.updated_at,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks as dc
  where query_embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) >= similarity_threshold
  order by dc.embedding <=> query_embedding asc
  limit greatest(match_count, 1);
$function$;

comment on function public.match_document_chunks(vector, integer, double precision)
  is 'Returns the most similar documentation chunks using cosine distance with an optional similarity threshold.';

-- migrate:down

drop function if exists public.match_document_chunks(vector, integer, double precision);
