import { supabase } from '../../../lib/supabase';
import type { DiagnosticAttempt } from '../types';
import type { QuestionAttempt, LearnerConceptState } from '../../../types/evidence';
import { calculateConceptMastery } from '../../../services/learnerAnalysisService';

/**
 * Initializes or updates the learner concept state based on evidence from a diagnostic session.
 * 
 * IMPORTANT ARCHITECTURE RULE:
 * This is a simple transparent initialization method for the prototype.
 * Do not claim this is a scientifically validated mastery model yet.
 */
export async function generateInitialLearnerState(studentId: string, attempts: DiagnosticAttempt[]): Promise<LearnerConceptState[]> {
  
  const statesToUpsert: LearnerConceptState[] = [];

  // Group attempts by concept
  const conceptAttempts = attempts.reduce((acc, attempt) => {
    if (!acc[attempt.concept_id]) acc[attempt.concept_id] = [];
    acc[attempt.concept_id].push(attempt);
    return acc;
  }, {} as Record<string, DiagnosticAttempt[]>);

  for (const [conceptId, conceptAtts] of Object.entries(conceptAttempts)) {
    // Convert DiagnosticAttempt to QuestionAttempt for the engine
    const questionAttempts: QuestionAttempt[] = conceptAtts.map(a => ({
      ...a,
      id: a.id || 'temp-id',
      hint_used: false, // Diagnostics don't have hints
      source: 'diagnostic',
      timestamp: a.created_at || new Date().toISOString()
    }));

    const { state } = calculateConceptMastery(conceptId, studentId, questionAttempts);
    statesToUpsert.push(state);
  }

  // Persist to database
  try {
    for (const state of statesToUpsert) {
      await supabase
        .from('learner_concept_states')
        .upsert(state, { onConflict: 'student_id, concept_id' });
    }
  } catch (error) {
    console.error('Error persisting learner states:', error);
  }

  return statesToUpsert;
}
