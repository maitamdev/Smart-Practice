-- Daily AI generation quota per creator.

create table if not exists public.ai_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  request_count integer not null default 0,
  generated_questions integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.ai_usage_daily enable row level security;

create policy "creators read own ai usage"
on public.ai_usage_daily for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.consume_ai_quota(question_count integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_requests integer;
  current_questions integer;
  max_requests constant integer := 50;
  max_questions constant integer := 500;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if question_count < 1 or question_count > 20 then
    raise exception 'Question count must be between 1 and 20';
  end if;

  insert into public.ai_usage_daily (user_id, usage_date)
  values ((select auth.uid()), current_date)
  on conflict (user_id, usage_date) do nothing;

  select request_count, generated_questions
  into current_requests, current_questions
  from public.ai_usage_daily
  where user_id = (select auth.uid()) and usage_date = current_date
  for update;

  if current_requests >= max_requests
    or current_questions + question_count > max_questions then
    raise exception 'Daily AI quota exceeded';
  end if;

  update public.ai_usage_daily
  set request_count = request_count + 1,
      generated_questions = generated_questions + question_count,
      updated_at = now()
  where user_id = (select auth.uid()) and usage_date = current_date
  returning request_count, generated_questions
  into current_requests, current_questions;

  return jsonb_build_object(
    'request_count', current_requests,
    'generated_questions', current_questions,
    'remaining_requests', max_requests - current_requests,
    'remaining_questions', max_questions - current_questions
  );
end;
$$;

revoke execute on function public.consume_ai_quota(integer) from public, anon;
grant execute on function public.consume_ai_quota(integer) to authenticated;
