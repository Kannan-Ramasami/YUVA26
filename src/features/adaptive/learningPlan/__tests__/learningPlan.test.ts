import { describe, it, expect, beforeEach } from 'vitest';
import { LearningPlanService } from '../learningPlanService';
import type { DecisionContext } from '../../decisionEngine/types';
import type { LearnerConceptState } from '../../../../types/evidence';
import { ActionType } from '../../decisionEngine/types';

describe('LearningPlanService', () => {
  let service: LearningPlanService;
  let baseContext: Omit<DecisionContext, 'target_concept'>;
  const allConcepts = ['c_py_var', 'c_py_type', 'c_py_oper', 'c_py_loop'];

  const mockState = (overrides: Partial<LearnerConceptState>): LearnerConceptState => ({
    student_id: 's1',
    concept_id: 'c1',
    mastery_score: 50,
    confidence_score: 0.5,
    uncertainty: 0.5,
    attempt_count: 5,
    correct_count: 3,
    incorrect_count: 2,
    recent_correctness: 0.6,
    recent_response_time: 1000,
    recent_performance: [true, false, true, true, false],
    difficulty_exposure: { 'medium': 5 },
    hint_usage_count: 0,
    status: 'DEVELOPING',
    ...overrides
  });

  beforeEach(() => {
    service = new LearningPlanService();
    baseContext = {
      student_id: 's1',
      learning_context: 'individual',
      concept_graph: {
        getPrerequisites: () => [],
        getDependents: () => [],
        checkPrerequisiteReadiness: () => ({ isReady: true, status: 'AVAILABLE', blockingPrerequisites: [] }),
        getFirstWeakPrerequisite: () => null
      },
      learner_states: {
        'c_py_var': mockState({ concept_id: 'c_py_var', mastery_score: 85, status: 'MASTERED' }),
        'c_py_type': mockState({ concept_id: 'c_py_type', mastery_score: 50, status: 'DEVELOPING' }),
        'c_py_oper': mockState({ concept_id: 'c_py_oper', mastery_score: 0, status: 'NOT_ASSESSED', attempt_count: 0 }),
        'c_py_loop': mockState({ concept_id: 'c_py_loop', mastery_score: 0, status: 'NOT_ASSESSED', attempt_count: 0 }),
      },
      recent_attempts: [],
      review_candidates: []
    };
  });

  it('1. Different learners receive different plans', () => {
    const { items: planAItems } = service.generatePlan('s1', 'python_101', baseContext, allConcepts);
    
    // Create a context for Learner B with different states
    const contextB = {
      ...baseContext,
      learner_states: {
        'c_py_var': mockState({ concept_id: 'c_py_var', mastery_score: 50, status: 'DEVELOPING' }),
        'c_py_type': mockState({ concept_id: 'c_py_type', mastery_score: 85, status: 'MASTERED' }),
        'c_py_oper': mockState({ concept_id: 'c_py_oper', mastery_score: 85, status: 'MASTERED' }),
        'c_py_loop': mockState({ concept_id: 'c_py_loop', mastery_score: 85, status: 'MASTERED' }),
      }
    };
    const { items: planBItems } = service.generatePlan('s2', 'python_101', contextB, allConcepts);

    expect(planAItems).not.toEqual(planBItems);
    
    // Learner A has mastered 'c_py_var', should have COMPLETED status or ADVANCE action.
    const aVarItem = planAItems.find(i => i.concept_id === 'c_py_var');
    expect(aVarItem?.status).toBe('COMPLETED');
    expect(aVarItem?.recommended_action).toBe(ActionType.ADVANCE);

    // Learner B is DEVELOPING 'c_py_var', should have PENDING PRACTICE.
    const bVarItem = planBItems.find(i => i.concept_id === 'c_py_var');
    expect(bVarItem?.status).toBe('PENDING');
    expect(bVarItem?.recommended_action).toBe(ActionType.PRACTICE);
  });

  it('2. Weak prerequisites affect plans', () => {
    // Force a weak prerequisite on 'c_py_loop'
    baseContext.concept_graph.getFirstWeakPrerequisite = (conceptId) => {
      if (conceptId === 'c_py_loop') return 'c_py_oper'; // Depends on operators
      return null;
    };
    
    const { items } = service.generatePlan('s1', 'python_101', baseContext, allConcepts);
    const loopItem = items.find(i => i.concept_id === 'c_py_loop');
    
    expect(loopItem?.recommended_action).toBe(ActionType.REMEDIATE_PREREQUISITE);
    expect(loopItem?.priority).toBe(100); // Highest priority to fix blocker
  });

  it('3. New evidence can change the plan', () => {
    const { plan: oldPlan, items: oldItems } = service.generatePlan('s1', 'python_101', baseContext, allConcepts);
    
    // Simulate new evidence (student mastered c_py_type)
    const newContext = {
      ...baseContext,
      learner_states: {
        ...baseContext.learner_states,
        'c_py_type': mockState({ concept_id: 'c_py_type', mastery_score: 95, status: 'MASTERED', recent_correctness: 1.0 })
      }
    };
    
    const { supersededPlan, newPlan, newItems } = service.updatePlan(oldPlan, 's1', 'python_101', newContext, allConcepts);
    
    expect(supersededPlan.status).toBe('SUPERSEDED');
    expect(newPlan.status).toBe('ACTIVE');
    
    const oldTypeItem = oldItems.find(i => i.concept_id === 'c_py_type');
    expect(oldTypeItem?.recommended_action).toBe(ActionType.PRACTICE); // It was developing
    
    const newTypeItem = newItems.find(i => i.concept_id === 'c_py_type');
    expect(newTypeItem?.status).toBe('COMPLETED'); // Now it's mastered
  });

  it('4. Completed concepts remain in history', () => {
    const { items } = service.generatePlan('s1', 'python_101', baseContext, allConcepts);
    // 'c_py_var' is already mastered in baseContext
    const varItem = items.find(i => i.concept_id === 'c_py_var');
    
    expect(varItem).toBeDefined(); // Still in the plan
    expect(varItem?.status).toBe('COMPLETED'); // But marked as completed
  });

  it('5. Plans persist via status properties and IDs', () => {
    const { plan, items } = service.generatePlan('s1', 'python_101', baseContext, allConcepts);
    
    expect(plan.id).toBeDefined();
    expect(plan.status).toBe('ACTIVE');
    expect(items.length).toBe(allConcepts.length);
    items.forEach(item => {
      expect(item.plan_id).toBe(plan.id);
      expect(item.id).toBeDefined();
    });
  });

  it('6. Classroom context is respected', () => {
    baseContext.learning_context = 'classroom';
    baseContext.classroom_constraints = {
      scope_concepts: ['c_py_var', 'c_py_type'], // c_py_oper and c_py_loop out of scope
      teacher_overrides: {}
    };

    const { plan, items } = service.generatePlan('s1', 'python_101', baseContext, allConcepts);
    
    expect(plan.learning_mode).toBe('classroom');
    expect(plan.classroom_id).toBeDefined();

    const outOfScopeItem = items.find(i => i.concept_id === 'c_py_oper');
    expect(outOfScopeItem?.recommended_action).toBe(ActionType.TEACHER_INTERVENTION);
    expect(outOfScopeItem?.reason).toContain('outside the classroom scope');
  });
});
