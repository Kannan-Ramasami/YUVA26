import type { LearnerConceptState, QuestionAttempt, MasteryChangeLog } from '../../../types/evidence';
import type { MasteryStatus } from '../../diagnostic/types';
import { MasteryConfig } from './config';
import { processAttemptBKT } from '../../../services/bktService';

export class MasteryEngine {
  /**
   * Updates a learner's mastery state for a concept given a new attempt.
   */
  updateMastery(currentState: LearnerConceptState, attempt: QuestionAttempt): { newState: LearnerConceptState; changeLog: MasteryChangeLog } {
    const previousMastery = currentState.mastery_score;
    const evidenceWeight = this.calculateEvidenceWeight(attempt, currentState);
    
    // Calculate raw new mastery
    let newMastery = previousMastery;
    if (attempt.correctness) {
      newMastery += evidenceWeight;
    } else {
      newMastery -= evidenceWeight;
    }
    
    // Bound mastery
    newMastery = Math.max(MasteryConfig.MIN_MASTERY, Math.min(MasteryConfig.MAX_MASTERY, newMastery));
    
    // Update BKT probability
    const bktResult = processAttemptBKT(attempt.concept_id, currentState.knowledge_probability, attempt.correctness);
    
    // Update performance arrays
    const recent_performance = [...(currentState.recent_performance || []), attempt.correctness].slice(-MasteryConfig.RECENT_PERFORMANCE_WINDOW);
    
    // Update difficulty exposure
    const difficultyKey = String(attempt.difficulty);
    const difficulty_exposure = { ...(currentState.difficulty_exposure || {}) };
    difficulty_exposure[difficultyKey] = (difficulty_exposure[difficultyKey] || 0) + 1;
    
    // Update counts
    const attempt_count = (currentState.attempt_count || 0) + 1;
    const correct_count = (currentState.correct_count || 0) + (attempt.correctness ? 1 : 0);
    const incorrect_count = (currentState.incorrect_count || 0) + (attempt.correctness ? 0 : 1);
    const hint_usage_count = (currentState.hint_usage_count || 0) + (attempt.hint_used ? 1 : 0);
    
    // Calculate new uncertainty
    const uncertainty = this.calculateUncertainty(currentState, attempt_count, recent_performance);
    
    // Calculate new status
    const status = this.calculateStatus(newMastery, attempt_count);
    
    // Create new state
    const newState: LearnerConceptState = {
      ...currentState,
      mastery_score: newMastery,
      knowledge_probability: bktResult.knowledge_probability,
      uncertainty,
      status,
      attempt_count,
      correct_count,
      incorrect_count,
      recent_performance,
      difficulty_exposure,
      hint_usage_count,
      last_attempt_at: attempt.timestamp,
      updated_at: new Date().toISOString(),
    };
    if (attempt.correctness) {
      newState.last_correct_at = attempt.timestamp;
    }
    
    // Detect change and create log
    const changeLog = this.detectMasteryChange(currentState, newState, attempt);
    
    return { newState, changeLog };
  }

  /**
   * Calculates the weight of the evidence from the attempt.
   */
  calculateEvidenceWeight(attempt: QuestionAttempt, currentState: LearnerConceptState): number {
    let weight = MasteryConfig.BASE_EVIDENCE_WEIGHT;
    
    // 1. Difficulty weight
    const difficultyWeight = MasteryConfig.DIFFICULTY_WEIGHTS[attempt.difficulty] || 1.0;
    
    // Invert difficulty effect for incorrect answers (failing an easy question reduces mastery more than failing a hard one)
    if (attempt.correctness) {
      weight *= difficultyWeight;
    } else {
      weight *= (1 / difficultyWeight);
    }
    
    // 2. Hint penalty
    if (attempt.correctness && attempt.hint_used) {
      weight *= MasteryConfig.HINT_PENALTY;
    }
    
    // 3. Confidence multiplier
    if (attempt.confidence > 0.8) {
      weight *= attempt.correctness ? MasteryConfig.CONFIDENCE_MULTIPLIER_CORRECT.HIGH : MasteryConfig.CONFIDENCE_MULTIPLIER_INCORRECT.HIGH;
    } else if (attempt.confidence < 0.4) {
      weight *= attempt.correctness ? MasteryConfig.CONFIDENCE_MULTIPLIER_CORRECT.LOW : MasteryConfig.CONFIDENCE_MULTIPLIER_INCORRECT.LOW;
    } else {
      weight *= attempt.correctness ? MasteryConfig.CONFIDENCE_MULTIPLIER_CORRECT.MEDIUM : MasteryConfig.CONFIDENCE_MULTIPLIER_INCORRECT.MEDIUM;
    }
    
    // 4. Rapid retry penalty (Anti-gaming)
    if (currentState.last_attempt_at) {
      const lastAttemptTime = new Date(currentState.last_attempt_at).getTime();
      const currentAttemptTime = new Date(attempt.timestamp).getTime();
      const timeDiffSec = (currentAttemptTime - lastAttemptTime) / 1000;
      
      // If same concept retried within 2 seconds
      if (timeDiffSec < 2) {
        weight *= MasteryConfig.RAPID_RETRY_PENALTY;
      }
    }
    
    // 5. Repeated success decay (Anti-gaming - repeated identical attempts do not inflate mastery indefinitely)
    // For simplicity here, we slightly decay weight if they have many correct attempts
    if (attempt.correctness && currentState.correct_count > 5) {
       weight *= 0.8; // Reduce evidence strength after many successes
    }
    
    return weight;
  }

  /**
   * Calculates the uncertainty of the mastery estimate.
   */
  calculateUncertainty(_currentState: LearnerConceptState, attemptCount: number, recentPerformance: boolean[]): number {
    let uncertainty = MasteryConfig.MAX_UNCERTAINTY;
    
    // 1. Base reduction based on attempt count
    if (attemptCount > 0) {
      uncertainty -= Math.min(attemptCount * 0.05, 0.5); // Up to 50% reduction from sheer volume
    }
    
    // 2. Consistency reduction
    if (recentPerformance.length >= 3) {
      const allCorrect = recentPerformance.every(p => p);
      const allIncorrect = recentPerformance.every(p => !p);
      if (allCorrect || allIncorrect) {
        uncertainty -= 0.2; // 20% reduction for consistent performance
      }
    }
    
    return Math.max(MasteryConfig.MIN_UNCERTAINTY, Math.min(MasteryConfig.MAX_UNCERTAINTY, uncertainty));
  }

  /**
   * Calculates the mastery status based on the score.
   */
  calculateStatus(masteryScore: number, attemptCount: number): MasteryStatus {
    if (attemptCount === 0) {
      return 'NOT_ASSESSED' as MasteryStatus;
    }
    
    if (masteryScore <= MasteryConfig.THRESHOLDS.NEEDS_REMEDIATION) {
      return 'NEEDS_REMEDIATION' as MasteryStatus;
    } else if (masteryScore <= MasteryConfig.THRESHOLDS.DEVELOPING) {
      return 'DEVELOPING' as MasteryStatus;
    } else if (masteryScore <= MasteryConfig.THRESHOLDS.MASTERED) {
      return 'MASTERED' as MasteryStatus;
    } else {
      return 'REVIEW' as MasteryStatus; // Or MASTERED with spaced repetition flag
    }
  }

  /**
   * Creates a log of the mastery change for persistence and explainability.
   */
  detectMasteryChange(previousState: LearnerConceptState, newState: LearnerConceptState, attempt: QuestionAttempt): MasteryChangeLog {
    const change = newState.mastery_score - previousState.mastery_score;
    let reason = `${attempt.correctness ? 'Correct' : 'Incorrect'} attempt on difficulty ${attempt.difficulty} question.`;
    
    if (attempt.hint_used) {
      reason += ' Hint was used.';
    }
    
    if (attempt.confidence > 0.8) {
      reason += attempt.correctness ? ' High confidence increased gain.' : ' High confidence in incorrect answer increased penalty.';
    }
    
    return {
      id: crypto.randomUUID(),
      student_id: attempt.student_id,
      concept_id: attempt.concept_id,
      previous_mastery: previousState.mastery_score,
      new_mastery: newState.mastery_score,
      previous_probability: previousState.knowledge_probability,
      new_probability: newState.knowledge_probability,
      change_amount: change,
      reason,
      attempt_id: attempt.id,
      timestamp: new Date().toISOString(),
    };
  }
}
