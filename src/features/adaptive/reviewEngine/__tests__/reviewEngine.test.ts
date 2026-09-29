import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReviewService } from '../reviewService';
import type { ConceptGraphInterface } from '../../decisionEngine/types';
import type { LearnerConceptState } from '../../../../types/evidence';

describe('ReviewService', () => {
  let service: ReviewService;
  
  beforeEach(() => {
    service = new ReviewService();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  const createState = (overrides: Partial<LearnerConceptState>): LearnerConceptState => ({
    student_id: 's1',
    concept_id: 'c1',
    mastery_score: 80,
    confidence_score: 0.8,
    uncertainty: 0.2,
    attempt_count: 5,
    correct_count: 4,
    incorrect_count: 1,
    recent_correctness: 0.8,
    recent_response_time: 1000,
    recent_performance: [true, true, true, false, true],
    difficulty_exposure: {},
    hint_usage_count: 0,
    status: 'MASTERED',
    last_attempt_at: new Date().toISOString(),
    ...overrides
  });

  it('Long gap triggers spaced review', () => {
    // 10 days ago. correct_count is 4, which means tier 1 -> 3 day gap.
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const state = createState({ last_attempt_at: tenDaysAgo, correct_count: 4 });
    
    const candidates = service.getReviewCandidates([state]);
    
    expect(candidates.length).toBe(1);
    expect(candidates[0].reason).toBe('SPACED_REVIEW');
    expect(candidates[0].daysOverdue).toBeGreaterThan(0);
  });

  it('Recent strong performance delays review', () => {
    // Just now
    const state = createState({ last_attempt_at: new Date().toISOString(), correct_count: 4 });
    
    const candidates = service.getReviewCandidates([state]);
    expect(candidates.length).toBe(0);
  });

  it('Weak prerequisite triggers remediation immediately', () => {
    const state = createState({ 
      concept_id: 'c_prereq',
      mastery_score: 40,
      last_attempt_at: new Date().toISOString() // Practiced recently, so NOT due for spaced review
    });

    const mockGraph: ConceptGraphInterface = {
      getPrerequisites: (id: string) => {
        if (id === 'c_target') return [{ id: '1', prerequisite_concept_id: 'c_prereq', minimum_mastery: 70 }];
        return [];
      },
      getDependents: () => [],
      checkPrerequisiteReadiness: () => ({ status: 'AVAILABLE', allPrerequisites: [] }),
      getFirstWeakPrerequisite: () => null
    };

    const candidates = service.getReviewCandidates([state], 'c_target', mockGraph);
    
    expect(candidates.length).toBe(1);
    expect(candidates[0].reason).toBe('PREREQUISITE_REMEDIATION');
    // Huge priority because it's blocking the active target
    expect(candidates[0].priorityScore).toBeGreaterThan(50);
  });
  
  it('High uncertainty triggers review even if not overdue', () => {
    const state = createState({
      last_attempt_at: new Date().toISOString(),
      uncertainty: 0.9 // very uncertain
    });
    
    const candidates = service.getReviewCandidates([state]);
    expect(candidates.length).toBe(1);
    expect(candidates[0].reason).toBe('UNCERTAINTY');
  });

  it('Calculates priority correctly', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const state = createState({ 
      last_attempt_at: tenDaysAgo,
      mastery_score: 75, // Borderline (20 pts)
      uncertainty: 0.5 // (10 pts)
    });
    
    // days overdue: 10 - 3 = 7. 7 * 10 = 70 (max 40 pts). 
    // Score should be 40 + 20 + 10 = 70
    
    const candidates = service.getReviewCandidates([state]);
    expect(candidates[0].priorityScore).toBe(70);
  });
});
