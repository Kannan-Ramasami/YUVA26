-- Classrooms Table
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  status TEXT DEFAULT 'active'
);

-- Classroom Members Table
CREATE TABLE public.classroom_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  status TEXT DEFAULT 'active',
  UNIQUE(classroom_id, student_id)
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- RLS POLICIES: CLASSROOMS
-- --------------------------------------------------------

-- Staff can create classrooms
CREATE POLICY "Staff can insert classrooms" ON public.classrooms FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'staff')
  AND created_by = auth.uid()
);

-- Staff can view/update their own classrooms
CREATE POLICY "Staff can view own classrooms" ON public.classrooms FOR SELECT
USING ( created_by = auth.uid() );

CREATE POLICY "Staff can update own classrooms" ON public.classrooms FOR UPDATE
USING ( created_by = auth.uid() );

-- Students can view classrooms they are members of
CREATE POLICY "Students can view enrolled classrooms" ON public.classrooms FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_id = classrooms.id AND student_id = auth.uid())
);

-- --------------------------------------------------------
-- RLS POLICIES: CLASSROOM MEMBERS
-- --------------------------------------------------------

-- Students can insert themselves (join)
CREATE POLICY "Students can join classrooms" ON public.classroom_members FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  AND student_id = auth.uid()
);

-- Students can view their own memberships
CREATE POLICY "Students view own memberships" ON public.classroom_members FOR SELECT
USING ( student_id = auth.uid() );

-- Staff can view members of their own classrooms
CREATE POLICY "Staff view members of their classrooms" ON public.classroom_members FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_members.classroom_id AND created_by = auth.uid())
);

-- --------------------------------------------------------
-- HELPER FUNCTION FOR JOINING
-- --------------------------------------------------------
-- Allows a student to look up a classroom by code securely before joining,
-- bypassing the RLS that prevents them from seeing classrooms they aren't in yet.
CREATE OR REPLACE FUNCTION public.get_classroom_by_code(p_code TEXT)
RETURNS TABLE (id UUID, name TEXT, subject TEXT, created_by UUID) AS $$
BEGIN
  RETURN QUERY 
  SELECT c.id, c.name, c.subject, c.created_by 
  FROM public.classrooms c 
  WHERE c.code = p_code AND c.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
