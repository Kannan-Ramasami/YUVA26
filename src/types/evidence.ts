import type { QuestionDifficulty, MasteryStatus } from '../features/diagnostic/types';

export type AttemptSource = 'diagnostic' | 'practice' | 'review' | 'challenge' | 'remediation';

export interface QuestionAttempt {
  id: string;
  student_id: string;
  concept_id: string;
  question_id: string;
  session_id?: string;
  correctness: boolean;
  difficulty: QuestionDifficulty;
  response_time_ms: number;
  confidence: number;
  hint_used: boolean;
  attempt_number: number;
  learning_context?: string;
  learning_mode?: string;
  classroom_id?: string;
  source: AttemptSource;
  timestamp: string;
}

export interface LearnerConceptState {
  id?: string;
  student_id: string;
  concept_id: string;
  mastery_score: number; // 0 to 100
  knowledge_probability: number; // ML Phase 2 BKT: 0.0 to 1.0 (P(Know))
  confidence_score: number;
  uncertainty: number; // 0.0 to 1.0
  attempt_count: number;
  correct_count: number;
  incorrect_count: number;
  recent_correctness: number;
  recent_response_time: number;
  recent_performance: boolean[]; // true for correct, false for incorrect (recent 10)
  difficulty_exposure: Record<string, number>; // difficulty level -> count
  hint_usage_count: number;
  status: MasteryStatus;
  last_attempt_at?: string;
  last_correct_at?: string;
  last_reviewed_at?: string;
  updated_at?: string;
}

export interface MasteryChangeLog {
  id: string;
  student_id: string;
  concept_id: string;
  previous_mastery: number; // 0 to 100
  new_mastery: number; // 0 to 100
  previous_probability: number; // BKT P(Know)
  new_probability: number; // BKT P(Know)
  change_amount: number;
  reason: string;
  attempt_id?: string;
  timestamp: string;
}

export interface AnalysisResult {
  conceptId: string;
  masteryScore: number;
  uncertainty: number;
  status: MasteryStatus;
  evidenceSummary: {
    totalAttempts: number;
    correctCount: number;
    hintAssisted: number;
    rapidRetries: number;
  };
  recentPerformance: 'strong' | 'weak' | 'inconsistent' | 'none';
  riskSignals: string[];
  recommendedAttention: boolean;
}

export interface LearningSession {
  id: string;
  student_id: string;
  concept_id: string;
  started_at: string;
  completed_at?: string;
  activity_count: number;
  learning_mode: 'individual' | 'classroom';
  classroom_id?: string;
}
