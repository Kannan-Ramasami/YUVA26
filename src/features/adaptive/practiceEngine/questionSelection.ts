import type { Question } from '../../diagnostic/types';
import type { LearnerConceptState } from '../../../types/evidence';
import { ActionType } from '../decisionEngine/types';

export interface QuestionSelectionContext {
  targetConcept: string;
  learnerState: LearnerConceptState;
  currentAction: ActionType;
  attemptedQuestionIds: Set<string>;
}

export class QuestionSelectionEngine {
  /**
   * Selects the next best question from a bank based on the adaptive action.
   */
  public selectQuestion(
    bank: Question[],
    context: QuestionSelectionContext
  ): Question | null {
    // 1. Filter by target concept (or prerequisites if remediating, but context.targetConcept should be set to the prereq in that case by the decision engine)
    let candidates = bank.filter(q => q.concept_id === context.targetConcept);

    // 2. Filter out already attempted questions (unless we run out, then we fall back)
    const unattempted = candidates.filter(q => !context.attemptedQuestionIds.has(q.id));
    if (unattempted.length > 0) {
      candidates = unattempted;
    }

    if (candidates.length === 0) return null;

    // 3. Select based on current action & mastery
    switch (context.currentAction) {
      case ActionType.CHALLENGE:
        // Select harder questions
        return this.pickByDifficulty(candidates, ['hard', 'medium', 'easy']);
      
      case ActionType.REMEDIATE_PREREQUISITE:
        // Remediating a weak prereq -> start easy to rebuild confidence
        return this.pickByDifficulty(candidates, ['easy', 'medium', 'hard']);
      
      case ActionType.REVIEW:
        // Reviewing -> medium difficulty usually best for spacing effect recall
        return this.pickByDifficulty(candidates, ['medium', 'hard', 'easy']);
        
      case ActionType.PRACTICE:
      default:
        // Practice -> base on current mastery
        const mastery = context.learnerState.mastery_score || 0;
        if (mastery < 40) {
          return this.pickByDifficulty(candidates, ['easy', 'medium', 'hard']);
        } else if (mastery < 80) {
          return this.pickByDifficulty(candidates, ['medium', 'easy', 'hard']);
        } else {
          return this.pickByDifficulty(candidates, ['hard', 'medium', 'easy']);
        }
    }
  }

  private pickByDifficulty(candidates: Question[], preferenceOrder: string[]): Question {
    for (const diff of preferenceOrder) {
      const match = candidates.filter(q => q.difficulty === diff);
      if (match.length > 0) {
        // Randomly select one from the matching difficulty pool
        return match[Math.floor(Math.random() * match.length)];
      }
    }
    // Fallback if none match the exact strings (shouldn't happen if data is clean)
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
}
