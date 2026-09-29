export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'CODE' | 'ORDERING' | 'multiple_choice' | 'true_false' | 'short_answer';

export interface Concept {
  id: string;
  subject_id: string;
  name: string;
  description: string;
}

export interface Question {
  id: string;
  concept_id: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  text?: string;
  prompt?: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  hint?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface DiagnosticSession {
  id: string;
  student_id: string;
  subject_id: string;
  topic_id?: string; // ML Foundation Phase 1
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
}

export interface DiagnosticAttempt {
  id?: string;
  session_id: string;
  student_id: string;
  question_id: string;
  concept_id: string;
  topic_id?: string; // ML Foundation Phase 1
  correctness: boolean;
  difficulty: QuestionDifficulty;
  response_time_ms: number;
  confidence: number;
  hint_used: boolean; // ML Foundation Phase 1
  attempt_number: number;
  created_at?: string;
}

export type MasteryStatus = 'NOT_ASSESSED' | 'NEEDS_REMEDIATION' | 'DEVELOPING' | 'MASTERED' | 'REVIEW';

export interface LearnerConceptState {
  id?: string;
  student_id: string;
  concept_id: string;
  mastery_score: number;
  knowledge_probability: number; // ML Phase 2 BKT: 0.0 to 1.0 (P(Know))
  confidence_score: number;
  uncertainty: number;
  attempt_count: number;
  correct_count: number;
  status: MasteryStatus;
  last_attempt_at?: string;
  last_reviewed_at?: string;
  updated_at?: string;
}
