import { supabase } from '../../../lib/supabase';
import type { DiagnosticAttempt } from '../types';

export async function saveAttempt(attempt: Omit<DiagnosticAttempt, 'id' | 'created_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('diagnostic_attempts')
      .insert(attempt);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving attempt:', error);
    // For demo purposes, we log it and move on so the UI doesn't break if Supabase isn't connected.
  }
}

export async function getSessionAttempts(sessionId: string): Promise<DiagnosticAttempt[]> {
  try {
    const { data, error } = await supabase
      .from('diagnostic_attempts')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return [];
  }
}
