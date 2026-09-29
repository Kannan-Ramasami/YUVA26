import type { ActionType } from '../../adaptive/decisionEngine/types';

export interface TeacherOverride {
  id?: string;
  student_id: string;
  classroom_id: string;
  original_action: ActionType;
  original_concept: string;
  override_action: ActionType;
  override_concept: string;
  reason: string;
  created_by: string;
  created_at?: string;
  expires_at?: string;
  status?: 'active' | 'expired' | 'revoked';
}

export interface AuditLog {
  id?: string;
  event_type: 'recommendation_generated' | 'teacher_override' | 'mastery_update' | 'intervention' | 'classroom_change';
  actor_id: string; // The person who did it (Teacher ID, Student ID, or 'system')
  target_id: string; // E.g., Student ID if the event is about a student
  classroom_id?: string;
  details: Record<string, any>;
  created_at?: string;
}
