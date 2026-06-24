-- Multi-admin / multi-quiz architecture.
-- Run this after 202606250001_initial_schema.sql.

create table if not exists public.admin_quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null default 'Đề thi mới',
  slug text not null unique,
  draft_config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_quizzes (
  id uuid primary key references public.admin_quizzes(id) on delete cascade,
  slug text not null unique,
  config jsonb not null,
  published_at timestamptz not null default now()
);

create table if not exists public.shared_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.shared_quizzes(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  result jsonb not null,
  started_at timestamptz,
  submitted_at timestamptz not null default now()
);

create index if not exists admin_quizzes_owner_id_idx
  on public.admin_quizzes(owner_id);
create index if not exists shared_quizzes_slug_idx
  on public.shared_quizzes(slug);
create index if not exists shared_quiz_attempts_quiz_id_idx
  on public.shared_quiz_attempts(quiz_id);

alter table public.admin_quizzes enable row level security;
alter table public.shared_quizzes enable row level security;
alter table public.shared_quiz_attempts enable row level security;

create policy "admins create own quizzes"
on public.admin_quizzes for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "admins read own quizzes"
on public.admin_quizzes for select to authenticated
using (owner_id = (select auth.uid()));

create policy "admins update own quizzes"
on public.admin_quizzes for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "admins delete own quizzes"
on public.admin_quizzes for delete to authenticated
using (owner_id = (select auth.uid()));

create policy "public reads shared quizzes"
on public.shared_quizzes for select to anon, authenticated
using (true);

create policy "owners manage shared quizzes"
on public.shared_quizzes for all to authenticated
using (
  exists (
    select 1 from public.admin_quizzes q
    where q.id = shared_quizzes.id
      and q.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.admin_quizzes q
    where q.id = shared_quizzes.id
      and q.owner_id = (select auth.uid())
  )
);

create policy "public submits shared quiz attempts"
on public.shared_quiz_attempts for insert to anon, authenticated
with check (true);

create policy "owners read shared quiz attempts"
on public.shared_quiz_attempts for select to authenticated
using (
  exists (
    select 1 from public.admin_quizzes q
    where q.id = shared_quiz_attempts.quiz_id
      and q.owner_id = (select auth.uid())
  )
);

-- Every account created in this platform is a quiz creator/admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    'admin'::public.app_role
  )
  on conflict (id) do update
  set display_name = excluded.display_name,
      role = 'admin'::public.app_role,
      updated_at = now();
  return new;
end;
$$;

-- Existing authenticated creators become admins.
update public.profiles set role = 'admin' where role = 'student';

create or replace function public.publish_owned_quiz(target_quiz_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  quiz_record public.admin_quizzes%rowtype;
begin
  select * into quiz_record
  from public.admin_quizzes
  where id = target_quiz_id
    and owner_id = (select auth.uid());

  if quiz_record.id is null then
    raise exception 'Quiz not found or access denied';
  end if;

  insert into public.shared_quizzes (id, slug, config, published_at)
  values (quiz_record.id, quiz_record.slug, quiz_record.draft_config, now())
  on conflict (id) do update
  set slug = excluded.slug,
      config = excluded.config,
      published_at = excluded.published_at;

  return quiz_record.slug;
end;
$$;

revoke execute on function public.publish_owned_quiz(uuid) from public, anon;
grant execute on function public.publish_owned_quiz(uuid) to authenticated;
