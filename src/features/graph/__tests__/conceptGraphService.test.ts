import { describe, it, expect } from 'vitest';
import { conceptGraphService, CircularDependencyError } from '../services/conceptGraphService';
import type { LearnerConceptState } from '../../../types/evidence';
import type { ConceptPrerequisite } from '../types';

describe('Concept Graph Service', () => {

  const createMockState = (conceptId: string, masteryScore: number): LearnerConceptState => ({
    student_id: 's1',
    concept_id: conceptId,
    knowledge_probability: masteryScore / 100,
    mastery_score: masteryScore,
    confidence_score: 0,
    uncertainty: 0,
    attempt_count: 5,
    correct_count: 5,
    incorrect_count: 0,
    recent_correctness: 1,
    recent_response_time: 1000,
    recent_performance: [],
    difficulty_exposure: {},
    hint_usage_count: 0,
    status: masteryScore >= 70 ? 'MASTERED' : 'NEEDS_REMEDIATION'
  });

  it('1. Circular dependency is detected', () => {
    const invalidPrereqs: ConceptPrerequisite[] = [
      { id: '1', concept_id: 'A', prerequisite_concept_id: 'B', relationship_type: 'REQUIRED', minimum_mastery: 50 },
      { id: '2', concept_id: 'B', prerequisite_concept_id: 'C', relationship_type: 'REQUIRED', minimum_mastery: 50 },
      { id: '3', concept_id: 'C', prerequisite_concept_id: 'A', relationship_type: 'REQUIRED', minimum_mastery: 50 },
    ];

    expect(() => conceptGraphService.validateGraph(invalidPrereqs)).toThrow(CircularDependencyError);
  });

  it('2. Valid graph passes validation', () => {
    expect(() => conceptGraphService.validateGraph()).not.toThrow();
  });

  it('3. Mastered prerequisite allows readiness', () => {
    // Functions requires Loops (min 70)
    const states = [createMockState('c_py_loop', 85)];
    const result = conceptGraphService.checkPrerequisiteReadiness('c_py_func', states);
    
    expect(result.isReady).toBe(true);
    expect(result.status).toBe('AVAILABLE');
    expect(result.blockingPrerequisites.length).toBe(0);
  });

  it('4. Weak prerequisite blocks readiness', () => {
    // Functions requires Loops (min 70)
    const states = [createMockState('c_py_loop', 40)];
    const result = conceptGraphService.checkPrerequisiteReadiness('c_py_func', states);
    
    expect(result.isReady).toBe(false);
    expect(result.status).toBe('BLOCKED');
    expect(result.blockingPrerequisites.length).toBe(1);
    expect(result.blockingPrerequisites[0].prerequisiteId).toBe('c_py_loop');
  });

  it('5. Completion does not equal mastery (activity history != estimated learner state)', () => {
    // Even if they have "attempts", if mastery score is low, it's blocked.
    // The Readiness engine explicitly reads `mastery_score` and NOT `attempt_count`.
    const states = [createMockState('c_py_loop', 40)]; // Attempt count is 5, but mastery is 40
    const result = conceptGraphService.checkPrerequisiteReadiness('c_py_func', states);
    expect(result.isReady).toBe(false);
  });

  it('6. Prerequisite chain can be traversed (First Weak Prerequisite)', () => {
    // Functions -> Loops -> Conditions -> Operators
    // Operators is 40 (weak)
    // Conditions is 40 (weak)
    // Loops is 40 (weak)
    
    // The immediate blocker for Functions is Loops.
    // The immediate blocker for Loops is Conditions (weak).
    // The immediate blocker for Conditions is Operators (weak).
    // So the ROOT weak prereq of Functions is Operators.
    
    const states = [
      createMockState('c_py_var', 80),
      createMockState('c_py_type', 80),
      createMockState('c_py_oper', 40),
      createMockState('c_py_cond', 40),
      createMockState('c_py_loop', 40),
    ];
    
    const rootWeak = conceptGraphService.getFirstWeakPrerequisite('c_py_func', states);
    expect(rootWeak).toBe('c_py_oper');
  });

  describe('Hackathon Test: Different Learners, Different Availability', () => {
    it('7. Differentiates Student A and Student B in the same classroom', () => {
      // Student A: Conditions 85%, Loops 78%. Target: Functions (Requires Loops > 70)
      const studentAStates = [
        createMockState('c_py_cond', 85),
        createMockState('c_py_loop', 78)
      ];
      
      // Student B: Conditions 45%, Loops 40%.
      const studentBStates = [
        createMockState('c_py_cond', 45),
        createMockState('c_py_loop', 40)
      ];

      const resultA = conceptGraphService.checkPrerequisiteReadiness('c_py_func', studentAStates);
      const resultB = conceptGraphService.checkPrerequisiteReadiness('c_py_func', studentBStates);

      expect(resultA.isReady).toBe(true);
      expect(resultA.status).toBe('AVAILABLE');
      
      expect(resultB.isReady).toBe(false);
      expect(resultB.status).toBe('BLOCKED');
    });
  });
});
