export interface BKTConfig {
  initial_knowledge: number; // P(L0)
  learn_probability: number; // P(T)
  guess_probability: number; // P(G)
  slip_probability: number;  // P(S)
}

export const DEFAULT_BKT_CONFIG: BKTConfig = {
  initial_knowledge: 0.20,
  learn_probability: 0.15,
  guess_probability: 0.20,
  slip_probability: 0.10
};

export interface BKTUpdateResult {
  concept_id: string;
  knowledge_probability: number;
  previous_probability: number;
  updated: boolean;
}

/**
 * PHASE 2: Bayesian Knowledge Tracing (BKT) Service
 * 
 * BKT estimates the probability that a student has mastered a specific concept
 * based on their sequence of attempts. It maintains separate states per student+concept.
 */

export function initializeKnowledge(config: BKTConfig = DEFAULT_BKT_CONFIG): number {
  return config.initial_knowledge;
}

/**
 * Updates the knowledge probability using standard BKT equations.
 */
export function updateKnowledge(
  previous_knowledge: number,
  correctness: boolean,
  config: BKTConfig = DEFAULT_BKT_CONFIG
): number {
  const { learn_probability: pT, guess_probability: pG, slip_probability: pS } = config;

  let pK_given_obs: number;

  if (correctness) {
    // P(correct | known) = 1 - P(S)
    // P(correct | unknown) = P(G)
    // P(K | correct) = (P(K) * (1 - P(S))) / (P(K) * (1 - P(S)) + (1 - P(K)) * P(G))
    const num = previous_knowledge * (1 - pS);
    const den = num + (1 - previous_knowledge) * pG;
    // Protect against division by zero in edge cases
    pK_given_obs = den > 0 ? num / den : 0;
  } else {
    // P(incorrect | known) = P(S)
    // P(incorrect | unknown) = 1 - P(G)
    // P(K | incorrect) = (P(K) * P(S)) / (P(K) * P(S) + (1 - P(K)) * (1 - P(G)))
    const num = previous_knowledge * pS;
    const den = num + (1 - previous_knowledge) * (1 - pG);
    pK_given_obs = den > 0 ? num / den : 0;
  }

  // Learning transition: P(K_after_learning) = P(K|obs) + (1 - P(K|obs)) * P(T)
  const newKnowledge = pK_given_obs + (1 - pK_given_obs) * pT;

  return newKnowledge;
}

/**
 * Recalculates concept knowledge from a complete chronologically ordered attempt history.
 */
export function recalculateConceptKnowledge(
  attempts: { correctness: boolean }[],
  config: BKTConfig = DEFAULT_BKT_CONFIG
): number {
  let pKnowledge = initializeKnowledge(config);

  for (const attempt of attempts) {
    pKnowledge = updateKnowledge(pKnowledge, attempt.correctness, config);
  }

  return pKnowledge;
}

/**
 * Processes a new student attempt, calculates the new BKT probability,
 * and returns the API boundary structure. 
 * Note: Database saving is handled by existing evidence engine, this just calculates.
 */
export function processAttemptBKT(
  concept_id: string,
  previous_knowledge: number | null | undefined,
  correctness: boolean,
  config: BKTConfig = DEFAULT_BKT_CONFIG
): BKTUpdateResult {
  
  const pKnowledge = previous_knowledge ?? initializeKnowledge(config);
  const newKnowledge = updateKnowledge(pKnowledge, correctness, config);
  
  return {
    concept_id,
    previous_probability: pKnowledge,
    knowledge_probability: newKnowledge,
    updated: true
  };
}
