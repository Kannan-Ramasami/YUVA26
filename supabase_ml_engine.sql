-- Section 10: ML Foundation Phase 3 (EBM Learner Levels)

CREATE TABLE public.learner_level_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL,
  level TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  probabilities JSONB NOT NULL,
  feature_snapshot JSONB NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index for retrieving the most recent learner level prediction for a student+topic
CREATE INDEX idx_learner_level_predictions_student_topic ON public.learner_level_predictions(student_id, topic_id, created_at DESC);

ALTER TABLE public.learner_level_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Student own predictions" ON public.learner_level_predictions
FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
