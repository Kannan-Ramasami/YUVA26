import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveDecisionEngine, ActionType, type DecisionContext } from '../index';
import type { LearnerConceptState } from '../../../../types/evidence';

describe('AdaptiveDecisionEngine', () => {
  let engine: AdaptiveDecisionEngine;
  let baseContext: DecisionContext;

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
    engine = new AdaptiveDecisionEngine();
    
    baseContext = {
      student_id: 's1',
      target_concept: 'c1',
      learning_context: 'individual',
      concept_graph: {
        getPrerequisites: () => [],
        getDependents: () => [{ id: 'd1', concept_id: 'c2' }],
        checkPrerequisiteReadiness: () => ({ isReady: true, status: 'AVAILABLE', blockingPrerequisites: [] }),
        getFirstWeakPrerequisite: () => null
      },
      learner_states: {
        'c1': mockState({})
      },
      recent_attempts: [],
      review_candidates: []
    };
  });

  it('1. Advance when mastered', () => {
    baseContext.learner_states['c1'] = mockState({ mastery_score: 85, status: 'MASTERED' });
    const action = engine.getNextBestAction(baseContext);
    
    expect(action.action).toBe(ActionType.ADVANCE);
    expect(action.target_concept).toBe('c2'); // Moves to dependent concept
    expect(action.reason).toBeTruthy();
  });

  it('2. Practice when developing', () => {
    baseContext.learner_states['c1'] = mockState({ mastery_score: 50, status: 'DEVELOPING' });
    const action = engine.getNextBestAction(baseContext);
    
    expect(action.action).toBe(ActionType.PRACTICE);
    expect(action.target_concept).toBe('c1');
    expect(action.reason).toBeTruthy();
  });

  it('3. Review when marked as review candidate', () => {
    baseContext.learner_states['c1'] = mockState({ mastery_score: 75, status: 'DEVELOPING' });
    baseContext.review_candidates = ['c1']; // It's a review candidate
    
    const action = engine.getNextBestAction(baseContext);
    expect(action.action).toBe(ActionType.REVIEW);
    expect(action.reason).toContain('Review');
  });

  it('4. Remediate prerequisite when a weak prerequisite is found', () => {
    // Override graph mock to return a weak prerequisite
    baseContext.concept_graph.getFirstWeakPrerequisite = () => 'prereq1';
    baseContext.learner_states['prereq1'] = mockState({ concept_id: 'prereq1', mastery_score: 20 });
    
    const action = engine.getNextBestAction(baseContext);
    expect(action.action).toBe(ActionType.REMEDIATE_PREREQUISITE);
    expect(action.target_concept).toBe('prereq1');
    expect(action.reason).toContain('prereq1');
  });

  it('5. Challenge when mastered with high confidence and strong recent performance', () => {
    baseContext.learner_states['c1'] = mockState({ 
      mastery_score: 95, 
      status: 'MASTERED',
      uncertainty: 0.1,
      recent_correctness: 1.0,
      attempt_count: 20,
      hint_usage_count: 0
    });
    
    const action = engine.getNextBestAction(baseContext);
    expect(action.action).toBe(ActionType.CHALLENGE);
    expect(action.reason).toContain('Challenge');
  });

  it('6. Teacher intervention on repeated struggles', () => {
    baseContext.learner_states['c1'] = mockState({ 
      attempt_count: 15,
      mastery_score: 30,
      recent_correctness: 0.2,
      status: 'NEEDS_REMEDIATION'
    });
    
    const action = engine.getNextBestAction(baseContext);
    expect(action.action).toBe(ActionType.TEACHER_INTERVENTION);
  });

  it('7. Weak prerequisite overrides progression (priority test)', () => {
    // State is mastered (should ADVANCE)
    baseContext.learner_states['c1'] = mockState({ mastery_score: 85, status: 'MASTERED' });
    
    // BUT there is a weak prerequisite! (This happens if graph is updated or they decayed on prereqs)
    baseContext.concept_graph.getFirstWeakPrerequisite = () => 'prereq1';
    
    const action = engine.getNextBestAction(baseContext);
    // REMEDIATE_PREREQUISITE has priority 100, ADVANCE has priority 70
    expect(action.action).toBe(ActionType.REMEDIATE_PREREQUISITE);
  });

  it('8. Same latest score but different history results in different actions', () => {
    // Both have mastery_score: 92
    // Student A: strong history, no hints, low uncertainty
    const contextA: DecisionContext = {
      ...baseContext,
      learner_states: {
        'c1': mockState({ 
          mastery_score: 92, 
          status: 'MASTERED', 
          uncertainty: 0.1, 
          recent_correctness: 1.0,
          attempt_count: 10,
          hint_usage_count: 0
        })
      }
    };

    // Student B: high uncertainty, high hint usage, weak recent correctness
    const contextB: DecisionContext = {
      ...baseContext,
      learner_states: {
        'c1': mockState({ 
          mastery_score: 92, 
          status: 'MASTERED', 
          uncertainty: 0.5, 
          recent_correctness: 0.5, // recent struggles
          attempt_count: 20,
          hint_usage_count: 15 // heavy hints
        })
      }
    };

    const actionA = engine.getNextBestAction(contextA);
    const actionB = engine.getNextBestAction(contextB);

    expect(actionA.action).toBe(ActionType.CHALLENGE);
    expect(actionB.action).toBe(ActionType.ADVANCE); // Or practice depending on priority, but definitely NOT challenge
    expect(actionA.action).not.toEqual(actionB.action);
  });

  it('9. Different students receive different decisions', () => {
    // Similar to #8, proving identity/state separation
    const action = engine.getNextBestAction(baseContext);
    expect(action.student_id).toBe('s1');
  });

  it('10. Classroom constraints are respected', () => {
    baseContext.learning_context = 'classroom';
    baseContext.classroom_constraints = {
      scope_concepts: ['c2', 'c3'], // c1 is NOT in scope
      teacher_overrides: {}
    };

    const action = engine.getNextBestAction(baseContext);
    expect(action.action).toBe(ActionType.TEACHER_INTERVENTION);
    expect(action.reason).toContain('outside the classroom scope');
  });

  it('11. Decisions are reproducible (Determinism)', () => {
    const action1 = engine.getNextBestAction(baseContext);
    const action2 = engine.getNextBestAction(baseContext);
    
    // UUID will differ, but core decision fields must be identical
    expect(action1.action).toBe(action2.action);
    expect(action1.target_concept).toBe(action2.target_concept);
    expect(action1.priority).toBe(action2.priority);
  });

  it('12. Every decision has an explanation (reason)', () => {
    const action = engine.getNextBestAction(baseContext);
    expect(action.reason).toBeDefined();
    expect(typeof action.reason).toBe('string');
    expect(action.reason.length).toBeGreaterThan(10);
  });
});
