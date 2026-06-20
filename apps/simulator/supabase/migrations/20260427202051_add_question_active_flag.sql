ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.questions
SET is_active = false
WHERE id IN (
  288,
  293,
  313,
  334,
  357,
  364,
  383,
  397
);
