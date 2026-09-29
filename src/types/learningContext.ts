export type LearningMode = 'individual' | 'classroom';

export interface StudentLearningContext {
  id: string;
  student_id: string;
  mode: LearningMode;
  classroom_id: string | null;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
}
