import { AdaptiveDecisionEngine, type DecisionContext } from '../decisionEngine';
import type { LearningPlan, LearningPlanItem } from './types';
import { ActionType } from '../decisionEngine/types';

export class LearningPlanService {
  private decisionEngine: AdaptiveDecisionEngine;

  constructor() {
    this.decisionEngine = new AdaptiveDecisionEngine();
  }

  /**
   * Generates a new learning plan based on the diagnostic state or continuous updates.
   */
  public generatePlan(
    studentId: string,
    subjectId: string,
    contextBase: Omit<DecisionContext, 'target_concept'>,
    allConceptsInSubject: string[]
  ): { plan: LearningPlan, items: LearningPlanItem[] } {
    const planId = crypto.randomUUID();
    const generatedAt = new Date().toISOString();

    const plan: LearningPlan = {
      id: planId,
      student_id: studentId,
      subject_id: subjectId,
      learning_mode: contextBase.learning_context,
      classroom_id: contextBase.learning_context === 'classroom' ? 'default-class' : undefined,
      generated_at: generatedAt,
      policy_version: '1.0', // Could be dynamic
      status: 'ACTIVE'
    };

    const items: LearningPlanItem[] = [];

    // Evaluate all concepts for the student to build a comprehensive plan
    for (const conceptId of allConceptsInSubject) {
      // Evaluate what the decision engine would recommend if we focus on this concept
      const action = this.decisionEngine.getNextBestAction({
        ...contextBase,
        target_concept: conceptId
      });

      // Filter out ADVANCE for already mastered concepts unless they are specifically targeted for something else
      // Wait, the decision engine rule 'Advance Check' might return ADVANCE with the next concept.
      // If the decision is ADVANCE, it means they mastered it. We can mark the item as COMPLETED, or just not add it as an active to-do, unless we want to show completed items.
      
      const isMastered = contextBase.learner_states[conceptId]?.status === 'MASTERED';
      
      let itemStatus: 'PENDING' | 'COMPLETED' | 'SKIPPED' = 'PENDING';
      
      if (isMastered && action.action === ActionType.ADVANCE) {
         itemStatus = 'COMPLETED';
      }

      // Add to plan
      items.push({
        id: crypto.randomUUID(),
        plan_id: planId,
        concept_id: conceptId,
        recommended_action: action.action,
        priority: action.priority,
        status: itemStatus,
        reason: action.reason,
        created_at: generatedAt
      });
    }

    // Sort items by priority descending
    items.sort((a, b) => b.priority - a.priority);

    return { plan, items };
  }

  /**
   * Recalculates/regenerates a learning plan. 
   * Marks the old plan as superseded.
   */
  public updatePlan(
    oldPlan: LearningPlan,
    studentId: string,
    subjectId: string,
    contextBase: Omit<DecisionContext, 'target_concept'>,
    allConceptsInSubject: string[]
  ): { supersededPlan: LearningPlan, newPlan: LearningPlan, newItems: LearningPlanItem[] } {
    const supersededPlan = { ...oldPlan, status: 'SUPERSEDED' as const };
    const { plan: newPlan, items: newItems } = this.generatePlan(studentId, subjectId, contextBase, allConceptsInSubject);
    
    return { supersededPlan, newPlan, newItems };
  }
}
