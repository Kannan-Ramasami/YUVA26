/**
 * Spaced Review module
 * 
 * Responsible for scheduling reviews of previously mastered concepts
 * to combat the forgetting curve.
 */
import { ReviewService } from '../reviewEngine/reviewService';

// Expose the ReviewService as the engine for spaced review
export const SpacedReviewEngine = new ReviewService();
