import type { LearnerConceptState } from '../../../types/evidence';

export type StuckReason = 
  | 'REPEATED_FAILURE' 
  | 'STALLED_MASTERY' 
  | 'HIGH_UNCERTAINTY'
  | 'LONG_INACTIVITY';

export interface StuckLearnerFlag {
  studentId: string;
  conceptId: string;
  reason: StuckReason;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export class StuckLearnerService {
  /**
   * Analyzes an array of learner states and returns all identified issues
   * for students who might need intervention.
   */
  public analyzeStates(states: LearnerConceptState[]): StuckLearnerFlag[] {
    const flags: StuckLearnerFlag[] = [];

    for (const state of states) {
      if (state.status === 'MASTERED') continue; // Don't flag mastered concepts unless maybe inactivity, but usually we just review.

      // 1. Repeated Failure (High Severity)
      if (state.attempt_count > 8 && state.recent_correctness < 0.3) {
        flags.push({
          studentId: state.student_id,
          conceptId: state.concept_id,
          reason: 'REPEATED_FAILURE',
          severity: 'high',
          message: `Struggling with ${state.concept_id}: ${Math.round(state.recent_correctness * 100)}% accuracy over ${state.attempt_count} attempts.`
        });
      }
      
      // 2. High Uncertainty (Medium Severity)
      else if (state.uncertainty > 0.8 && state.attempt_count >= 3) {
        flags.push({
          studentId: state.student_id,
          conceptId: state.concept_id,
          reason: 'HIGH_UNCERTAINTY',
          severity: 'medium',
          message: `Highly uncertain performance on ${state.concept_id}. Erratic answer patterns.`
        });
      }

      // 3. Stalled Mastery (Medium Severity)
      else if (state.attempt_count > 15 && state.mastery_score < 75 && state.recent_correctness < 0.5) {
         flags.push({
          studentId: state.student_id,
          conceptId: state.concept_id,
          reason: 'STALLED_MASTERY',
          severity: 'medium',
          message: `Mastery plateau on ${state.concept_id}. Needs a different approach.`
        });
      }

      // 4. Long Inactivity (Low Severity)
      else if (state.last_attempt_at) {
        const daysSince = (Date.now() - new Date(state.last_attempt_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince > 14 && state.status !== 'NOT_ASSESSED') {
          flags.push({
            studentId: state.student_id,
            conceptId: state.concept_id,
            reason: 'LONG_INACTIVITY',
            severity: 'low',
            message: `Has not practiced ${state.concept_id} in ${Math.round(daysSince)} days.`
          });
        }
      }
    }

    return flags;
  }
}
