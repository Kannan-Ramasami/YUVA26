-- Student Learning Context
-- This table tracks what the student is currently studying (individual vs classroom)
-- It persists across sessions.

CREATE TYPE public.learning_mode AS ENUM ('individual', 'classroom');

CREATE TABLE public.student_learning_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mode public.learning_mode NOT NULL DEFAULT 'individual',
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
  subject_id TEXT, -- e.g. 'python', 'math'. Could be a reference to a subjects table in a fuller schema
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(student_id) -- A student has one active context at a time
);

ALTER TABLE public.student_learning_contexts ENABLE ROW LEVEL SECURITY;

-- Students can insert/update/view their own context
CREATE POLICY "Students manage own context" ON public.student_learning_contexts
FOR ALL USING ( student_id = auth.uid() ) WITH CHECK ( student_id = auth.uid() );
