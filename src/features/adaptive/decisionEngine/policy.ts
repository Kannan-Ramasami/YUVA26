import { ActionType, type DecisionContext, type AdaptiveAction } from './types';

export interface PolicyRule {
  name: string;
  evaluate: (context: DecisionContext) => AdaptiveAction | null;
}

export const DecisionPolicy: PolicyRule[] = [
  // 1. Weak prerequisite check
  {
    name: 'Check Weak Prerequisites',
    evaluate: (context) => {
      const states = Object.values(context.learner_states);
      const weakPrereq = context.concept_graph.getFirstWeakPrerequisite(context.target_concept, states);
      
      if (weakPrereq) {
        const prereqState = context.learner_states[weakPrereq];
        const masteryScore = prereqState ? prereqState.mastery_score : 0;
        
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.REMEDIATE_PREREQUISITE,
          target_concept: weakPrereq,
          priority: 100, // Highest priority to fix blockers
          reason: `Review ${weakPrereq} before continuing to ${context.target_concept}. Mastery is estimated at ${masteryScore}%, below the required threshold.`,
          evidence: { mastery_score: masteryScore },
          confidence: 0.9,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 2. Classroom scope check
  {
    name: 'Classroom Scope Constraint',
    evaluate: (context) => {
      if (context.learning_context === 'classroom' && context.classroom_constraints) {
        if (!context.classroom_constraints.scope_concepts.includes(context.target_concept)) {
          return {
            decision_id: crypto.randomUUID(),
            student_id: context.student_id,
            action: ActionType.TEACHER_INTERVENTION,
            target_concept: context.target_concept,
            priority: 90,
            reason: `Concept ${context.target_concept} is currently outside the classroom scope. Wait for teacher instructions.`,
            evidence: { out_of_scope: true },
            confidence: 1.0,
            created_at: new Date().toISOString()
          };
        }
      }
      return null;
    }
  },

  // 3. Repeated struggles check
  {
    name: 'Repeated Struggles Intervention',
    evaluate: (context) => {
      const state = context.learner_states[context.target_concept];
      if (state && state.attempt_count > 10 && state.mastery_score < 40 && state.recent_correctness < 0.3) {
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.TEACHER_INTERVENTION,
          target_concept: context.target_concept,
          priority: 85,
          reason: `You have struggled with ${context.target_concept} repeatedly. A teacher will help you understand the core concepts better.`,
          evidence: { attempt_count: state.attempt_count, mastery_score: state.mastery_score },
          confidence: 0.95,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 4. Review requirement check
  {
    name: 'Spaced Review Check',
    evaluate: (context) => {
      if (context.review_candidates && context.review_candidates.includes(context.target_concept)) {
        const state = context.learner_states[context.target_concept];
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.REVIEW,
          target_concept: context.target_concept,
          priority: 80,
          reason: `Review ${context.target_concept}. Your previous mastery was strong, but recent evidence suggests increased uncertainty or forgetting over time.`,
          evidence: { mastery_score: state?.mastery_score, uncertainty: state?.uncertainty },
          confidence: 0.8,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 5. Challenge if highly confident and strong
  {
    name: 'Challenge Mode',
    evaluate: (context) => {
      const state = context.learner_states[context.target_concept];
      if (state && state.status === 'MASTERED' && state.mastery_score > 90 && state.uncertainty < 0.2) {
        // Only if they haven't been struggling recently
        if (state.recent_correctness > 0.8) {
           // Verify they didn't just guess (e.g. no heavy hint usage)
           if (state.hint_usage_count < state.attempt_count * 0.1) {
             return {
               decision_id: crypto.randomUUID(),
               student_id: context.student_id,
               action: ActionType.CHALLENGE,
               target_concept: context.target_concept,
               priority: 75,
               reason: `Challenge yourself with a harder ${context.target_concept} problem. Your estimated mastery is ${state.mastery_score}% with low uncertainty.`,
               evidence: { mastery_score: state.mastery_score, uncertainty: state.uncertainty },
               confidence: 0.9,
               created_at: new Date().toISOString()
             };
           }
        }
      }
      return null;
    }
  },

  // 6. Advance if mastered
  {
    name: 'Advance Check',
    evaluate: (context) => {
      const state = context.learner_states[context.target_concept];
      if (state && (state.status === 'MASTERED' || state.mastery_score >= 80)) {
        // Find next concept
        const dependents = context.concept_graph.getDependents(context.target_concept);
        let nextConcept = dependents.length > 0 ? dependents[0].concept_id : context.target_concept; // Fallback to current if no dependents
        
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.ADVANCE,
          target_concept: nextConcept,
          priority: 70,
          reason: `You have mastered ${context.target_concept} with ${state.mastery_score}% score. You are ready to advance to new topics.`,
          evidence: { mastery_score: state.mastery_score },
          confidence: 0.85,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 7. Default to practice
  {
    name: 'Default Practice',
    evaluate: (context) => {
      const state = context.learner_states[context.target_concept];
      const mastery = state ? state.mastery_score : 0;
      return {
        decision_id: crypto.randomUUID(),
        student_id: context.student_id,
        action: ActionType.PRACTICE,
        target_concept: context.target_concept,
        priority: 10, // Lowest priority, fallback
        reason: `Practice ${context.target_concept} to build your mastery and consistency. Current mastery is ${mastery}%.`,
        evidence: { mastery_score: mastery },
        confidence: 0.5,
        created_at: new Date().toISOString()
      };
    }
  }
];
