-- Diagnostic Tables & Learner State

-- Concepts (Lookup table for standard concepts)
CREATE TABLE public.concepts (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

-- Questions Bank
CREATE TABLE public.questions (
  id TEXT PRIMARY KEY,
  concept_id TEXT REFERENCES public.concepts(id),
  type TEXT NOT NULL, -- 'multiple_choice', 'true_false', 'short_answer'
  difficulty TEXT NOT NULL, -- 'easy', 'medium', 'hard'
  text TEXT NOT NULL,
  options JSONB, -- For multiple choice
  correct_answer JSONB NOT NULL
);

-- Diagnostic Sessions
CREATE TABLE public.diagnostic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Diagnostic Attempts (Evidence)
CREATE TABLE public.diagnostic_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.diagnostic_sessions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES public.questions(id),
  concept_id TEXT REFERENCES public.concepts(id),
  correctness BOOLEAN,
  difficulty TEXT NOT NULL,
  response_time_ms INTEGER,
  confidence INTEGER, -- 1 to 5
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Learner Concept State
CREATE TABLE public.learner_concept_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES public.concepts(id),
  mastery_score FLOAT DEFAULT 0.0,
  confidence_score FLOAT DEFAULT 0.0,
  uncertainty FLOAT DEFAULT 1.0,
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'NOT_ASSESSED', -- 'NOT_ASSESSED', 'NEEDS_REMEDIATION', 'DEVELOPING', 'MASTERED', 'REVIEW'
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(student_id, concept_id)
);

-- RLS Setup
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_concept_states ENABLE ROW LEVEL SECURITY;

-- Everyone can read concepts and questions
CREATE POLICY "Public read concepts" ON public.concepts FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);

-- Students manage their own diagnostic sessions
CREATE POLICY "Student own diagnostic sessions" ON public.diagnostic_sessions
FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Students manage their own attempts
CREATE POLICY "Student own diagnostic attempts" ON public.diagnostic_attempts
FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

-- Students manage their own learner state
CREATE POLICY "Student own learner state" ON public.learner_concept_states
FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
