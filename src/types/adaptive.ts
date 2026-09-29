export interface Concept {
  id: string;
  name: string;
  description: string;
  subject: string;
  domain: string;
  difficultyLevel: number;
}

export interface ConceptPrerequisite {
  id: string;
  conceptId: string;
  prerequisiteConceptId: string;
  isRequired: boolean;
  strength: number; // 0 to 1
}

export interface DiagnosticSession {
  id: string;
  studentId: string;
  subject: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  initialMasteryEstimate: Record<string, number>;
}

export interface Question {
  id: string;
  conceptId: string;
  type: 'multiple_choice' | 'free_response' | 'interactive';
  content: string; // Can be JSON or markdown
  metadata: Record<string, any>;
  difficulty: number;
  options?: any[]; // For multiple choice
}

export interface QuestionAttempt {
  id: string;
  studentId: string;
  questionId: string;
  sessionId?: string; // Optional context, e.g., diagnostic or regular practice
  startedAt: string;
  completedAt: string;
  timeSpentSeconds: number;
  isCorrect: boolean;
  score: number; // 0 to 1
  learnerResponse: any;
  hintsUsed: number;
}

export interface LearnerConceptState {
  id: string;
  studentId: string;
  conceptId: string;
  masteryLevel: number; // 0 to 1
  confidence: number; // 0 to 1, indicating certainty of the mastery estimate
  lastAttemptAt?: string;
  attemptsCount: number;
  spacedReviewDueDate?: string;
}

export interface LearningPath {
  id: string;
  studentId: string;
  targetConceptId?: string;
  generatedAt: string;
  status: 'active' | 'completed' | 'superseded';
  steps: Recommendation[];
}

export interface Recommendation {
  id: string;
  pathId: string;
  conceptId: string;
  recommendedAction: 'practice' | 'review' | 'learn_new' | 'remediate';
  reasoning: string; // Explanation of why this was chosen
  priorityScore: number;
  isCompleted: boolean;
}

export interface TeacherOverride {
  id: string;
  teacherId: string;
  studentId: string;
  conceptId: string;
  previousMastery: number;
  newMastery: number;
  reason: string;
  appliedAt: string;
}

export interface Intervention {
  id: string;
  studentId: string;
  classroomId: string;
  teacherId: string;
  type: 'struggling_concept' | 'inactivity' | 'gaming_system';
  description: string;
  status: 'identified' | 'action_taken' | 'resolved';
  identifiedAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  entityType: 'mastery_update' | 'recommendation' | 'teacher_override' | 'system_action';
  entityId: string;
  actorId: string; // User or System
  action: string;
  details: Record<string, any>;
  timestamp: string;
}
