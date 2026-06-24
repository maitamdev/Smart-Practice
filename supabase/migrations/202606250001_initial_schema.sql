-- Smart Practice production schema

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_drafts (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.published_quizzes (
  id text primary key,
  config jsonb not null,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now()
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  answers jsonb not null default '{}'::jsonb,
  result jsonb not null,
  started_at timestamptz,
  submitted_at timestamptz not null default now()
);

create index quiz_attempts_quiz_id_idx on public.quiz_attempts(quiz_id);
create index quiz_attempts_user_id_idx on public.quiz_attempts(user_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- The first authenticated account may bootstrap itself as admin.
create or replace function public.bootstrap_first_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if exists (select 1 from public.profiles where role = 'admin') then
    return false;
  end if;
  update public.profiles
  set role = 'admin', updated_at = now()
  where id = (select auth.uid());
  return true;
end;
$$;

create or replace function public.publish_quiz(quiz_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare draft_config jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  select config into draft_config from public.quiz_drafts where id = quiz_id;
  if draft_config is null then
    raise exception 'Draft not found';
  end if;
  insert into public.published_quizzes (id, config, published_by, published_at)
  values (quiz_id, draft_config, (select auth.uid()), now())
  on conflict (id) do update
  set config = excluded.config,
      published_by = excluded.published_by,
      published_at = excluded.published_at;
end;
$$;

alter table public.profiles enable row level security;
alter table public.quiz_drafts enable row level security;
alter table public.published_quizzes enable row level security;
alter table public.quiz_attempts enable row level security;

create policy "users read own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

create policy "users update own display name"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Prevent clients from changing their own role through the Data API.
revoke update on public.profiles from authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;

create policy "admins manage drafts"
on public.quiz_drafts for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "everyone reads published quizzes"
on public.published_quizzes for select to anon, authenticated
using (true);

create policy "admins manage published quizzes"
on public.published_quizzes for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "anyone submits attempts"
on public.quiz_attempts for insert to anon, authenticated
with check (user_id is null or user_id = (select auth.uid()));

create policy "users read own attempts"
on public.quiz_attempts for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quiz-assets',
  'quiz-assets',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/ogg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "public reads quiz assets"
on storage.objects for select to anon, authenticated
using (bucket_id = 'quiz-assets');

create policy "admins upload quiz assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'quiz-assets' and public.is_admin());

create policy "admins update quiz assets"
on storage.objects for update to authenticated
using (bucket_id = 'quiz-assets' and public.is_admin())
with check (bucket_id = 'quiz-assets' and public.is_admin());

create policy "admins delete quiz assets"
on storage.objects for delete to authenticated
using (bucket_id = 'quiz-assets' and public.is_admin());

revoke execute on function public.bootstrap_first_admin() from public, anon;
grant execute on function public.bootstrap_first_admin() to authenticated;
revoke execute on function public.publish_quiz(text) from public, anon;
grant execute on function public.publish_quiz(text) to authenticated;
