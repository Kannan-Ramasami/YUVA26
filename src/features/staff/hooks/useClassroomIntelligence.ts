import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { StuckLearnerService, type StuckLearnerFlag } from '../services/stuckLearnerService';
import type { LearnerConceptState } from '../../../types/evidence';
import { PYTHON_CONCEPTS } from '../../diagnostic/data/pythonDiagnostic';

const stuckLearnerService = new StuckLearnerService();

export interface StudentProfile {
  id: string;
  name: string;
  states: LearnerConceptState[];
  flags: StuckLearnerFlag[];
  overallMastery: number;
}

export interface ConceptHotspot {
  conceptId: string;
  name: string;
  studentsBelowMastery: number;
  totalStudentsAssessed: number;
  percentageStruggling: number;
}

export interface ClassroomIntelligence {
  students: StudentProfile[];
  totalStudents: number;
  activeLearners: number; // Practiced in last 7 days
  studentsNeedingAttention: number;
  averageMastery: number;
  hotspots: ConceptHotspot[];
  conceptDistribution: Record<string, { MASTERED: number, DEVELOPING: number, REVIEW: number, NOT_ASSESSED: number }>;
}

export function useClassroomIntelligence(classroomId: string | undefined) {
  const [data, setData] = useState<ClassroomIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classroomName, setClassroomName] = useState<string>('');

  useEffect(() => {
    if (!classroomId) return;

    const load = async () => {
      setLoading(true);
      try {
        // 1. Get Classroom Name
        const { data: cData } = await supabase.from('classrooms').select('name').eq('id', classroomId).single();
        if (cData) setClassroomName(cData.name);

        // 2. Get students in this classroom
        const { data: studentIdsData, error: studentError } = await supabase
          .from('classroom_students')
          .select('student_id')
          .eq('classroom_id', classroomId);
        
        if (studentError) throw studentError;
        
        const studentIds = studentIdsData.map(s => s.student_id);

        if (studentIds.length === 0) {
           setData({
             students: [], totalStudents: 0, activeLearners: 0, studentsNeedingAttention: 0, averageMastery: 0, hotspots: [], conceptDistribution: {}
           });
           setLoading(false);
           return;
        }

        // 3. Get profiles for names
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', studentIds);

        // 4. Get all concept states for these students
        const { data: states } = await supabase.from('learner_concept_states').select('*').in('student_id', studentIds);
        
        const allStates = (states as LearnerConceptState[]) || [];

        // 5. Analyze flags globally
        const allFlags = stuckLearnerService.analyzeStates(allStates);

        // 6. Assemble Student Profiles
        let totalMasterySum = 0;
        let activeCount = 0;
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        const studentsList: StudentProfile[] = studentIds.map(sid => {
          const sStates = allStates.filter(s => s.student_id === sid);
          const sFlags = allFlags.filter(f => f.studentId === sid);
          
          let avgM = 0;
          if (sStates.length > 0) {
            avgM = sStates.reduce((acc, curr) => acc + (curr.mastery_score || 0), 0) / sStates.length;
            
            const hasRecent = sStates.some(s => s.last_attempt_at && (now - new Date(s.last_attempt_at).getTime() < sevenDays));
            if (hasRecent) activeCount++;
          }
          
          totalMasterySum += avgM;
          
          return {
            id: sid,
            name: profiles?.find(p => p.id === sid)?.full_name || 'Unknown Student',
            states: sStates,
            flags: sFlags,
            overallMastery: Math.round(avgM)
          };
        });

        // 7. Calculate Hotspots and Distribution
        const hotspots: ConceptHotspot[] = [];
        const distribution: Record<string, any> = {};

        PYTHON_CONCEPTS.forEach(concept => {
          const conceptStates = allStates.filter(s => s.concept_id === concept.id);
          const assessed = conceptStates.filter(s => s.status !== 'NOT_ASSESSED');
          const below = assessed.filter(s => s.mastery_score < 70);
          
          if (assessed.length > 0 && below.length / assessed.length > 0.4) {
             hotspots.push({
               conceptId: concept.id,
               name: concept.name,
               studentsBelowMastery: below.length,
               totalStudentsAssessed: assessed.length,
               percentageStruggling: Math.round((below.length / assessed.length) * 100)
             });
          }

          distribution[concept.id] = {
            MASTERED: conceptStates.filter(s => s.status === 'MASTERED').length,
            DEVELOPING: conceptStates.filter(s => s.status === 'DEVELOPING').length,
            REVIEW: conceptStates.filter(s => s.status === 'REVIEW').length,
            NOT_ASSESSED: studentIds.length - conceptStates.length
          };
        });

        hotspots.sort((a, b) => b.percentageStruggling - a.percentageStruggling);

        setData({
          students: studentsList.sort((a, b) => (b.flags.length - a.flags.length)), // Students with flags at top
          totalStudents: studentIds.length,
          activeLearners: activeCount,
          studentsNeedingAttention: studentsList.filter(s => s.flags.length > 0).length,
          averageMastery: Math.round(totalMasterySum / Math.max(1, studentIds.length)),
          hotspots,
          conceptDistribution: distribution
        });

      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [classroomId]);

  return { data, loading, error, classroomName };
}
