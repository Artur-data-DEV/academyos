-- Incremental patch: adds question type and backfills existing rows.
-- Run in Supabase SQL Editor for existing projects.

DO $$
BEGIN
  CREATE TYPE public.question_type AS ENUM ('single_choice', 'multi_select');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS question_type public.question_type NOT NULL DEFAULT 'single_choice';

UPDATE public.questions
SET question_type = CASE
  WHEN cardinality(correct_answer) > 1 THEN 'multi_select'::public.question_type
  ELSE 'single_choice'::public.question_type
END
WHERE question_type IS DISTINCT FROM CASE
  WHEN cardinality(correct_answer) > 1 THEN 'multi_select'::public.question_type
  ELSE 'single_choice'::public.question_type
END;
