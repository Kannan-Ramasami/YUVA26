-- Section 9: Evidence Engine & Learner Model Expansion

-- We need a unified QuestionAttempt table that replaces or extends diagnostic_attempts
-- We'll create `question_attempts` to serve all sources.
CREATE TABLE public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES public.concepts(id),
  question_id TEXT REFERENCES public.questions(id),
  session_id UUID, -- Can link to diagnostic_sessions or other session types
  correctness BOOLEAN NOT NULL,
  difficulty TEXT NOT NULL,
  response_time_ms INTEGER,
  confidence INTEGER,
  hint_used BOOLEAN DEFAULT false,
  attempt_number INTEGER DEFAULT 1,
  learning_context TEXT,
  learning_mode TEXT,
  classroom_id UUID REFERENCES public.classrooms(id),
  source TEXT NOT NULL, -- 'diagnostic', 'practice', 'review', 'challenge', 'remediation'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes for quick aggregation by the analysis engine
CREATE INDEX idx_question_attempts_student_concept ON public.question_attempts(student_id, concept_id);
CREATE INDEX idx_question_attempts_timestamp ON public.question_attempts(timestamp);

-- Update learner_concept_states with new fields
ALTER TABLE public.learner_concept_states 
  ADD COLUMN incorrect_count INTEGER DEFAULT 0,
  ADD COLUMN recent_correctness FLOAT DEFAULT 0.0,
  ADD COLUMN recent_response_time INTEGER DEFAULT 0,
  ADD COLUMN hint_usage_count INTEGER DEFAULT 0,
  ADD COLUMN last_correct_at TIMESTAMP WITH TIME ZONE;

-- Add RLS to question_attempts
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student own question attempts" ON public.question_attempts
FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
