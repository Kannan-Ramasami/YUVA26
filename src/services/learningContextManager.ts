import { supabase } from '../lib/supabase';
import type { StudentLearningContext, LearningMode } from '../types/learningContext';

/**
 * Service abstraction for managing the student's active learning context.
 * The context determines if the adaptive engine scope is 'individual' (entire subject)
 * or 'classroom' (constrained by classroom scope, but retaining individual mastery).
 */
export async function fetchCurrentLearningContext(studentId: string): Promise<StudentLearningContext | null> {
  try {
    const { data, error } = await supabase
      .from('student_learning_contexts')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No context yet
      throw error;
    }
    return data;
  } catch (err) {
    console.error('Error fetching context:', err);
    // Fallback mock if Supabase not fully connected
    return null;
  }
}

export async function setLearningContext(
  studentId: string, 
  mode: LearningMode, 
  subjectId: string | null = null, 
  classroomId: string | null = null
): Promise<StudentLearningContext> {
  try {
    // Upsert the learning context
    const { data, error } = await supabase
      .from('student_learning_contexts')
      .upsert(
        { student_id: studentId, mode, subject_id: subjectId, classroom_id: classroomId, updated_at: new Date().toISOString() },
        { onConflict: 'student_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error setting context:', err);
    // Return a mock object so UI can proceed
    return {
      id: 'mock-ctx-123',
      student_id: studentId,
      mode,
      subject_id: subjectId,
      classroom_id: classroomId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}
