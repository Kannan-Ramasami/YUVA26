import { supabase } from '../../../lib/supabase';
import { DecisionPolicy } from './policy';
import type { DecisionContext, AdaptiveAction, DecisionTrace } from './types';

export * from './types';
export * from './policy';

export class AdaptiveDecisionEngine {
  private policy = DecisionPolicy;

  /**
   * Evaluates the policy rules and returns the best action based on priority.
   */
  public getNextBestAction(context: DecisionContext): AdaptiveAction {
    const candidates: AdaptiveAction[] = [];

    // Evaluate all rules
    for (const rule of this.policy) {
      const action = rule.evaluate(context);
      if (action) {
        candidates.push(action);
      }
    }

    // Sort by priority descending
    candidates.sort((a, b) => b.priority - a.priority);

    // The first one is the highest priority action
    if (candidates.length > 0) {
      return candidates[0];
    }

    throw new Error('No valid action could be determined from the decision policy.');
  }

  /**
   * Stores a trace of the decision for debugging and explainability.
   */
  public async traceDecision(context: DecisionContext, action: AdaptiveAction, policyVersion: string = '1.0'): Promise<DecisionTrace> {
    const targetState = context.unified_state.concept_states[action.target_concept] 
      || context.unified_state.concept_states[context.target_concept];
      
    const trace: DecisionTrace = {
      ...action,
      topic_id: context.topic_id,
      learner_level: context.unified_state.overall_level,
      learner_level_confidence: context.unified_state.overall_level_confidence,
      model_version: context.unified_state.overall_level_model_version,
      concept_knowledge: targetState?.knowledge_probability || 0,
      prerequisite_states: Object.fromEntries(
        Object.entries(context.unified_state.concept_states)
          .map(([k, v]) => [k, v.knowledge_probability])
      ),
      recent_performance: context.unified_state.recent_accuracy,
      learning_velocity: context.unified_state.learning_velocity,
      policy_version: policyVersion,
      timestamp: new Date().toISOString()
    };
    
    // Persist to database (Phase 4 requirement)
    try {
      const { error } = await supabase.from('adaptive_decision_traces').insert({
        decision_id: trace.decision_id,
        student_id: trace.student_id,
        topic_id: trace.topic_id,
        target_concept_id: trace.target_concept,
        action: trace.action,
        reason: trace.reason,
        learner_level: trace.learner_level,
        learner_level_confidence: trace.learner_level_confidence,
        model_version: trace.model_version,
        concept_knowledge: trace.concept_knowledge,
        prerequisite_states: trace.prerequisite_states,
        recent_performance: trace.recent_performance,
        decision_timestamp: trace.timestamp,
        configuration_version: trace.policy_version
      });
      if (error) console.error('[Adaptive Engine] Failed to store decision trace:', error);
    } catch (e) {
      console.error('[Adaptive Engine] Trace persistence error:', e);
    }
    
    return trace;
  }
}
