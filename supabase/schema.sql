-- ==================================================================
-- PAANO — Supabase schema (Sprint 1: per-IP question logging)
-- I-run ito sa Supabase SQL editor (Dashboard > SQL > New query).
-- ==================================================================

-- Per-IP na log ng mga tanong. Ito rin ang magiging seed data source
-- para sa "popular paano" lists (Sprint 4+).
create table if not exists public.question_logs (
  id bigint generated always as identity primary key,
  question text not null,
  category text not null default 'generic',
  confidence text not null default 'medium',
  client_ip text,
  repaired boolean not null default false,
  raw text,
  created_at timestamptz not null default now()
);

create index if not exists question_logs_created_at_idx
  on public.question_logs (created_at desc);

create index if not exists question_logs_category_idx
  on public.question_logs (category);

-- Madaling query para sa top questions:
-- select question, count(*) from public.question_logs
--   where created_at > now() - interval '30 days'
--   group by question order by count(*) desc limit 20;

alter table public.question_logs enable row level security;

-- Server-side lang ang insert (service role / anon key from Next.js API
-- route). Para sa MVP, payagan ang insert via anon key:
create policy "Allow insert for question logging"
  on public.question_logs for insert
  to anon
  with check (true);

-- ==================================================================
-- Community verification layer (feature #7) — thumbs + corrections
-- ==================================================================
create table if not exists public.answer_feedback (
  id bigint generated always as identity primary key,
  answer_hash text not null,
  helpful boolean,
  correction text,
  client_ip text,
  status text not null default 'pending',  -- pending | approved | rejected (manual review)
  created_at timestamptz not null default now()
);

create index if not exists answer_feedback_hash_idx
  on public.answer_feedback (answer_hash);

create index if not exists answer_feedback_status_idx
  on public.answer_feedback (status);

alter table public.answer_feedback enable row level security;

create policy "Allow insert for community feedback"
  on public.answer_feedback for insert
  to anon
  with check (true);

-- Read access para sa correction counts (GET /api/feedback?hash=...):
create policy "Allow select correction counts"
  on public.answer_feedback for select
  to anon
  using (true);

-- ==================================================================
-- Sprint 4 (future): community-verified commute routes
-- ==================================================================
-- ==================================================================
-- Sprint 4 (future): community-verified commute routes
-- ==================================================================
-- create table if not exists public.commute_routes (
--   id bigint generated always as identity primary key,
--   origin text not null,
--   destination text not null,
--   modes text[] not null default '{}',
--   time_min_min int, time_min_max int,
--   fare_min int, fare_max int,
--   fare_notes text,
--   status text not null default 'pending',  -- pending | approved | rejected
--   created_at timestamptz not null default now()
-- );
