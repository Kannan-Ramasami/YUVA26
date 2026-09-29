-- Section 10: Concept Graph and Prerequisite Engine

-- Extend existing concepts table
ALTER TABLE public.concepts 
  ADD COLUMN difficulty TEXT DEFAULT 'medium',
  ADD COLUMN estimated_duration INTEGER DEFAULT 30, -- minutes
  ADD COLUMN order_index INTEGER DEFAULT 0,
  ADD COLUMN is_active BOOLEAN DEFAULT true,
  ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Create Prerequisite Model
CREATE TABLE public.concept_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id TEXT REFERENCES public.concepts(id) ON DELETE CASCADE,
  prerequisite_concept_id TEXT REFERENCES public.concepts(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'REQUIRED', -- 'REQUIRED', 'RECOMMENDED'
  minimum_mastery FLOAT DEFAULT 70.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(concept_id, prerequisite_concept_id)
);

-- RLS for Concept Prerequisites
ALTER TABLE public.concept_prerequisites ENABLE ROW LEVEL SECURITY;

-- Everyone can read prerequisites (essential for the engine to work for students)
CREATE POLICY "Public read concept prerequisites" ON public.concept_prerequisites FOR SELECT USING (true);

-- Only authorized staff/admins can modify (we'll just lock it down for now to false since we aren't building the editor)
CREATE POLICY "Staff modify concept prerequisites" ON public.concept_prerequisites FOR ALL USING (false);
