import type { ActionType } from '../decisionEngine';

export interface LearningPlan {
  id: string;
  student_id: string;
  subject_id: string;
  learning_mode: 'individual' | 'classroom';
  classroom_id?: string;
  generated_at: string;
  policy_version: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'COMPLETED';
}

export interface LearningPlanItem {
  id: string;
  plan_id: string;
  concept_id: string;
  recommended_action: ActionType;
  priority: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  reason: string;
  created_at: string;
}
