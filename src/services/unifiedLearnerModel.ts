import { supabase } from '../lib/supabase';
import type { LearnerConceptState } from '../types/evidence';
export interface UnifiedLearnerState {
  student_id: string;
  topic_id: string;
  overall_level: string;
  overall_level_confidence: number;
  overall_level_model_version: string;
  concept_states: Record<string, LearnerConceptState>;
  recent_accuracy: number;
  recent_activity_at: string | null;
  learning_velocity: number | null;
}

/**
 * PHASE 4: Unified Learner Model
 * Brings together BKT concept states and EBM overall levels.
 */
export async function getLearnerState(studentId: string, topicId: string): Promise<UnifiedLearnerState> {
  // 1. Fetch BKT Concept States
  const { data: concepts } = await supabase
    .from('learner_concept_states')
    .select('*')
    .eq('student_id', studentId);
    
  const conceptStates: Record<string, LearnerConceptState> = {};
  let recentAccuracySum = 0;
  let conceptsWithRecent = 0;
  let lastActivity = 0;

  if (concepts) {
    for (const c of concepts as LearnerConceptState[]) {
      conceptStates[c.concept_id] = c;
      if (c.recent_correctness !== undefined) {
        recentAccuracySum += c.recent_correctness;
        conceptsWithRecent++;
      }
      if (c.last_attempt_at) {
        const time = new Date(c.last_attempt_at).getTime();
        if (time > lastActivity) lastActivity = time;
      }
    }
  }

  // 2. Fetch latest Learner Level Predictions (EBM)
  const { data: predictions } = await supabase
    .from('learner_level_predictions')
    .select('*')
    .eq('student_id', studentId)
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false })
    .limit(2);

  let level = 'BEGINNER';
  let confidence = 0.5;
  let model_version = 'unknown';
  let learning_velocity: number | null = null;

  if (predictions && predictions.length > 0) {
    const latest = predictions[0];
    level = latest.level;
    confidence = latest.confidence;
    model_version = latest.model_version;

    // Calculate learning velocity if we have at least 2 predictions
    if (predictions.length > 1) {
      const prev = predictions[1];
      const latestBkt = latest.feature_snapshot?.average_bkt_knowledge || 0;
      const prevBkt = prev.feature_snapshot?.average_bkt_knowledge || 0;
      learning_velocity = latestBkt - prevBkt;
    }
  }

  return {
    student_id: studentId,
    topic_id: topicId,
    overall_level: level,
    overall_level_confidence: confidence,
    overall_level_model_version: model_version,
    concept_states: conceptStates,
    recent_accuracy: conceptsWithRecent > 0 ? recentAccuracySum / conceptsWithRecent : 0,
    recent_activity_at: lastActivity > 0 ? new Date(lastActivity).toISOString() : null,
    learning_velocity
  };
}
