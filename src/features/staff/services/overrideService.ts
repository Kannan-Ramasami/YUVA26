import { supabase } from '../../../lib/supabase';
import type { TeacherOverride, AuditLog } from '../types';

export class OverrideService {
  /**
   * Submits a teacher override and logs the audit event.
   */
  public async submitOverride(override: TeacherOverride): Promise<void> {
    if (!override.reason || override.reason.trim().length < 5) {
      throw new Error('A detailed reason must be provided for overriding an adaptive decision.');
    }

    const { data: insertedOverride, error: overrideError } = await supabase
      .from('teacher_overrides')
      .insert([override])
      .select()
      .single();

    if (overrideError) {
      throw overrideError;
    }

    // Log the audit event
    const auditLog: AuditLog = {
      event_type: 'teacher_override',
      actor_id: override.created_by,
      target_id: override.student_id,
      classroom_id: override.classroom_id,
      details: {
        override_id: insertedOverride.id,
        original_action: override.original_action,
        original_concept: override.original_concept,
        override_action: override.override_action,
        override_concept: override.override_concept,
        reason: override.reason
      }
    };

    await this.logEvent(auditLog);
  }

  /**
   * Logs a general audit event.
   */
  public async logEvent(log: AuditLog): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert([log]);

    if (error) {
      console.error('Failed to log audit event:', error);
      // We don't throw here to prevent breaking the main flow if audit logging fails
    }
  }

  /**
   * Retrieves active overrides for a specific student in a classroom.
   */
  public async getActiveOverrides(studentId: string, classroomId: string): Promise<TeacherOverride[]> {
    const { data, error } = await supabase
      .from('teacher_overrides')
      .select('*')
      .eq('student_id', studentId)
      .eq('classroom_id', classroomId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filter out expired overrides locally if needed, though they shouldn't be active.
    // In a real app, a cron job or DB trigger would mark them 'expired'.
    const now = new Date().getTime();
    return (data as TeacherOverride[]).filter(o => !o.expires_at || new Date(o.expires_at).getTime() > now);
  }
}
