export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

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
  text: string;
  options?: string[]; // For multiple choice
  correct_answer: string;
}

export interface DiagnosticSession {
  id: string;
  student_id: string;
  subject_id: string;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at?: string;
}

export interface DiagnosticAttempt {
  id?: string;
  session_id: string;
  student_id: string;
  question_id: string;
  concept_id: string;
  correctness: boolean;
  difficulty: QuestionDifficulty;
  response_time_ms: number;
  confidence: number; // 1 to 5
  attempt_number: number;
  created_at?: string;
}

export type MasteryStatus = 'NOT_ASSESSED' | 'NEEDS_REMEDIATION' | 'DEVELOPING' | 'MASTERED' | 'REVIEW';

export interface LearnerConceptState {
  id?: string;
  student_id: string;
  concept_id: string;
  mastery_score: number; // 0 to 100
  confidence_score: number;
  uncertainty: number; // 0.0 to 1.0
  attempt_count: number;
  correct_count: number;
  status: MasteryStatus;
  last_attempt_at?: string;
  last_reviewed_at?: string;
  updated_at?: string;
}
