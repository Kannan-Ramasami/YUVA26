import { ActionType, type DecisionContext, type AdaptiveAction } from './types';

export interface PolicyRule {
  name: string;
  evaluate: (context: DecisionContext) => AdaptiveAction | null;
}

const PREREQUISITE_MASTERY_THRESHOLD = 0.70;

export const DecisionPolicy: PolicyRule[] = [
  // 1. Weak prerequisite check
  {
    name: 'Check Weak Prerequisites',
    evaluate: (context) => {
      const states = context.unified_state.concept_states;
      // getFirstWeakPrerequisite returns the id of the first prereq below its required threshold (or our default)
      const weakPrereq = context.concept_graph.getFirstWeakPrerequisite(context.target_concept, states);
      
      if (weakPrereq) {
        const prereqState = states[weakPrereq];
        // Ensure we fall back gracefully if missing
        const knowledgeProb = prereqState?.knowledge_probability ?? 0;
        
        // If it's truly below the threshold, remediate
        if (knowledgeProb < PREREQUISITE_MASTERY_THRESHOLD) {
          return {
            decision_id: crypto.randomUUID(),
            student_id: context.student_id,
            action: ActionType.REMEDIATE_PREREQUISITE,
            target_concept: weakPrereq,
            priority: 100,
            reason: `Practice ${weakPrereq} first because it is a prerequisite for the selected ${context.target_concept} concept and current evidence indicates weak prerequisite knowledge (BKT: ${Math.round(knowledgeProb * 100)}%).`,
            evidence: { knowledge_probability: knowledgeProb, prerequisite_concept_id: weakPrereq },
            confidence: 0.9,
            created_at: new Date().toISOString()
          };
        }
      }
      return null;
    }
  },

  // 1.5 Classroom scope check
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
            priority: 98,
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

  // 2. Teacher Intervention (Repeated struggles)
  {
    name: 'Repeated Struggles Intervention',
    evaluate: (context) => {
      const state = context.unified_state.concept_states[context.target_concept];
      if (state && state.attempt_count > 15 && state.knowledge_probability < 0.4 && state.recent_correctness < 0.3) {
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.TEACHER_INTERVENTION,
          target_concept: context.target_concept,
          priority: 95,
          reason: `Teacher review recommended because the learner has repeatedly attempted this concept without sufficient improvement across the stored evidence.`,
          evidence: { attempt_count: state.attempt_count, knowledge_probability: state.knowledge_probability },
          confidence: 0.95,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 3. Spaced Review Check
  {
    name: 'Spaced Review Check',
    evaluate: (context) => {
      if (context.review_candidates && context.review_candidates.includes(context.target_concept)) {
        const state = context.unified_state.concept_states[context.target_concept];
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.REVIEW,
          target_concept: context.target_concept,
          priority: 90,
          reason: `The learner previously demonstrated this concept but has not practiced it recently.`,
          evidence: { knowledge_probability: state?.knowledge_probability, last_attempt_at: state?.last_attempt_at },
          confidence: 0.85,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 4. Challenge Mode
  {
    name: 'Challenge Mode',
    evaluate: (context) => {
      const state = context.unified_state.concept_states[context.target_concept];
      // Only challenge if they have strong BKT, strong recent performance, and a high ML learner level
      const isHighLevel = ['INTERMEDIATE', 'ADVANCED'].includes(context.unified_state.overall_level);
      
      if (state && state.knowledge_probability > 0.85 && state.recent_correctness > 0.8 && isHighLevel) {
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.CHALLENGE,
          target_concept: context.target_concept,
          priority: 85,
          reason: `Recent performance is consistently strong and prerequisites are ready for increased difficulty.`,
          evidence: { 
            knowledge_probability: state.knowledge_probability, 
            learner_level: context.unified_state.overall_level,
            recent_accuracy: context.unified_state.recent_accuracy
          },
          confidence: 0.9,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 5. Advance
  {
    name: 'Advance Check',
    evaluate: (context) => {
      const state = context.unified_state.concept_states[context.target_concept];
      // Need sufficient attempts to prevent single-lucky-guess advancement
      if (state && state.knowledge_probability >= 0.80 && state.attempt_count >= 3 && state.recent_correctness >= 0.7) {
        const dependents = context.concept_graph.getDependents(context.target_concept);
        const nextConcept = dependents.length > 0 ? dependents[0].concept_id : context.target_concept;
        
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.ADVANCE,
          target_concept: nextConcept,
          priority: 80,
          reason: `Prerequisites are ready and recent performance shows strong evidence of concept mastery (BKT: ${Math.round(state.knowledge_probability * 100)}%).`,
          evidence: { knowledge_probability: state.knowledge_probability, attempt_count: state.attempt_count },
          confidence: 0.85,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 6. Insufficient Evidence Default (Early stages)
  {
    name: 'Insufficient Evidence Practice',
    evaluate: (context) => {
      const state = context.unified_state.concept_states[context.target_concept];
      if (!state || state.attempt_count < 3) {
        return {
          decision_id: crypto.randomUUID(),
          student_id: context.student_id,
          action: ActionType.PRACTICE,
          target_concept: context.target_concept,
          priority: 50,
          reason: `Current evidence is insufficient for confident advancement; additional practice will establish your knowledge state.`,
          evidence: { attempt_count: state?.attempt_count || 0 },
          confidence: 0.6,
          created_at: new Date().toISOString()
        };
      }
      return null;
    }
  },

  // 7. Default Developing Practice
  {
    name: 'Default Practice',
    evaluate: (context) => {
      const state = context.unified_state.concept_states[context.target_concept];
      const knowledge = state ? state.knowledge_probability : 0;
      return {
        decision_id: crypto.randomUUID(),
        student_id: context.student_id,
        action: ActionType.PRACTICE,
        target_concept: context.target_concept,
        priority: 10, // Fallback
        reason: `Current concept knowledge is developing (BKT: ${Math.round(knowledge * 100)}%), so additional practice is recommended before progression.`,
        evidence: { knowledge_probability: knowledge, learner_velocity: context.unified_state.learning_velocity },
        confidence: 0.7,
        created_at: new Date().toISOString()
      };
    }
  }
];
