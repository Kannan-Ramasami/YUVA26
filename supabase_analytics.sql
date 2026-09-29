-- Analytics & Tracking Tables

CREATE TABLE IF NOT EXISTS public.mastery_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  previous_mastery NUMERIC NOT NULL,
  new_mastery NUMERIC NOT NULL,
  change_amount NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  attempt_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.mastery_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own mastery logs" ON public.mastery_change_logs FOR SELECT
USING ( student_id = auth.uid() );

CREATE POLICY "Staff can view mastery logs for their students" ON public.mastery_change_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classroom_students cs
    JOIN public.classrooms c ON c.id = cs.classroom_id
    WHERE cs.student_id = mastery_change_logs.student_id
    AND c.created_by = auth.uid()
  )
);
