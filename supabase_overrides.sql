-- Teacher Overrides
CREATE TABLE public.teacher_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  original_action TEXT NOT NULL,
  original_concept TEXT NOT NULL,
  override_action TEXT NOT NULL,
  override_concept TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active'
);

ALTER TABLE public.teacher_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view overrides for their classrooms" ON public.teacher_overrides FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.classrooms WHERE id = teacher_overrides.classroom_id AND created_by = auth.uid())
);

CREATE POLICY "Staff can create overrides for their classrooms" ON public.teacher_overrides FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_id AND created_by = auth.uid())
);

CREATE POLICY "Students can view their active overrides" ON public.teacher_overrides FOR SELECT
USING (
  student_id = auth.uid() AND status = 'active'
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id UUID,
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view audit logs for their classrooms" ON public.audit_logs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.classrooms WHERE id = audit_logs.classroom_id AND created_by = auth.uid())
);

CREATE POLICY "Staff can insert audit logs for their classrooms" ON public.audit_logs FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_id AND created_by = auth.uid())
);
