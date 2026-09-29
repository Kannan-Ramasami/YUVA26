import type { LearnerConceptState } from '../../../types/evidence';
import type { ConceptGraphInterface } from '../decisionEngine/types';

export interface ReviewConfig {
  scheduleDays: number[]; // e.g., [1, 3, 7, 14, 30]
  baseThreshold: number;
}

export interface ReviewCandidate {
  conceptId: string;
  reason: 'SPACED_REVIEW' | 'PERFORMANCE_DECLINE' | 'UNCERTAINTY' | 'PREREQUISITE_REMEDIATION';
  priorityScore: number; // 0 to 100, higher is more urgent
  daysSinceLastReview: number;
  daysOverdue: number;
}

export class ReviewService {
  private config: ReviewConfig = {
    scheduleDays: [1, 3, 7, 14, 30],
    baseThreshold: 0
  };

  /**
   * Set custom schedule if needed.
   */
  public setConfig(config: Partial<ReviewConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Evaluates a single concept to determine if a review is due right now.
   */
  public isReviewDue(state: LearnerConceptState, targetConceptId?: string, graph?: ConceptGraphInterface): boolean {
    const candidate = this.evaluateConcept(state, targetConceptId, graph);
    return candidate !== null && candidate.priorityScore > 50;
  }

  /**
   * Evaluates all states and returns a sorted list of review candidates.
   */
  public getReviewCandidates(
    states: LearnerConceptState[],
    targetConceptId?: string,
    graph?: ConceptGraphInterface
  ): ReviewCandidate[] {
    const candidates: ReviewCandidate[] = [];
    
    for (const state of states) {
      const candidate = this.evaluateConcept(state, targetConceptId, graph);
      if (candidate) {
        candidates.push(candidate);
      }
    }
    
    // Sort by highest priority first
    return candidates.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  /**
   * Central evaluation logic for a single concept.
   */
  private evaluateConcept(
    state: LearnerConceptState,
    targetConceptId?: string,
    graph?: ConceptGraphInterface
  ): ReviewCandidate | null {
    // We only review concepts that have been attempted
    if (!state.last_attempt_at && !state.last_reviewed_at) return null;

    const lastInteraction = new Date(state.last_reviewed_at || state.last_attempt_at || new Date().toISOString()).getTime();
    const now = Date.now();
    const daysSince = (now - lastInteraction) / (1000 * 60 * 60 * 24);

    // 1. Spaced Review Check
    // We estimate how many times they've reviewed based on success. 
    // In a real system, you'd track `successful_review_count`. We'll proxy it by correct_count.
    const tier = Math.min(Math.floor((state.correct_count || 1) / 3), this.config.scheduleDays.length - 1);
    const targetGap = this.config.scheduleDays[tier];
    
    const daysOverdue = daysSince - targetGap;
    
    // 2. Prerequisite Remediation Check
    let isImportantPrereq = false;
    if (graph && targetConceptId) {
      // If this concept is a prereq of the target concept the user is actively working on
      const prereqs = graph.getPrerequisites(targetConceptId);
      isImportantPrereq = prereqs.some((p: any) => p.prerequisite_concept_id === state.concept_id);
    }
    
    if (isImportantPrereq && state.mastery_score < 70) {
      return {
        conceptId: state.concept_id,
        reason: 'PREREQUISITE_REMEDIATION',
        priorityScore: this.calculateReviewPriority(state, daysSince, daysOverdue, true),
        daysSinceLastReview: daysSince,
        daysOverdue: daysSince // Not gap-based, immediately due
      };
    }

    // 3. Performance Decline / Uncertainty Check
    const recentCorrect = state.recent_performance ? state.recent_performance.filter(x => x).length / state.recent_performance.length : 1;
    if (recentCorrect < 0.5 && state.mastery_score >= 60) {
      return {
        conceptId: state.concept_id,
        reason: 'PERFORMANCE_DECLINE',
        priorityScore: this.calculateReviewPriority(state, daysSince, daysOverdue, false),
        daysSinceLastReview: daysSince,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0
      };
    }
    
    if (state.uncertainty > 0.6) {
      return {
        conceptId: state.concept_id,
        reason: 'UNCERTAINTY',
        priorityScore: this.calculateReviewPriority(state, daysSince, daysOverdue, false),
        daysSinceLastReview: daysSince,
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0
      };
    }

    // 4. Standard Spaced Review
    if (daysOverdue > 0) {
      return {
        conceptId: state.concept_id,
        reason: 'SPACED_REVIEW',
        priorityScore: this.calculateReviewPriority(state, daysSince, daysOverdue, false),
        daysSinceLastReview: daysSince,
        daysOverdue
      };
    }

    return null;
  }

  /**
   * Calculates urgency (0-100) based on multiple factors.
   */
  public calculateReviewPriority(
    state: LearnerConceptState,
    _daysSinceLastReview: number,
    daysOverdue: number,
    isTargetPrereq: boolean
  ): number {
    let score = 0;

    // Base score from how overdue it is
    if (daysOverdue > 0) {
      score += Math.min(daysOverdue * 10, 40); // Max 40 points for being overdue
    }

    // Borderline mastery (around 70) needs more reinforcement than absolute mastery (95)
    if (state.mastery_score > 60 && state.mastery_score < 80) {
      score += 20;
    }

    // High uncertainty adds urgency
    score += (state.uncertainty || 0) * 20;
    
    // Performance decline adds urgency
    const recentCorrect = state.recent_performance && state.recent_performance.length > 0
      ? state.recent_performance.filter(x => x).length / state.recent_performance.length
      : 1;
    if (recentCorrect < 0.6) {
      score += 20;
    }

    // Active prerequisite adds massive urgency
    if (isTargetPrereq) {
      score += 60;
    }

    return Math.min(score, 100);
  }
}
