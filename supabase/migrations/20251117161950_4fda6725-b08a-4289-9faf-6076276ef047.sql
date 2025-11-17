-- Create a secure view that excludes correct answers and explanations
-- This prevents exam answers from being exposed to the client during the exam
CREATE OR REPLACE VIEW public.questions_without_answers AS
SELECT 
  id,
  exam_id,
  question_number,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  topic,
  created_at
FROM public.questions;

-- Grant access to authenticated users
GRANT SELECT ON public.questions_without_answers TO authenticated;

-- Add RLS policy for the view
ALTER VIEW public.questions_without_answers SET (security_invoker = on);