/**
 * MOCK SERVICE LAYER
 * 
 * This module acts as a temporary data provider for the Student Dashboard.
 * It strictly defines interfaces that the UI should consume. Later, this 
 * will be replaced by live calls to the actual Adaptive Engine endpoints.
 */

import type { Recommendation } from '../types';

export interface DashboardOverview {
  masteredCount: number;
  developingCount: number;
  needsReviewCount: number;
  lockedCount: number;
}

export interface CurrentLearningState {
  subject: string;
  conceptName: string;
  conceptId: string;
  masteryPercentage: number;
  recommendedAction: Recommendation;
}

export interface RecentActivityItem {
  id: string;
  conceptName: string;
  type: 'practice' | 'review' | 'assessment';
  masteryChange: number; // e.g. +5, -2
  timestamp: string;
  isCorrect: boolean;
}

export interface ReviewItem {
  conceptId: string;
  conceptName: string;
  subject: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface StudentDashboardData {
  overview: DashboardOverview;
  currentLearning: CurrentLearningState | null; // null represents an empty state (new student)
  todayRecommendation: Recommendation | null;
  recentActivity: RecentActivityItem[];
  needsReview: ReviewItem[];
  joinedClassroomsCount: number;
}

// -----------------------------------------------------------------------------
// MOCK DATA GENERATOR
// -----------------------------------------------------------------------------

export async function fetchStudentDashboardData(_studentId: string, isNewStudent = false): Promise<StudentDashboardData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  if (isNewStudent) {
    return {
      overview: { masteredCount: 0, developingCount: 0, needsReviewCount: 0, lockedCount: 120 },
      currentLearning: null,
      todayRecommendation: null,
      recentActivity: [],
      needsReview: [],
      joinedClassroomsCount: 0
    };
  }

  return {
    overview: {
      masteredCount: 42,
      developingCount: 15,
      needsReviewCount: 4,
      lockedCount: 89,
    },
    currentLearning: {
      subject: 'Algebra I',
      conceptName: 'Solving Linear Equations',
      conceptId: 'c_1029',
      masteryPercentage: 68,
      recommendedAction: {
        id: 'r_8821',
        pathId: 'p_111',
        conceptId: 'c_1029',
        recommendedAction: 'practice',
        reasoning: 'You have shown solid initial understanding, but need more practice to reach full mastery.',
        priorityScore: 0.95,
        isCompleted: false,
      }
    },
    todayRecommendation: {
      id: 'r_8822',
      pathId: 'p_111',
      conceptId: 'c_1015',
      recommendedAction: 'review',
      reasoning: 'Our spaced review engine indicates your memory of "Order of Operations" is likely decaying.',
      priorityScore: 0.98,
      isCompleted: false,
    },
    recentActivity: [
      {
        id: 'a_1',
        conceptName: 'Evaluating Expressions',
        type: 'practice',
        masteryChange: 8,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        isCorrect: true,
      },
      {
        id: 'a_2',
        conceptName: 'Variable Operations',
        type: 'practice',
        masteryChange: -2,
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        isCorrect: false,
      },
      {
        id: 'a_3',
        conceptName: 'Basic Arithmetic',
        type: 'review',
        masteryChange: 5,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        isCorrect: true,
      }
    ],
    needsReview: [
      {
        conceptId: 'c_1015',
        conceptName: 'Order of Operations',
        subject: 'Pre-Algebra',
        urgency: 'high'
      },
      {
        conceptId: 'c_1002',
        conceptName: 'Fractions to Decimals',
        subject: 'Arithmetic',
        urgency: 'medium'
      }
    ],
    joinedClassroomsCount: 1
  };
}
