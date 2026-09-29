export interface ConceptPrerequisite {
  id: string;
  concept_id: string;
  prerequisite_concept_id: string;
  relationship_type: 'REQUIRED' | 'RECOMMENDED';
  minimum_mastery: number; // 0-100
}

export type ReadinessStatus = 'AVAILABLE' | 'BLOCKED' | 'MASTERED' | 'DEVELOPING' | 'NEEDS_REVIEW';

export interface PrerequisiteEvaluation {
  prerequisiteId: string;
  prerequisiteName: string;
  minimumMastery: number;
  currentMastery: number;
  isSatisfied: boolean;
}

export interface ReadinessResult {
  conceptId: string;
  status: ReadinessStatus;
  isReady: boolean;
  blockingPrerequisites: PrerequisiteEvaluation[];
  allPrerequisites: PrerequisiteEvaluation[];
  reason: string;
}
