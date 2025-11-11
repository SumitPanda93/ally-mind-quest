-- Add DELETE policy for questions table to prevent unauthorized deletion
CREATE POLICY "Users can delete questions for their own exams"
ON public.questions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.exams
    WHERE exams.id = questions.exam_id
      AND exams.user_id = auth.uid()
  )
);