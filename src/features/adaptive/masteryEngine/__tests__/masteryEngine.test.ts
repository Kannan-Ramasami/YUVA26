import { describe, it, expect, beforeEach } from 'vitest';
import { MasteryEngine } from '../index';
import type { LearnerConceptState, QuestionAttempt } from '../../../../types/evidence';
import { MasteryConfig } from '../config';

describe('MasteryEngine', () => {
  let engine: MasteryEngine;
  let baseState: LearnerConceptState;
  let baseAttempt: QuestionAttempt;

  beforeEach(() => {
    engine = new MasteryEngine();
    baseState = {
      student_id: 'student1',
      concept_id: 'concept1',
      mastery_score: 50,
      confidence_score: 0.5,
      uncertainty: 0.8,
      attempt_count: 0,
      correct_count: 0,
      incorrect_count: 0,
      recent_correctness: 0,
      recent_response_time: 0,
      recent_performance: [],
      difficulty_exposure: {},
      hint_usage_count: 0,
      status: 'DEVELOPING',
      last_attempt_at: new Date(Date.now() - 10000).toISOString(),
    };

    baseAttempt = {
      id: 'attempt1',
      student_id: 'student1',
      concept_id: 'concept1',
      question_id: 'q1',
      correctness: true,
      difficulty: 'medium', // Medium
      response_time_ms: 5000,
      confidence: 0.5,
      hint_used: false,
      attempt_number: 1,
      source: 'practice',
      timestamp: new Date().toISOString(),
    };
  });

  it('1. Correct attempt increases mastery appropriately', () => {
    const { newState } = engine.updateMastery(baseState, baseAttempt);
    expect(newState.mastery_score).toBeGreaterThan(baseState.mastery_score);
    expect(newState.correct_count).toBe(1);
    expect(newState.attempt_count).toBe(1);
  });

  it('2. Incorrect attempt changes mastery appropriately', () => {
    const attempt = { ...baseAttempt, correctness: false };
    const { newState } = engine.updateMastery(baseState, attempt);
    expect(newState.mastery_score).toBeLessThan(baseState.mastery_score);
    expect(newState.incorrect_count).toBe(1);
  });

  it('3. Hard questions provide stronger evidence', () => {
    const easyAttempt = { ...baseAttempt, difficulty: 'easy' as const };
    const hardAttempt = { ...baseAttempt, difficulty: 'hard' as const };

    const easyResult = engine.updateMastery(baseState, easyAttempt);
    const hardResult = engine.updateMastery(baseState, hardAttempt);

    const easyGain = easyResult.newState.mastery_score - baseState.mastery_score;
    const hardGain = hardResult.newState.mastery_score - baseState.mastery_score;

    expect(hardGain).toBeGreaterThan(easyGain);
  });

  it('4. Hints reduce evidence strength', () => {
    const hintAttempt = { ...baseAttempt, hint_used: true };
    const noHintResult = engine.updateMastery(baseState, baseAttempt);
    const hintResult = engine.updateMastery(baseState, hintAttempt);

    const noHintGain = noHintResult.newState.mastery_score - baseState.mastery_score;
    const hintGain = hintResult.newState.mastery_score - baseState.mastery_score;

    expect(hintGain).toBeLessThan(noHintGain);
  });

  it('5. Rapid retries do not inflate mastery', () => {
    // Current time
    const now = Date.now();
    baseState.last_attempt_at = new Date(now).toISOString();
    
    // Attempt happens just 1 second later
    const rapidAttempt = { ...baseAttempt, timestamp: new Date(now + 1000).toISOString() };
    
    // Normal attempt (10 seconds later)
    const normalAttempt = { ...baseAttempt, timestamp: new Date(now + 10000).toISOString() };

    const rapidResult = engine.updateMastery(baseState, rapidAttempt);
    const normalResult = engine.updateMastery(baseState, normalAttempt);

    const rapidGain = rapidResult.newState.mastery_score - baseState.mastery_score;
    const normalGain = normalResult.newState.mastery_score - baseState.mastery_score;

    expect(rapidGain).toBeLessThan(normalGain);
  });

  it('6. Repeated attempts do not create unlimited mastery', () => {
    // Start with 90 mastery
    const state = { ...baseState, mastery_score: 95 };
    const { newState } = engine.updateMastery(state, baseAttempt);
    
    expect(newState.mastery_score).toBeLessThanOrEqual(MasteryConfig.MAX_MASTERY);
  });

  it('7. Multiple consistent attempts reduce uncertainty', () => {
    const consistentState = { 
      ...baseState, 
      attempt_count: 5, 
      recent_performance: [true, true, true] 
    };
    
    const inconsistentState = { 
      ...baseState, 
      attempt_count: 5, 
      recent_performance: [true, false, true] 
    };

    const consistentResult = engine.updateMastery(consistentState, baseAttempt);
    const inconsistentResult = engine.updateMastery(inconsistentState, baseAttempt);

    expect(consistentResult.newState.uncertainty).toBeLessThan(inconsistentResult.newState.uncertainty);
  });

  it('8. Mastery history is persisted via changeLog', () => {
    const { changeLog } = engine.updateMastery(baseState, baseAttempt);
    expect(changeLog).toBeDefined();
    expect(changeLog.previous_mastery).toBe(baseState.mastery_score);
    expect(changeLog.change_amount).toBeGreaterThan(0);
    expect(changeLog.reason).toContain('Correct');
  });

});
