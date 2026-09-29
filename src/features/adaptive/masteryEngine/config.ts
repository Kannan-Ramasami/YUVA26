

export const MasteryConfig = {
  // Mastery bounds
  MIN_MASTERY: 0,
  MAX_MASTERY: 100,

  // Base evidence weight for a single attempt (out of 100)
  BASE_EVIDENCE_WEIGHT: 15,

  // Difficulty multipliers
  DIFFICULTY_WEIGHTS: {
    'easy': 0.8, // Easy
    'medium': 1.0, // Medium
    'hard': 1.3, // Hard
  } as Record<string, number>,

  // Confidence influence (0.0 to 1.0 scale from the attempt)
  CONFIDENCE_MULTIPLIER_CORRECT: {
    HIGH: 1.1,
    MEDIUM: 1.0,
    LOW: 0.8,
  },
  CONFIDENCE_MULTIPLIER_INCORRECT: {
    HIGH: 1.2, // Confidently wrong -> stronger evidence of misconception
    MEDIUM: 1.0,
    LOW: 0.8, // Guessing wrong -> weaker evidence
  },

  // Penalties
  HINT_PENALTY: 0.5, // 50% reduction in evidence weight for correct answer if hint used
  RAPID_RETRY_PENALTY: 0.3, // 70% reduction in evidence weight if attempted < 2s after last

  // Thresholds for mastery status
  THRESHOLDS: {
    NEEDS_REMEDIATION: 30, // 0-30
    DEVELOPING: 60,        // 31-60
    MASTERED: 85,          // 61-85 (and >85 is REVIEW/MASTERED)
  },

  // Uncertainty bounds
  MIN_UNCERTAINTY: 0.05,
  MAX_UNCERTAINTY: 1.0,

  // Recent performance window size
  RECENT_PERFORMANCE_WINDOW: 10,
};
