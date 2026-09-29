/**
 * Explainability module
 * 
 * Responsible for translating the decisions made by the DecisionEngine
 * into human-readable explanations. Essential for the "Explain why that
 * action was selected" requirement.
 */

import type { Recommendation } from '../../../types';

export class ExplainabilityEngine {
  /**
   * Generates a plain-language explanation for a recommendation.
   */
  explainRecommendation(recommendation: Recommendation): string {
    // TODO: Implement explanation logic
    return recommendation.reasoning;
  }
}
