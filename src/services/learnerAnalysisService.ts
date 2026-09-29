import type { QuestionAttempt, LearnerConceptState, AnalysisResult } from '../types/evidence';
import type { MasteryStatus } from '../features/diagnostic/types';

export interface AnalysisConfig {
  weights: {
    correct: number;
    incorrect: number;
    hardBonus: number;
    easyPenalty: number;
    confidenceMultiplier: number; // Applied if confident and correct
  };
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
  weights: {
    correct: 10,
    incorrect: -5,
    hardBonus: 3,
    easyPenalty: -2,
    confidenceMultiplier: 1.2
  },
  penalties: {
    hintUsed: 4,
    rapidRetry: 8
  },
  thresholds: {
    mastered: 85,
    developing: 50,
    rapidRetryMs: 3000 // 3 seconds is suspiciously fast for a real question
  }
};

/**
 * Calculates mastery and uncertainty for a specific concept based on a stream of evidence.
 * This is a deterministic, explainable baseline mastery model.
 */
export function calculateConceptMastery(
  conceptId: string,
  studentId: string,
  attempts: QuestionAttempt[],
  config: AnalysisConfig = DEFAULT_CONFIG
): { state: LearnerConceptState, analysis: AnalysisResult } {
  
  // Sort attempts chronologically
  const sortedAttempts = [...attempts].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  let rawScore = 0;
  let correctCount = 0;
  let hintUsageCount = 0;
  let rapidRetries = 0;
  
  // Base calculations
  sortedAttempts.forEach((attempt, index) => {
    let attemptScore = 0;
    
    // 1. Correctness & Difficulty
    if (attempt.correctness) {
      correctCount++;
      attemptScore += config.weights.correct;
      if (attempt.difficulty === 'hard') attemptScore += config.weights.hardBonus;
      if (attempt.difficulty === 'easy') attemptScore += config.weights.easyPenalty;
      
      // 2. Confidence Signal (if correct and confident)
      if (attempt.confidence >= 4) {
        attemptScore *= config.weights.confidenceMultiplier;
      }
    } else {
      attemptScore += config.weights.incorrect;
      // If they were very confident but wrong, that's a strong misconception
      if (attempt.confidence >= 4) {
        attemptScore -= 2; 
      }
    }

    // 3. Hint Penalty
    if (attempt.hint_used) {
      hintUsageCount++;
      attemptScore -= config.penalties.hintUsed;
    }

    // 4. Rapid Retry Detection (Anti-Gaming)
    // If this attempt was very soon after the *previous* attempt on the *same question*
    if (index > 0) {
      const prev = sortedAttempts[index - 1];
      if (prev.question_id === attempt.question_id) {
        const timeDiff = new Date(attempt.timestamp).getTime() - new Date(prev.timestamp).getTime();
        if (timeDiff < config.thresholds.rapidRetryMs) {
          rapidRetries++;
          // Penalize the score if they just guessed immediately
          attemptScore -= config.penalties.rapidRetry;
        }
      }
    }

    rawScore += attemptScore;
  });

  // Normalize mastery 0-100.
  // We assume roughly 5 perfect "medium" questions (10 pts each) to reach 50, 10 to reach 100.
  // This is an arbitrary scaling factor for the prototype.
  const maxExpectedScore = 100;
  let masteryScore = Math.max(0, Math.min(100, (rawScore / maxExpectedScore) * 100));

  // Uncertainty Calculation
  // Uncertainty drops as evidence volume increases, but increases if recent answers are inconsistent
  const attemptCount = sortedAttempts.length;
  let baseUncertainty = Math.max(0, 1.0 - (attemptCount * 0.1));
  
  // Recent performance (last 3 attempts)
  const recentAttempts = sortedAttempts.slice(-3);
  const recentCorrectCount = recentAttempts.filter(a => a.correctness).length;
  const recentCorrectness = recentAttempts.length > 0 ? recentCorrectCount / recentAttempts.length : 0;
  
  // If they have mixed recent results, uncertainty goes up
  if (recentAttempts.length >= 3 && recentCorrectCount > 0 && recentCorrectCount < 3) {
    baseUncertainty = Math.min(1.0, baseUncertainty + 0.2);
  }
  
  // Status evaluation
  let status: MasteryStatus = 'NOT_ASSESSED';
  if (attemptCount === 0) status = 'NOT_ASSESSED';
  else if (masteryScore >= config.thresholds.mastered && baseUncertainty < 0.4) status = 'MASTERED';
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

  // If mastery is technically high but recent performance is weak, downgrade to REVIEW
  if (status === 'MASTERED' && recentPerformance === 'weak') {
    status = 'REVIEW';
    masteryScore = Math.max(0, masteryScore - 15); // Decay
  }

  const lastAttempt = sortedAttempts[sortedAttempts.length - 1];
  const lastCorrect = sortedAttempts.filter(a => a.correctness).pop();

  const state: LearnerConceptState = {
    student_id: studentId,
    concept_id: conceptId,
    mastery_score: Math.round(masteryScore),
    confidence_score: 0, // Could aggregate avg confidence here
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
    masteryScore: Math.round(masteryScore),
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
