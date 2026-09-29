import { describe, it, expect } from 'vitest';
import { calculateConceptMastery } from '../learnerAnalysisService';
import type { QuestionAttempt } from '../../types/evidence';

const baseAttempt = (overrides: Partial<QuestionAttempt> = {}): QuestionAttempt => ({
  id: 'test_attempt_' + Math.random(),
  student_id: 'student_1',
  concept_id: 'concept_1',
  question_id: 'q_1',
  correctness: true,
  difficulty: 'medium',
  response_time_ms: 5000,
  confidence: 4,
  hint_used: false,
  attempt_number: 1,
  source: 'practice',
  timestamp: new Date().toISOString(),
  ...overrides
});

describe('Learner Analysis Service', () => {

  it('1. Correct answer increases mastery', () => {
    const attempt1 = baseAttempt({ correctness: true });
    const { state: state1 } = calculateConceptMastery('concept_1', 'student_1', [attempt1]);
    expect(state1.mastery_score).toBeGreaterThan(0);
  });

  it('2. Incorrect answer decreases or prevents mastery increase', () => {
    const attemptCorrect = baseAttempt({ correctness: true });
    const attemptIncorrect = baseAttempt({ correctness: false, timestamp: new Date(Date.now() + 1000).toISOString() });
    
    const { state: stateCorrectOnly } = calculateConceptMastery('concept_1', 'student_1', [attemptCorrect]);
    const { state: stateBoth } = calculateConceptMastery('concept_1', 'student_1', [attemptCorrect, attemptIncorrect]);
    
    expect(stateBoth.mastery_score).toBeLessThan(stateCorrectOnly.mastery_score);
  });

  it('3. Harder question provides stronger evidence', () => {
    const attemptMedium = baseAttempt({ correctness: true, difficulty: 'medium' });
    const attemptHard = baseAttempt({ correctness: true, difficulty: 'hard' });
    
    const { state: stateMedium } = calculateConceptMastery('concept_1', 'student_1', [attemptMedium]);
    const { state: stateHard } = calculateConceptMastery('concept_1', 'student_1', [attemptHard]);
    
    expect(stateHard.mastery_score).toBeGreaterThan(stateMedium.mastery_score);
  });

  it('4. Hint usage reduces mastery evidence', () => {
    const attemptNoHint = baseAttempt({ correctness: true, hint_used: false });
    const attemptWithHint = baseAttempt({ correctness: true, hint_used: true });
    
    const { state: stateNoHint } = calculateConceptMastery('concept_1', 'student_1', [attemptNoHint]);
    const { state: stateWithHint } = calculateConceptMastery('concept_1', 'student_1', [attemptWithHint]);
    
    expect(stateWithHint.mastery_score).toBeLessThan(stateNoHint.mastery_score);
  });

  it('5. Rapid retries do not inflate mastery', () => {
    const timestamp1 = new Date();
    const timestamp2 = new Date(timestamp1.getTime() + 1000); // Only 1 second later
    
    const attempt1 = baseAttempt({ question_id: 'q_1', timestamp: timestamp1.toISOString() });
    const attempt2 = baseAttempt({ question_id: 'q_1', timestamp: timestamp2.toISOString() }); // Same question, rapid retry
    
    const { analysis } = calculateConceptMastery('concept_1', 'student_1', [attempt1, attempt2]);
    expect(analysis.evidenceSummary.rapidRetries).toBe(1);
  });

  it('6 & 7. Uncertainty scales with attempt count', () => {
    const attempt1 = baseAttempt();
    const attempt2 = baseAttempt({ timestamp: new Date(Date.now() + 10000).toISOString() });
    const attempt3 = baseAttempt({ timestamp: new Date(Date.now() + 20000).toISOString() });
    
    const { state: stateSingle } = calculateConceptMastery('concept_1', 'student_1', [attempt1]);
    const { state: stateMultiple } = calculateConceptMastery('concept_1', 'student_1', [attempt1, attempt2, attempt3]);
    
    // Single successful attempt leaves uncertainty relatively high
    expect(stateSingle.uncertainty).toBeGreaterThan(0.8);
    // Multiple consistent attempts reduce it
    expect(stateMultiple.uncertainty).toBeLessThan(stateSingle.uncertainty);
  });

  it('8. Recent performance is tracked', () => {
    const oldAttempt = baseAttempt({ correctness: true, timestamp: new Date(2000, 1, 1).toISOString() });
    const newAttempt = baseAttempt({ correctness: false, timestamp: new Date(2026, 1, 1).toISOString() });
    
    const { analysis } = calculateConceptMastery('concept_1', 'student_1', [oldAttempt, newAttempt]);
    expect(analysis.recentPerformance).toBe('inconsistent'); // 1 correct, 1 incorrect in the recent window
  });

  it('10. Same latest score with different histories can produce different states', () => {
    // Student A: Slow, steady mastery (enough to reach DEVELOPING status)
    const a1 = baseAttempt({ correctness: true, timestamp: new Date(1000).toISOString() });
    const a2 = baseAttempt({ correctness: true, timestamp: new Date(10000).toISOString() });
    const a3 = baseAttempt({ correctness: true, timestamp: new Date(20000).toISOString() });
    const a4 = baseAttempt({ correctness: true, timestamp: new Date(30000).toISOString() });
    const a5 = baseAttempt({ correctness: true, timestamp: new Date(40000).toISOString() });
    const { state: stateA } = calculateConceptMastery('concept_1', 'student_1', [a1, a2, a3, a4, a5]);

    // Student B: Guessed multiple times rapidly to get the correct answers
    const b1 = baseAttempt({ correctness: false, timestamp: new Date(1000).toISOString() });
    const b2 = baseAttempt({ correctness: true, timestamp: new Date(1500).toISOString() }); // rapid
    const b3 = baseAttempt({ correctness: true, timestamp: new Date(2000).toISOString() }); // rapid
    const b4 = baseAttempt({ correctness: false, timestamp: new Date(2500).toISOString() }); // rapid
    const b5 = baseAttempt({ correctness: true, timestamp: new Date(3000).toISOString() }); // rapid
    const { state: stateB } = calculateConceptMastery('concept_1', 'student_2', [b1, b2, b3, b4, b5]);

    expect(stateA.mastery_score).toBeGreaterThan(stateB.mastery_score);
    expect(stateA.status).not.toBe(stateB.status);
  });

});
