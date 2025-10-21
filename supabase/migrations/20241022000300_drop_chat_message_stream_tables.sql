-- migrate:up

drop table if exists public.chat cascade;
drop table if exists public.message cascade;
drop table if exists public.stream cascade;

-- migrate:down

-- no-op: tables intentionally removed
