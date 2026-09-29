import type { LearnerConceptState, QuestionAttempt } from '../../../types/evidence';

export const ActionType = {
  ADVANCE: 'ADVANCE' as const,
  PRACTICE: 'PRACTICE' as const,
  REVIEW: 'REVIEW' as const,
  REMEDIATE_PREREQUISITE: 'REMEDIATE_PREREQUISITE' as const,
  CHALLENGE: 'CHALLENGE' as const,
  TEACHER_INTERVENTION: 'TEACHER_INTERVENTION' as const,
};

export type ActionType = typeof ActionType[keyof typeof ActionType];

export interface DecisionContext {
  student_id: string;
  target_concept: string; // The concept they are currently on or trying to learn
  learning_context: 'individual' | 'classroom';
  concept_graph: ConceptGraphInterface;
  learner_states: Record<string, LearnerConceptState>; // Map of conceptId -> state
  recent_attempts: QuestionAttempt[];
  review_candidates: string[]; // Concepts identified by spaced review engine
  classroom_constraints?: ClassroomConstraints;
}

export interface ConceptGraphInterface {
  getPrerequisites: (conceptId: string) => Array<{ id: string; prerequisite_concept_id: string; minimum_mastery: number }>;
  getDependents: (conceptId: string) => Array<{ id: string; concept_id: string }>;
  checkPrerequisiteReadiness: (conceptId: string, learnerStates: LearnerConceptState[]) => any;
  getFirstWeakPrerequisite: (conceptId: string, learnerStates: LearnerConceptState[]) => string | null;
}

export interface ClassroomConstraints {
  scope_concepts: string[]; // Concepts currently allowed in the classroom
  teacher_overrides: Record<string, any>;
}

export interface AdaptiveAction {
  decision_id: string;
  student_id: string;
  action: ActionType;
  target_concept: string;
  priority: number;
  reason: string;
  evidence: {
    mastery_score?: number;
    uncertainty?: number;
    prerequisite_scores?: Record<string, number>;
    [key: string]: any;
  };
  confidence: number;
  created_at: string;
}

export interface DecisionTrace extends AdaptiveAction {
  input_state: any;
  policy_version: string;
  timestamp: string;
}
