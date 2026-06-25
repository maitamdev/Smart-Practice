-- Score public quiz attempts on the database instead of trusting client results.

drop policy if exists "public reads shared quizzes"
on public.shared_quizzes;

drop policy if exists "public submits shared quiz attempts"
on public.shared_quiz_attempts;

revoke select on public.shared_quizzes from anon;
revoke insert on public.shared_quiz_attempts from anon, authenticated;

create or replace function public.get_public_quiz(target_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  quiz_id uuid;
  quiz_config jsonb;
  public_questions jsonb;
begin
  select id, config
  into quiz_id, quiz_config
  from public.shared_quizzes
  where slug = target_slug;

  if quiz_id is null then
    return null;
  end if;

  select coalesce(
    jsonb_agg(question_record - 'correctOptionId' - 'explanation'),
    '[]'::jsonb
  )
  into public_questions
  from jsonb_array_elements(
    coalesce(quiz_config -> 'questions', '[]'::jsonb)
  ) as question_items(question_record);

  quiz_config := jsonb_set(
    quiz_config,
    '{questions}',
    public_questions,
    true
  );

  return jsonb_build_object(
    'id', quiz_id,
    'config', quiz_config
  );
end;
$$;

create or replace function public.submit_quiz_attempt(
  target_quiz_id uuid,
  submitted_answers jsonb,
  started_at_value timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  quiz_config jsonb;
  question_record jsonb;
  question_id text;
  selected_option text;
  correct_option text;
  sanitized_answers jsonb := '{}'::jsonb;
  correct_count integer := 0;
  incorrect_count integer := 0;
  unanswered_count integer := 0;
  total_count integer := 0;
  percentage_value integer := 0;
  submitted_time timestamptz := now();
  safe_started_at timestamptz := null;
  result_payload jsonb;
  answer_key jsonb := '{}'::jsonb;
  explanations jsonb := '{}'::jsonb;
begin
  if submitted_answers is null or jsonb_typeof(submitted_answers) <> 'object' then
    raise exception 'Answers must be a JSON object';
  end if;

  if pg_column_size(submitted_answers) > 262144 then
    raise exception 'Answers payload is too large';
  end if;

  select config
  into quiz_config
  from public.shared_quizzes
  where id = target_quiz_id;

  if quiz_config is null then
    raise exception 'Published quiz not found';
  end if;

  for question_record in
    select value
    from jsonb_array_elements(coalesce(quiz_config -> 'questions', '[]'::jsonb))
  loop
    total_count := total_count + 1;
    question_id := question_record ->> 'id';
    correct_option := question_record ->> 'correctOptionId';
    selected_option := submitted_answers ->> question_id;
    answer_key := answer_key || jsonb_build_object(question_id, correct_option);
    if coalesce(question_record ->> 'explanation', '') <> '' then
      explanations := explanations || jsonb_build_object(
        question_id,
        question_record ->> 'explanation'
      );
    end if;

    if selected_option is null or not exists (
      select 1
      from jsonb_array_elements(coalesce(question_record -> 'options', '[]'::jsonb)) option
      where option ->> 'id' = selected_option
    ) then
      unanswered_count := unanswered_count + 1;
    else
      sanitized_answers :=
        sanitized_answers || jsonb_build_object(question_id, selected_option);
      if selected_option = correct_option then
        correct_count := correct_count + 1;
      else
        incorrect_count := incorrect_count + 1;
      end if;
    end if;
  end loop;

  if total_count < 1 then
    raise exception 'Published quiz has no questions';
  end if;

  percentage_value := round((correct_count::numeric / total_count::numeric) * 100);

  if started_at_value is not null
    and started_at_value <= submitted_time
    and started_at_value >= submitted_time - interval '7 days' then
    safe_started_at := started_at_value;
  end if;

  result_payload := jsonb_build_object(
    'correct', correct_count,
    'incorrect', incorrect_count,
    'unanswered', unanswered_count,
    'percentage', percentage_value,
    'submittedAt', floor(extract(epoch from submitted_time) * 1000)::bigint
  );

  insert into public.shared_quiz_attempts (
    quiz_id,
    answers,
    result,
    started_at,
    submitted_at
  )
  values (
    target_quiz_id,
    sanitized_answers,
    result_payload,
    safe_started_at,
    submitted_time
  );

  return jsonb_build_object(
    'result', result_payload,
    'answerKey', answer_key,
    'explanations', explanations
  );
end;
$$;

revoke execute on function public.get_public_quiz(text) from public;
grant execute on function public.get_public_quiz(text) to anon, authenticated;
revoke execute on function public.submit_quiz_attempt(uuid, jsonb, timestamptz)
from public;
grant execute on function public.submit_quiz_attempt(uuid, jsonb, timestamptz)
to anon, authenticated;
