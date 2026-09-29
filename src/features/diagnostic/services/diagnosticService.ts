import { supabase } from '../../../lib/supabase';
import type { DiagnosticSession } from '../types';

export async function startDiagnosticSession(studentId: string, topicId: string): Promise<DiagnosticSession> {
  try {
    const { data, error } = await supabase
      .from('diagnostic_sessions')
      .insert({ student_id: studentId, subject_id: topicId, topic_id: topicId, status: 'in_progress' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error starting diagnostic session:', error);
    // Fallback for UI demo
    return {
      id: 'mock-session-' + Date.now(),
      student_id: studentId,
      subject_id: topicId,
      topic_id: topicId,
      status: 'in_progress',
      started_at: new Date().toISOString()
    };
  }
}

export async function completeDiagnosticSession(sessionId: string): Promise<void> {
  try {
    await supabase
      .from('diagnostic_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId);
  } catch (error) {
    console.error('Error completing diagnostic session:', error);
  }
}
