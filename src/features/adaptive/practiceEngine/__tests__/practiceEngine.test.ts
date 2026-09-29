import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionSelectionEngine } from '../questionSelection';
import { ActionType } from '../../decisionEngine/types';
import type { Question } from '../../../diagnostic/types';
import type { LearnerConceptState } from '../../../../types/evidence';

describe('QuestionSelectionEngine', () => {
  let engine: QuestionSelectionEngine;
  
  const mockBank: Question[] = [
    { id: 'q1', concept_id: 'c1', type: 'MCQ', difficulty: 'easy', text: 'Q1', correct_answer: 'A' },
    { id: 'q2', concept_id: 'c1', type: 'MCQ', difficulty: 'medium', text: 'Q2', correct_answer: 'A' },
    { id: 'q3', concept_id: 'c1', type: 'MCQ', difficulty: 'hard', text: 'Q3', correct_answer: 'A' },
    { id: 'q4', concept_id: 'c2', type: 'MCQ', difficulty: 'easy', text: 'Q4', correct_answer: 'A' }, // Different concept
    { id: 'q5', concept_id: 'c1', type: 'MCQ', difficulty: 'easy', text: 'Q5', correct_answer: 'A' }, // Another easy
  ];

  const mockState = (overrides: Partial<LearnerConceptState>): LearnerConceptState => ({
    student_id: 's1',
    concept_id: 'c1',
    knowledge_probability: 0.5,
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
    engine = new QuestionSelectionEngine();
  });

  it('filters out questions from other concepts', () => {
    const q = engine.selectQuestion(mockBank, {
      targetConcept: 'c1',
      learnerState: mockState({}),
      currentAction: ActionType.PRACTICE,
      attemptedQuestionIds: new Set()
    });
    
    expect(q?.concept_id).toBe('c1');
  });

  it('filters out already attempted questions (History / Anti-Gaming)', () => {
    // If we've attempted q1, q2, q3, q5 is the only unattempted 'easy' left
    const q = engine.selectQuestion(mockBank, {
      targetConcept: 'c1',
      learnerState: mockState({ mastery_score: 10 }), // mastery < 40 prefers easy
      currentAction: ActionType.PRACTICE,
      attemptedQuestionIds: new Set(['q1', 'q2', 'q3'])
    });
    
    expect(q?.id).toBe('q5');
  });

  it('selects easy questions for low mastery practice', () => {
    const q = engine.selectQuestion(mockBank, {
      targetConcept: 'c1',
      learnerState: mockState({ mastery_score: 20 }),
      currentAction: ActionType.PRACTICE,
      attemptedQuestionIds: new Set()
    });
    
    expect(q?.difficulty).toBe('easy');
  });

  it('selects medium questions for moderate mastery practice', () => {
    const q = engine.selectQuestion(mockBank, {
      targetConcept: 'c1',
      learnerState: mockState({ mastery_score: 60 }),
      currentAction: ActionType.PRACTICE,
      attemptedQuestionIds: new Set()
    });
    
    expect(q?.difficulty).toBe('medium');
  });

  it('selects hard questions for high mastery practice', () => {
    const q = engine.selectQuestion(mockBank, {
      targetConcept: 'c1',
      learnerState: mockState({ mastery_score: 90 }),
      currentAction: ActionType.PRACTICE,
      attemptedQuestionIds: new Set()
    });
    
    expect(q?.difficulty).toBe('hard');
  });

  it('selects hard questions for CHALLENGE mode', () => {
    const q = engine.selectQuestion(mockBank, {
      targetConcept: 'c1',
      learnerState: mockState({ mastery_score: 10 }), // State doesn't matter for challenge mode
      currentAction: ActionType.CHALLENGE,
      attemptedQuestionIds: new Set()
    });
    
    expect(q?.difficulty).toBe('hard');
  });

  it('selects easy questions for REMEDIATE_PREREQUISITE mode', () => {
    const q = engine.selectQuestion(mockBank, {
      targetConcept: 'c1',
      learnerState: mockState({ mastery_score: 90 }), // State doesn't matter for remediation rule
      currentAction: ActionType.REMEDIATE_PREREQUISITE,
      attemptedQuestionIds: new Set()
    });
    
    expect(q?.difficulty).toBe('easy');
  });

  it('falls back to attempted questions if unattempted pool is exhausted', () => {
    const q = engine.selectQuestion(mockBank, {
      targetConcept: 'c1',
      learnerState: mockState({ mastery_score: 10 }),
      currentAction: ActionType.PRACTICE,
      // Attempted all c1 questions
      attemptedQuestionIds: new Set(['q1', 'q2', 'q3', 'q5'])
    });
    
    // Should still return a question, preferring easy since mastery < 40
    expect(q).toBeDefined();
    expect(['q1', 'q5']).toContain(q?.id);
  });
});
