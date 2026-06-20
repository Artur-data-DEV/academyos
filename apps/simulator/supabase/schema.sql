-- Supabase schema for CSA Adaptive Simulator
-- Execute in Supabase SQL Editor.

create extension if not exists pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.question_status AS ENUM ('not_seen', 'wrong', 'correct');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.simulation_mode AS ENUM ('balanced', 'review_errors', 'random');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.simulation_status AS ENUM ('in_progress', 'completed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE public.question_type AS ENUM ('single_choice', 'multi_select');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id bigint primary key,
  source_id bigint,
  topic text not null,
  question_type public.question_type not null default 'single_choice',
  question text not null,
  correct_answer text[] not null,
  options_json jsonb not null default '[]'::jsonb,
  source_json jsonb,
  created_at timestamptz not null default now()
);

alter table public.questions
  add column if not exists question_type public.question_type not null default 'single_choice';

update public.questions
set question_type = case
  when cardinality(correct_answer) > 1 then 'multi_select'::public.question_type
  else 'single_choice'::public.question_type
end
where question_type is distinct from case
  when cardinality(correct_answer) > 1 then 'multi_select'::public.question_type
  else 'single_choice'::public.question_type
end;

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode public.simulation_mode not null,
  status public.simulation_status not null default 'in_progress',
  total_questions integer not null check (total_questions > 0),
  total_correct integer not null default 0,
  score_percent numeric(5, 2) not null default 0,
  duration_seconds integer not null default 0,
  topic_filter text[],
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.simulation_questions (
  id bigserial primary key,
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  question_id bigint not null references public.questions(id) on delete cascade,
  position integer not null,
  selected_answer text[] not null default '{}'::text[],
  correct_answer text[] not null,
  is_correct boolean,
  topic text not null,
  unique (simulation_id, question_id),
  unique (simulation_id, position)
);

create table if not exists public.user_question_stats (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id bigint not null references public.questions(id) on delete cascade,
  status public.question_status not null default 'not_seen',
  times_seen integer not null default 0,
  times_correct integer not null default 0,
  times_wrong integer not null default 0,
  last_seen_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index if not exists idx_questions_topic on public.questions(topic);
create index if not exists idx_simulations_user_created_at on public.simulations(user_id, created_at desc);
create index if not exists idx_simulation_questions_sim on public.simulation_questions(simulation_id);
create index if not exists idx_user_question_stats_user_status on public.user_question_stats(user_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_question_stats_updated_at on public.user_question_stats;
create trigger trg_user_question_stats_updated_at
before update on public.user_question_stats
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.simulations enable row level security;
alter table public.simulation_questions enable row level security;
alter table public.user_question_stats enable row level security;

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- questions (readonly for authenticated users)
DROP POLICY IF EXISTS "questions_read_authenticated" ON public.questions;
create policy "questions_read_authenticated"
on public.questions
for select
to authenticated
using (true);

-- simulations
DROP POLICY IF EXISTS "simulations_select_own" ON public.simulations;
create policy "simulations_select_own"
on public.simulations
for select
to authenticated
using (auth.uid() = user_id);

DROP POLICY IF EXISTS "simulations_insert_own" ON public.simulations;
create policy "simulations_insert_own"
on public.simulations
for insert
to authenticated
with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "simulations_update_own" ON public.simulations;
create policy "simulations_update_own"
on public.simulations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "simulations_delete_own" ON public.simulations;
create policy "simulations_delete_own"
on public.simulations
for delete
to authenticated
using (auth.uid() = user_id);

-- simulation_questions
DROP POLICY IF EXISTS "simulation_questions_select_own" ON public.simulation_questions;
create policy "simulation_questions_select_own"
on public.simulation_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.simulations s
    where s.id = simulation_questions.simulation_id
      and s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "simulation_questions_insert_own" ON public.simulation_questions;
create policy "simulation_questions_insert_own"
on public.simulation_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.simulations s
    where s.id = simulation_questions.simulation_id
      and s.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "simulation_questions_update_own" ON public.simulation_questions;
create policy "simulation_questions_update_own"
on public.simulation_questions
for update
to authenticated
using (
  exists (
    select 1
    from public.simulations s
    where s.id = simulation_questions.simulation_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.simulations s
    where s.id = simulation_questions.simulation_id
      and s.user_id = auth.uid()
  )
);

-- user_question_stats
DROP POLICY IF EXISTS "user_question_stats_select_own" ON public.user_question_stats;
create policy "user_question_stats_select_own"
on public.user_question_stats
for select
to authenticated
using (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_question_stats_insert_own" ON public.user_question_stats;
create policy "user_question_stats_insert_own"
on public.user_question_stats
for insert
to authenticated
with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_question_stats_update_own" ON public.user_question_stats;
create policy "user_question_stats_update_own"
on public.user_question_stats
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_question_stats_delete_own" ON public.user_question_stats;
create policy "user_question_stats_delete_own"
on public.user_question_stats
for delete
to authenticated
using (auth.uid() = user_id);

