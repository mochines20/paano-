-- Daily source refresh + human review queue.
-- Run after schema.sql. Only service-role updater/reviewer should access these tables.

create table if not exists public.knowledge_refresh_runs (
  id bigint generated always as identity primary key,
  source_id text not null,
  status text not null default 'pending',
  source_url text not null,
  records_found integer not null default 0,
  error_message text,
  checked_at timestamptz not null default now()
);

create index if not exists knowledge_refresh_runs_source_idx
  on public.knowledge_refresh_runs (source_id, checked_at desc);

create table if not exists public.knowledge_candidates (
  id bigint generated always as identity primary key,
  source_id text not null,
  refresh_run_id bigint references public.knowledge_refresh_runs(id) on delete cascade,
  payload jsonb not null,
  status text not null default 'pending',
  reviewer_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_candidates_review_idx
  on public.knowledge_candidates (status, created_at desc);

alter table public.knowledge_refresh_runs enable row level security;
alter table public.knowledge_candidates enable row level security;
-- No anon policies: service_role bypasses RLS. Review endpoint is token-protected.
