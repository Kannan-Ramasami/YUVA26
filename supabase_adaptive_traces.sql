-- Phase 4: Adaptive Decision Traces (Developer/Judge View)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: adaptive_decision_traces
-- This table stores a complete, immutable snapshot of the unified learner state, 
-- EBM learner level prediction, BKT concept states, and the final adaptive decision made by the engine.
CREATE TABLE adaptive_decision_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES auth.users(id),
  topic_id TEXT NOT NULL,
  
  -- Engine Outputs
  decision_action TEXT NOT NULL,          -- e.g. 'ADVANCE', 'PRACTICE', 'REMEDIATE_PREREQUISITE'
  target_concept_id TEXT NOT NULL,
  decision_reason TEXT NOT NULL,
  
  -- ML Foundation Layer 3 (EBM Learner Level)
  learner_level TEXT NOT NULL,            -- e.g. 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'
  learner_level_confidence NUMERIC NOT NULL,
  model_version TEXT NOT NULL,
  
  -- ML Foundation Layer 2 (BKT / Unified States Snapshot)
  concept_knowledge_probability NUMERIC NOT NULL,
  recent_accuracy NUMERIC,
  learning_velocity NUMERIC,
  
  -- Prerequisite Snapshot (JSON to capture full prereq state at decision time)
  prerequisite_states JSONB NOT NULL DEFAULT '{}',
  
  -- Decision Priority and Policy
  priority INTEGER NOT NULL DEFAULT 0,
  policy_version TEXT NOT NULL DEFAULT 'v1.0',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast queries by student and topic
CREATE INDEX idx_adaptive_traces_student ON adaptive_decision_traces(student_id);
CREATE INDEX idx_adaptive_traces_student_topic ON adaptive_decision_traces(student_id, topic_id);

-- RLS Policies
ALTER TABLE adaptive_decision_traces ENABLE ROW LEVEL SECURITY;

-- Students can view their own traces (useful for transparency/explainability)
CREATE POLICY "Students can view own decision traces"
  ON adaptive_decision_traces FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers/Admins can view all traces (Developer/Judge View)
CREATE POLICY "Staff can view all decision traces"
  ON adaptive_decision_traces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- System can insert traces (usually bypasses RLS via service key, but allowing for authenticated inserts for now)
CREATE POLICY "System can insert decision traces"
  ON adaptive_decision_traces FOR INSERT
  WITH CHECK (auth.uid() = student_id);
