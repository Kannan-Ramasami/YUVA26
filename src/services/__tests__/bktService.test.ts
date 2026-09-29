import { describe, it, expect } from 'vitest';
import { 
  updateKnowledge, 
  initializeKnowledge, 
  recalculateConceptKnowledge, 
  DEFAULT_BKT_CONFIG 
} from '../bktService';

describe('Bayesian Knowledge Tracing (BKT) Service - Phase 2', () => {
  const config = DEFAULT_BKT_CONFIG;
  // { initial_knowledge: 0.20, learn_probability: 0.15, guess_probability: 0.20, slip_probability: 0.10 }

  it('TEST 1: Initial knowledge should equal P(L0)', () => {
    const initKnowledge = initializeKnowledge(config);
    expect(initKnowledge).toBe(config.initial_knowledge);
    expect(initKnowledge).toBe(0.20);
  });

  it('TEST 2 & 4 & 8: Correct answer should update knowledge upward but not to 1.0 immediately (guess factor)', () => {
    const pL0 = initializeKnowledge(config);
    const updated = updateKnowledge(pL0, true, config);
    
    // P(K) should go up
    expect(updated).toBeGreaterThan(pL0);
    // Because of Guess and Slip, one correct answer shouldn't jump to 1.0
    expect(updated).toBeLessThan(1.0);
    
    // Explicit manual calculation check:
    // P(K | correct) = (0.20 * 0.90) / (0.20 * 0.90 + 0.80 * 0.20) = 0.18 / (0.18 + 0.16) = 0.18 / 0.34 = 0.5294
    // P(K_after) = 0.5294 + (1 - 0.5294) * 0.15 = 0.5294 + 0.4706 * 0.15 = 0.5294 + 0.0706 = 0.60
    expect(updated).toBeCloseTo(0.60, 2);
  });

  it('TEST 3 & 4 & 9: Incorrect answer should reduce the posterior, but not to 0.0 immediately (slip factor)', () => {
    // Start with a high knowledge base so we can see it drop
    const highKnowledge = 0.80; 
    const updated = updateKnowledge(highKnowledge, false, config);
    
    expect(updated).toBeLessThan(highKnowledge);
    // Because of slip, it doesn't crash to 0 immediately
    expect(updated).toBeGreaterThan(0.0);
  });

  it('TEST 5: Multiple attempts should sequentially use the previous state', () => {
    const attempts = [{ correctness: true }, { correctness: false }, { correctness: true }];
    const finalScoreSeq = recalculateConceptKnowledge(attempts, config);
    
    let pK = initializeKnowledge(config);
    pK = updateKnowledge(pK, true, config);
    pK = updateKnowledge(pK, false, config);
    pK = updateKnowledge(pK, true, config);
    
    expect(finalScoreSeq).toBeCloseTo(pK, 5);
  });

  it('TEST 6: Different concepts maintain independent states', () => {
    // This is structurally handled by providing different attempt arrays to recalculateConceptKnowledge.
    const conceptA_Attempts = [{ correctness: true }, { correctness: true }];
    const conceptB_Attempts = [{ correctness: false }, { correctness: false }];
    
    const pKA = recalculateConceptKnowledge(conceptA_Attempts, config);
    const pKB = recalculateConceptKnowledge(conceptB_Attempts, config);
    
    expect(pKA).toBeGreaterThan(pKB);
  });

  it('TEST 7: Attempt order changes the knowledge trajectory significantly', () => {
    // Correct -> Correct -> Wrong
    const traj1 = [{ correctness: true }, { correctness: true }, { correctness: false }];
    const result1 = recalculateConceptKnowledge(traj1, config);
    
    // Wrong -> Correct -> Correct
    const traj2 = [{ correctness: false }, { correctness: true }, { correctness: true }];
    const result2 = recalculateConceptKnowledge(traj2, config);
    
    // They should not be equal. (Usually learning late is better than unlearning late).
    expect(result1).not.toBeCloseTo(result2, 4);
    
    // Let's see which is higher. A recent wrong answer drops confidence sharply.
    expect(result2).toBeGreaterThan(result1); 
  });

  it('TEST 10: Reproducibility - BKT is completely deterministic', () => {
    const traj = [
      { correctness: true }, { correctness: false }, 
      { correctness: false }, { correctness: true }, 
      { correctness: true }
    ];
    
    const run1 = recalculateConceptKnowledge(traj, config);
    const run2 = recalculateConceptKnowledge(traj, config);
    const run3 = recalculateConceptKnowledge(traj, config);
    
    expect(run1).toBe(run2);
    expect(run2).toBe(run3);
  });
});
