import { supabase } from '../../../lib/supabase';
import type { DiagnosticAttempt } from '../types';
import type { QuestionAttempt, LearnerConceptState } from '../../../types/evidence';
import { calculateConceptMastery } from '../../../services/learnerAnalysisService';
import { buildStudentFeatures } from '../../../services/mlFeatureService';
import { predictLearnerLevel, type MLPredictionResponse } from '../../../services/mlPredictionService';

export interface GeneratedStateResult {
  states: LearnerConceptState[];
  prediction: MLPredictionResponse | null;
}

/**
 * Initializes or updates the learner concept state based on evidence from a diagnostic session.
 * PHASE 3: Now calls the EBM ML Service to predict overall Learner Level.
 */
export async function generateInitialLearnerState(
  studentId: string, 
  attempts: DiagnosticAttempt[],
  topicId?: string
): Promise<GeneratedStateResult> {
  
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
      hint_used: false,
      source: 'diagnostic',
      timestamp: a.created_at || new Date().toISOString()
    }));

    const { state } = calculateConceptMastery(conceptId, studentId, questionAttempts);
    statesToUpsert.push(state);
  }

  let predictionResult: MLPredictionResponse | null = null;

  try {
    // 1. Persist Learner Concept States (BKT outputs)
    for (const state of statesToUpsert) {
      await supabase
        .from('learner_concept_states')
        .upsert(state, { onConflict: 'student_id, concept_id' });
    }

    // 2. ML Foundation Phase 3: Generate Features & Predict Level
    const features = await buildStudentFeatures(studentId, topicId);
    predictionResult = await predictLearnerLevel(features);
    
    // 3. Persist the Learner Level Prediction (History matters!)
    if (predictionResult) {
      const { error: pErr } = await supabase.from('learner_level_predictions').insert({
        student_id: studentId,
        topic_id: topicId || 'global',
        level: predictionResult.level,
        confidence: predictionResult.confidence,
        probabilities: predictionResult.probabilities,
        feature_snapshot: features,
        model_version: predictionResult.model_version
      });
      if (pErr) console.error('[ML Foundation] Failed to persist prediction to DB:', pErr);
    }
    
  } catch (error) {
    console.error('Error in learner state generation pipeline:', error);
  }

  return { states: statesToUpsert, prediction: predictionResult };
}
