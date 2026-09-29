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

    // Fallback if somehow no rule matches (shouldn't happen with Default Practice)
    throw new Error('No valid action could be determined from the decision policy.');
  }

  /**
   * Stores a trace of the decision for debugging and explainability.
   * In a real app, this would persist to a database.
   */
  public traceDecision(context: DecisionContext, action: AdaptiveAction, policyVersion: string = '1.0'): DecisionTrace {
    const trace: DecisionTrace = {
      ...action,
      input_state: {
        learner_state: context.learner_states[action.target_concept] || context.learner_states[context.target_concept],
        recent_attempts_count: context.recent_attempts.length,
        is_review_candidate: context.review_candidates?.includes(action.target_concept) || false,
        learning_context: context.learning_context
      },
      policy_version: policyVersion,
      timestamp: new Date().toISOString()
    };
    
    // TODO: Write to storage (e.g. Supabase `decision_traces` table)
    
    return trace;
  }
}
