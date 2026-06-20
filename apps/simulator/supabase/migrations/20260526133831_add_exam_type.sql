CREATE TYPE public.exam_type AS ENUM ('csa', 'cad', 'cis_df');

ALTER TABLE public.questions 
  ADD COLUMN exam public.exam_type DEFAULT 'csa'::public.exam_type NOT NULL;

ALTER TABLE public.simulations 
  ADD COLUMN exam public.exam_type DEFAULT 'csa'::public.exam_type NOT NULL;
