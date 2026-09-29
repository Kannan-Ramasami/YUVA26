import { PYTHON_CONCEPTS } from '../../diagnostic/data/pythonDiagnostic';
import { PYTHON_PREREQUISITES } from '../data';
import type { ConceptPrerequisite, ReadinessResult, PrerequisiteEvaluation } from '../types';
import type { LearnerConceptState } from '../../../types/evidence';
import type { Concept } from '../../diagnostic/types';

export class CircularDependencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircularDependencyError';
  }
}

/**
 * Service to traverse and evaluate the Concept Dependency Graph.
 */
export const conceptGraphService = {
  getConcepts(): Concept[] {
    return PYTHON_CONCEPTS;
  },

  getPrerequisites(conceptId: string): ConceptPrerequisite[] {
    return PYTHON_PREREQUISITES.filter(p => p.concept_id === conceptId);
  },

  getDependents(conceptId: string): ConceptPrerequisite[] {
    return PYTHON_PREREQUISITES.filter(p => p.prerequisite_concept_id === conceptId);
  },

  /**
   * Detects if adding a new prerequisite would create a cycle.
   * Or validates the entire existing graph.
   */
  validateGraph(prerequisites = PYTHON_PREREQUISITES): boolean {
    const adjList = new Map<string, string[]>();
    
    // Build adjacency list (directed edges: concept -> prereq)
    for (const p of prerequisites) {
      if (!adjList.has(p.concept_id)) adjList.set(p.concept_id, []);
      adjList.get(p.concept_id)!.push(p.prerequisite_concept_id);
    }

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const prereqs = adjList.get(node) || [];
      for (const prereq of prereqs) {
        if (!visited.has(prereq) && hasCycle(prereq)) {
          return true;
        } else if (recursionStack.has(prereq)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of adjList.keys()) {
      if (!visited.has(node)) {
        if (hasCycle(node)) {
          throw new CircularDependencyError(`Circular dependency detected involving concept: ${node}`);
        }
      }
    }

    return true;
  },

  /**
   * Traces the first missing weak prerequisite in a chain.
   */
  getFirstWeakPrerequisite(conceptId: string, learnerStates: Record<string, LearnerConceptState> | LearnerConceptState[]): string | null {
    const prereqs = this.getPrerequisites(conceptId);
    
    const stateMap = Array.isArray(learnerStates)
      ? learnerStates.reduce((acc, s) => { acc[s.concept_id] = s; return acc; }, {} as Record<string, LearnerConceptState>)
      : learnerStates;

    for (const p of prereqs) {
      const state = stateMap[p.prerequisite_concept_id];
      const mastery = state ? state.mastery_score : 0;
      
      if (mastery < p.minimum_mastery) {
        // We found a weak prereq. Does IT have weak prereqs?
        const deeperWeak = this.getFirstWeakPrerequisite(p.prerequisite_concept_id, learnerStates);
        return deeperWeak || p.prerequisite_concept_id;
      }
    }
    
    return null;
  },

  /**
   * Evaluates if a concept is ready to be learned based on the learner's estimated mastery.
   */
  checkPrerequisiteReadiness(conceptId: string, learnerStates: Record<string, LearnerConceptState> | LearnerConceptState[]): ReadinessResult {
    const stateMap = Array.isArray(learnerStates)
      ? learnerStates.reduce((acc, s) => { acc[s.concept_id] = s; return acc; }, {} as Record<string, LearnerConceptState>)
      : learnerStates;

    const targetState = stateMap[conceptId];
    const prereqs = this.getPrerequisites(conceptId);
    
    const evaluations: PrerequisiteEvaluation[] = prereqs.map(p => {
      const pState = stateMap[p.prerequisite_concept_id];
      const pConcept = PYTHON_CONCEPTS.find(c => c.id === p.prerequisite_concept_id) || { name: p.prerequisite_concept_id.replace('concept_', '').replace(/_/g, ' ') };
      const currentMastery = pState ? pState.mastery_score : 0;
      
      return {
        prerequisiteId: p.prerequisite_concept_id,
        prerequisiteName: pConcept.name,
        minimumMastery: p.minimum_mastery,
        currentMastery,
        isSatisfied: currentMastery >= p.minimum_mastery
      };
    });

    const blocking = evaluations.filter(e => !e.isSatisfied);
    const isReady = blocking.length === 0;

    let status: ReadinessResult['status'] = 'AVAILABLE';
    let reason = 'Prerequisites satisfied.';

    if (!isReady) {
      status = 'BLOCKED';
      const blockNames = blocking.map(b => b.prerequisiteName).join(', ');
      reason = `Prerequisite mastery below threshold: ${blockNames}`;
    } else if (targetState) {
      // If ready, we can still show if they are currently working on it
      if (targetState.status === 'MASTERED') status = 'MASTERED';
      else if (targetState.status === 'DEVELOPING') status = 'DEVELOPING';
      else if (targetState.status === 'REVIEW') status = 'NEEDS_REVIEW';
    }

    return {
      conceptId,
      status,
      isReady,
      blockingPrerequisites: blocking,
      allPrerequisites: evaluations,
      reason
    };
  }
};
