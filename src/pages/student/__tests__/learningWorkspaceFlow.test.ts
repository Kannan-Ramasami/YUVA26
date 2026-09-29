import { describe, it, expect } from 'vitest';
import { MasteryEngine } from '../../../features/adaptive/masteryEngine';
import { AdaptiveDecisionEngine } from '../../../features/adaptive/decisionEngine';
import { conceptGraphService } from '../../../features/graph/services/conceptGraphService';
import { ActionType } from '../../../features/adaptive/decisionEngine/types';
import type { LearnerConceptState, QuestionAttempt } from '../../../types/evidence';
import type { Question } from '../../../features/diagnostic/types';

describe('Learning Workspace Integrated Flow', () => {
  it('Simulates a complete learning loop and verifies mastery updates -> adaptive decisions', () => {
    // 1. Initial State Setup
    const masteryEngine = new MasteryEngine();
    const decisionEngine = new AdaptiveDecisionEngine();
    const studentId = 'student-loop-test';
    
    // Starting with loops, initially weak
    let loopsState: LearnerConceptState = {
      student_id: studentId,
      concept_id: 'c_py_loop',
      knowledge_probability: 0.3,
      mastery_score: 30,
      confidence_score: 0.5,
      uncertainty: 0.6,
      attempt_count: 5,
      correct_count: 1,
      incorrect_count: 4,
      recent_correctness: 0.2,
      recent_response_time: 15000,
      recent_performance: [false, false, true, false, false],
      difficulty_exposure: { 'easy': 5 },
      hint_usage_count: 3,
      status: 'NEEDS_REMEDIATION'
    };

    // All states for context
    let allStates = [
      loopsState,
      {
        student_id: studentId,
        concept_id: 'c_py_cond', // Prereq for loops
        knowledge_probability: 0.85,
        mastery_score: 85,
        confidence_score: 0.8,
        uncertainty: 0.2,
        attempt_count: 10,
        correct_count: 8,
        incorrect_count: 2,
        recent_correctness: 0.9,
        recent_response_time: 10000,
        recent_performance: [true, true, true, false, true, true],
        difficulty_exposure: { 'medium': 10 },
        hint_usage_count: 0,
        status: 'MASTERED'
      } as LearnerConceptState
    ];

    // 2. Student takes a lesson and attempts a question
    const mockQuestion: Question = {
      id: 'q_loop_test',
      concept_id: 'c_py_loop',
      type: 'multiple_choice',
      difficulty: 'medium',
      text: 'Which loop is best when you know exactly how many times you want to execute a statement?',
      options: ['while', 'for', 'do-while'],
      correct_answer: 'for'
    };

    // The student answers correctly
    const attempt: QuestionAttempt = {
      id: 'attempt-123',
      student_id: studentId,
      concept_id: mockQuestion.concept_id,
      question_id: mockQuestion.id,
      correctness: true, // Got it right!
      difficulty: mockQuestion.difficulty as any,
      response_time_ms: 8000, // Fast response
      confidence: 0.8,
      hint_used: false,
      attempt_number: 1,
      source: 'practice',
      timestamp: new Date().toISOString()
    };

    // 3. Evidence flows to Mastery Engine
    const { newState } = masteryEngine.updateMastery(loopsState, attempt);
    
    // Verify mastery updated correctly
    expect(newState.mastery_score).toBeGreaterThan(loopsState.mastery_score);
    expect(newState.attempt_count).toBe(loopsState.attempt_count + 1);
    expect(newState.correct_count).toBe(loopsState.correct_count + 1);
    expect(newState.recent_performance.slice(-1)[0]).toBe(true);

    // Update our states collection
    allStates = allStates.map(s => s.concept_id === newState.concept_id ? newState : s);

    // 4. State flows to Adaptive Decision Engine
    const stateMap = allStates.reduce((acc, s) => {
      acc[s.concept_id] = { ...s, knowledge_probability: s.mastery_score / 100 };
      return acc;
    }, {} as Record<string, LearnerConceptState>);

    const nextAction = decisionEngine.getNextBestAction({
      student_id: studentId,
      topic_id: 'sub_python',
      target_concept: 'c_py_loop',
      learning_context: 'individual',
      concept_graph: {
        getPrerequisites: conceptGraphService.getPrerequisites,
        getDependents: conceptGraphService.getDependents,
        checkPrerequisiteReadiness: conceptGraphService.checkPrerequisiteReadiness,
        getFirstWeakPrerequisite: conceptGraphService.getFirstWeakPrerequisite.bind(conceptGraphService)
      },
      unified_state: {
        student_id: studentId,
        topic_id: 'sub_python',
        overall_level: 'BEGINNER',
        overall_level_confidence: 0.8,
        overall_level_model_version: 'test-1.0',
        recent_accuracy: 0.5,
        recent_activity_at: null,
        learning_velocity: null,
        concept_states: stateMap
      },
      recent_attempts: [attempt],
      review_candidates: []
    });

    // Verify adaptive recommendation
    expect(nextAction).toBeDefined();
    
    // Because they were struggling but got one right, they shouldn't immediately advance.
    // They probably need more practice.
    expect(nextAction.action).toBe(ActionType.PRACTICE);
    expect(nextAction.reason).toContain('additional practice is recommended');
    
    // Complete flow verified: attempt -> mastery engine -> state -> decision engine -> recommendation
  });
});
