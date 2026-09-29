import { supabase } from '../lib/supabase';
import type { QuestionAttempt } from '../types/evidence';
import { recalculateConceptKnowledge, DEFAULT_BKT_CONFIG } from './bktService';
import { conceptGraphService } from '../features/graph/services/conceptGraphService';

export interface MLFeatureSet {
  overall_accuracy: number;
  easy_accuracy: number;
  medium_accuracy: number;
  hard_accuracy: number;
  average_response_time: number;
  median_response_time: number;
  average_attempts: number;
  hint_usage_rate: number;
  recent_accuracy: number;
  question_count: number;
  concept_count: number;
  average_bkt_knowledge: number;
  minimum_bkt_knowledge: number;
  maximum_bkt_knowledge: number;
  prerequisite_mastery: number;
  knowledge_variance: number;
  recent_bkt_change: number;
  diagnostic_accuracy: number;
  diagnostic_question_count: number;
}

/**
 * PHASE 3 ML FOUNDATION: Feature Generation Service
 * Converts raw diagnostic and practice attempts + BKT into ML-ready feature vectors.
 */
export async function buildStudentFeatures(studentId: string, _topicId?: string): Promise<MLFeatureSet> {
  // Query all attempts, not just diagnostic
  let query = supabase.from('question_attempts').select('*').eq('student_id', studentId);
  // topicId filtering is trickier without a topic_id column on question_attempts, 
  // but if we assume all attempts are within the python topic for now:
  // if (topicId) query = query.eq('topic_id', topicId); // Removed for now to avoid errors if missing
  
  const { data: attempts, error } = await query;
  
  if (error || !attempts || attempts.length === 0) {
    return _getEmptyFeatures();
  }
  
  return _calculateFeatures(attempts as QuestionAttempt[]);
}

function _calculateFeatures(attempts: QuestionAttempt[]): MLFeatureSet {
  const total = attempts.length;
  const sorted = [...attempts].sort((a, b) => 
    new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
  );
  
  // Accuracy Breakdowns
  const correctAttempts = attempts.filter(a => a.correctness);
  const easyAttempts = attempts.filter(a => a.difficulty === 'easy');
  const mediumAttempts = attempts.filter(a => a.difficulty === 'medium');
  const hardAttempts = attempts.filter(a => a.difficulty === 'hard');
  
  const overall_accuracy = total > 0 ? correctAttempts.length / total : 0;
  const easy_accuracy = easyAttempts.length ? easyAttempts.filter(a => a.correctness).length / easyAttempts.length : 0;
  const medium_accuracy = mediumAttempts.length ? mediumAttempts.filter(a => a.correctness).length / mediumAttempts.length : 0;
  const hard_accuracy = hardAttempts.length ? hardAttempts.filter(a => a.correctness).length / hardAttempts.length : 0;
  
  // Timing
  // We divide by 1000 to convert MS to seconds for the ML model
  const responseTimesSec = attempts.map(a => a.response_time_ms / 1000).sort((a, b) => a - b);
  const average_response_time = total > 0 ? responseTimesSec.reduce((acc, t) => acc + t, 0) / total : 0;
  const median_response_time = total > 0 ? responseTimesSec[Math.floor(total / 2)] : 0;
  
  // Retry Behavior
  const uniqueQuestions = new Set(attempts.map(a => a.question_id));
  const average_attempts = uniqueQuestions.size > 0 ? total / uniqueQuestions.size : 1;
  
  // Hint Usage
  const hint_usage_rate = total > 0 ? attempts.filter(a => a.hint_used).length / total : 0;
  
  // Recent Accuracy (last 5)
  const recent = sorted.slice(-5);
  const recent_accuracy = recent.length > 0 ? recent.filter(a => a.correctness).length / recent.length : 0;
  
  // Counts
  const question_count = total;
  
  // Concept Grouping for BKT
  const conceptGroups = attempts.reduce((acc, a) => {
    if (!acc[a.concept_id]) acc[a.concept_id] = [];
    acc[a.concept_id].push(a);
    return acc;
  }, {} as Record<string, QuestionAttempt[]>);
  
  const concept_count = Object.keys(conceptGroups).length;
  
  // Calculate BKT Knowledge per concept
  const bktScores: number[] = [];
  let recent_bkt_change = 0;

  for (const [_conceptId, atts] of Object.entries(conceptGroups)) {
    // Sort this concept's attempts chronologically
    const conceptSorted = [...atts].sort((a, b) => 
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );
    const bktAttempts = conceptSorted.map(a => ({ correctness: a.correctness }));
    const finalKnowledge = recalculateConceptKnowledge(bktAttempts, DEFAULT_BKT_CONFIG);
    bktScores.push(finalKnowledge);

    // Calculate recent change for this concept if there are multiple attempts
    if (bktAttempts.length > 1) {
      const prevKnowledge = recalculateConceptKnowledge(bktAttempts.slice(0, -1), DEFAULT_BKT_CONFIG);
      // Aggregate the net change across concepts
      recent_bkt_change += (finalKnowledge - prevKnowledge);
    }
  }

  // BKT Aggregations
  const average_bkt_knowledge = bktScores.length > 0 ? bktScores.reduce((a, b) => a + b, 0) / bktScores.length : 0;
  const minimum_bkt_knowledge = bktScores.length > 0 ? Math.min(...bktScores) : 0;
  const maximum_bkt_knowledge = bktScores.length > 0 ? Math.max(...bktScores) : 0;
  
  // Variance
  const knowledge_variance = bktScores.length > 1 
    ? bktScores.reduce((sq, n) => sq + Math.pow(n - average_bkt_knowledge, 2), 0) / (bktScores.length - 1)
    : 0;
    
  // Normalize recent change by concept count
  recent_bkt_change = concept_count > 0 ? recent_bkt_change / concept_count : 0;

  // Prerequisite Mastery 
  // Calculate average mastery of all prerequisites for the concepts the student attempted
  const prereqScores: number[] = [];
  const uniqueAttemptedConcepts = Object.keys(conceptGroups);
  
  for (const cid of uniqueAttemptedConcepts) {
    const prereqs = conceptGraphService.getPrerequisites(cid);
    for (const p of prereqs) {
       // If the student has BKT for this prereq, add it
       const pAtts = conceptGroups[p.prerequisite_concept_id];
       if (pAtts) {
          const pBkt = recalculateConceptKnowledge(pAtts.map(a => ({ correctness: a.correctness })), DEFAULT_BKT_CONFIG);
          prereqScores.push(pBkt);
       }
    }
  }
  
  const prerequisite_mastery = prereqScores.length > 0 
    ? prereqScores.reduce((a, b) => a + b, 0) / prereqScores.length 
    : average_bkt_knowledge * 0.9; // Fallback if no prereqs attempted

  // Diagnostic Stats 
  const diagnosticAttempts = attempts.filter(a => a.source === 'diagnostic');
  const diagnostic_accuracy = diagnosticAttempts.length > 0 
    ? diagnosticAttempts.filter(a => a.correctness).length / diagnosticAttempts.length 
    : overall_accuracy;
  const diagnostic_question_count = diagnosticAttempts.length > 0 ? diagnosticAttempts.length : total;

  return {
    overall_accuracy,
    easy_accuracy,
    medium_accuracy,
    hard_accuracy,
    average_response_time,
    median_response_time,
    average_attempts,
    hint_usage_rate,
    recent_accuracy,
    question_count,
    concept_count,
    average_bkt_knowledge,
    minimum_bkt_knowledge,
    maximum_bkt_knowledge,
    prerequisite_mastery,
    knowledge_variance,
    recent_bkt_change,
    diagnostic_accuracy,
    diagnostic_question_count
  };
}

function _getEmptyFeatures(): MLFeatureSet {
  return {
    overall_accuracy: 0,
    easy_accuracy: 0,
    medium_accuracy: 0,
    hard_accuracy: 0,
    average_response_time: 0,
    median_response_time: 0,
    average_attempts: 1,
    hint_usage_rate: 0,
    recent_accuracy: 0,
    question_count: 0,
    concept_count: 0,
    average_bkt_knowledge: 0,
    minimum_bkt_knowledge: 0,
    maximum_bkt_knowledge: 0,
    prerequisite_mastery: 0,
    knowledge_variance: 0,
    recent_bkt_change: 0,
    diagnostic_accuracy: 0,
    diagnostic_question_count: 0
  };
}
