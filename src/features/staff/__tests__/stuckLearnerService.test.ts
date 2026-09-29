import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StuckLearnerService } from '../services/stuckLearnerService';
import type { LearnerConceptState } from '../../../types/evidence';

describe('StuckLearnerService', () => {
  let service: StuckLearnerService;

  beforeEach(() => {
    service = new StuckLearnerService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createState = (overrides: Partial<LearnerConceptState>): LearnerConceptState => ({
    student_id: 's1',
    concept_id: 'c1',
    mastery_score: 50,
    confidence_score: 0.5,
    uncertainty: 0.2,
    attempt_count: 5,
    correct_count: 2,
    incorrect_count: 3,
    recent_correctness: 0.5,
    recent_response_time: 1000,
    recent_performance: [true, false],
    difficulty_exposure: {},
    hint_usage_count: 0,
    status: 'DEVELOPING',
    last_attempt_at: new Date().toISOString(),
    ...overrides
  });

  it('detects repeated failure', () => {
    const state = createState({
      attempt_count: 10,
      recent_correctness: 0.2
    });

    const flags = service.analyzeStates([state]);
    expect(flags.length).toBe(1);
    expect(flags[0].reason).toBe('REPEATED_FAILURE');
    expect(flags[0].severity).toBe('high');
  });

  it('detects high uncertainty', () => {
    const state = createState({
      attempt_count: 4,
      uncertainty: 0.9,
      recent_correctness: 0.5 // Keep correctness above threshold for failure
    });

    const flags = service.analyzeStates([state]);
    expect(flags.length).toBe(1);
    expect(flags[0].reason).toBe('HIGH_UNCERTAINTY');
    expect(flags[0].severity).toBe('medium');
  });

  it('detects stalled mastery', () => {
    const state = createState({
      attempt_count: 20,
      mastery_score: 60,
      recent_correctness: 0.4
    });

    const flags = service.analyzeStates([state]);
    expect(flags.length).toBe(1);
    expect(flags[0].reason).toBe('STALLED_MASTERY');
    expect(flags[0].severity).toBe('medium');
  });

  it('detects long inactivity', () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const state = createState({
      last_attempt_at: thirtyDaysAgo
    });

    const flags = service.analyzeStates([state]);
    expect(flags.length).toBe(1);
    expect(flags[0].reason).toBe('LONG_INACTIVITY');
    expect(flags[0].severity).toBe('low');
  });

  it('ignores mastered concepts', () => {
    const state = createState({
      status: 'MASTERED',
      attempt_count: 10,
      recent_correctness: 0.2 // Weird state, but if mastered, ignore
    });

    const flags = service.analyzeStates([state]);
    expect(flags.length).toBe(0);
  });
});
