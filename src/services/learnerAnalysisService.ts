import type { QuestionAttempt, LearnerConceptState, AnalysisResult } from '../types/evidence';
import type { MasteryStatus } from '../features/diagnostic/types';
import { recalculateConceptKnowledge, DEFAULT_BKT_CONFIG } from './bktService';

export interface AnalysisConfig {
  penalties: {
    hintUsed: number;
    rapidRetry: number;
  };
  thresholds: {
    mastered: number;
    developing: number;
    rapidRetryMs: number;
  };
}

const DEFAULT_CONFIG: AnalysisConfig = {
  penalties: {
    hintUsed: 4,
    rapidRetry: 8
  },
  thresholds: {
    mastered: 85,
    developing: 50,
    rapidRetryMs: 3000
  }
};

/**
 * PHASE 2: Calculates BKT mastery for a specific concept based on a sequence of evidence.
 * Integrates Bayesian Knowledge Tracing into the learner state profile.
 */
export function calculateConceptMastery(
  conceptId: string,
  studentId: string,
  attempts: QuestionAttempt[],
  config: AnalysisConfig = DEFAULT_CONFIG
): { state: LearnerConceptState, analysis: AnalysisResult } {
  
  // Sort attempts chronologically to guarantee correct BKT sequence
  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  // 1. Core ML Foundation Phase 2: Bayesian Knowledge Tracing Calculation
  // We extract correctness sequentially and feed it to the standard BKT model.
  const bktAttempts = sortedAttempts.map(a => ({ correctness: a.correctness }));
  const knowledgeProbability = recalculateConceptKnowledge(bktAttempts, DEFAULT_BKT_CONFIG);
  
  // Map standard BKT probability (0.0 to 1.0) directly to the UI mastery score (0 to 100)
  let masteryScore = Math.round(knowledgeProbability * 100);
  
  // Supporting calculations for risk/UI
  let correctCount = 0;
  let hintUsageCount = 0;
  let rapidRetries = 0;
  
  sortedAttempts.forEach((attempt, index) => {
    if (attempt.correctness) correctCount++;
    if (attempt.hint_used) hintUsageCount++;

    // Rapid Retry Detection (Anti-Gaming)
    if (index > 0) {
      const prev = sortedAttempts[index - 1];
      if (prev.question_id === attempt.question_id) {
        const timeDiff = new Date(attempt.timestamp).getTime() - new Date(prev.timestamp).getTime();
        if (timeDiff < config.thresholds.rapidRetryMs) {
          rapidRetries++;
        }
      }
    }
  });

  const attemptCount = sortedAttempts.length;
  
  // Uncertainty drops as evidence volume increases
  let baseUncertainty = Math.max(0, 1.0 - (attemptCount * 0.1));
  
  // Recent performance (last 3 attempts)
  const recentAttempts = sortedAttempts.slice(-3);
  const recentCorrectCount = recentAttempts.filter(a => a.correctness).length;
  const recentCorrectness = recentAttempts.length > 0 ? recentCorrectCount / recentAttempts.length : 0;
  
  // Status evaluation based on the pure BKT mapped score
  let status: MasteryStatus = 'NOT_ASSESSED';
  if (attemptCount === 0) status = 'NOT_ASSESSED';
  else if (masteryScore >= config.thresholds.mastered) status = 'MASTERED';
  else if (masteryScore >= config.thresholds.developing) status = 'DEVELOPING';
  else status = 'NEEDS_REMEDIATION';

  // Risk Signals
  const riskSignals: string[] = [];
  let recentPerformance: AnalysisResult['recentPerformance'] = 'none';
  
  if (recentAttempts.length > 0) {
    if (recentCorrectness === 1) recentPerformance = 'strong';
    else if (recentCorrectness === 0) recentPerformance = 'weak';
    else recentPerformance = 'inconsistent';
  }

  if (hintUsageCount > (attemptCount * 0.4) && attemptCount > 3) riskSignals.push('High hint dependency');
  if (rapidRetries > 2) riskSignals.push('Rapid guessing pattern detected');
  if (recentPerformance === 'weak') riskSignals.push('Recent performance decline');

  // Decay if they have a very high BKT score but suddenly bombed everything recent
  if (status === 'MASTERED' && recentPerformance === 'weak') {
    status = 'REVIEW';
  }

  const lastAttempt = sortedAttempts[sortedAttempts.length - 1];
  const lastCorrect = sortedAttempts.filter(a => a.correctness).pop();

  const state: LearnerConceptState = {
    student_id: studentId,
    concept_id: conceptId,
    knowledge_probability: knowledgeProbability, // Raw BKT P(Know)
    mastery_score: masteryScore, // Mapped for UI (0-100)
    confidence_score: 0,
    uncertainty: Number(baseUncertainty.toFixed(2)),
    attempt_count: attemptCount,
    correct_count: correctCount,
    incorrect_count: attemptCount - correctCount,
    recent_correctness: recentCorrectness,
    recent_response_time: recentAttempts.reduce((acc, a) => acc + a.response_time_ms, 0) / (recentAttempts.length || 1),
    recent_performance: recentAttempts.map(a => a.correctness),
    difficulty_exposure: {},
    hint_usage_count: hintUsageCount,
    status,
    last_attempt_at: lastAttempt?.timestamp,
    last_correct_at: lastCorrect?.timestamp,
    updated_at: new Date().toISOString()
  };

  const analysis: AnalysisResult = {
    conceptId,
    masteryScore,
    uncertainty: Number(baseUncertainty.toFixed(2)),
    status,
    evidenceSummary: {
      totalAttempts: attemptCount,
      correctCount,
      hintAssisted: hintUsageCount,
      rapidRetries
    },
    recentPerformance,
    riskSignals,
    recommendedAttention: riskSignals.length > 0 || status === 'NEEDS_REMEDIATION' || status === 'REVIEW'
  };

  return { state, analysis };
}
