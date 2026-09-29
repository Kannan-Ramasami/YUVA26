/**
 * MOCK SERVICE LAYER (STAFF)
 * 
 * Defines strictly typed interfaces for the Staff Dashboard.
 * Later, this will be replaced with real backend calls aggregating
 * data from the adaptive engine across multiple students.
 */

export interface StaffOverviewStats {
  activeClassrooms: number;
  totalStudents: number;
  studentsNeedingAttention: number;
  recentInterventions: number;
}

export interface ClassroomSummary {
  id: string;
  name: string;
  subject: string;
  studentCount: number;
  joinCode: string;
  isActive: boolean;
}

export interface StudentInsightPreview {
  masteryDistribution: {
    mastered: number;
    developing: number;
    needsReview: number;
    struggling: number;
  };
  studentsProgressingCount: number;
  studentsStuckCount: number;
  lowMasteryConcepts: Array<{
    id: string;
    name: string;
    averageMastery: number;
    affectedStudents: number;
  }>;
}

export interface StaffDashboardData {
  overview: StaffOverviewStats;
  classrooms: ClassroomSummary[];
  insights: StudentInsightPreview;
}

export async function fetchStaffDashboardData(_staffId: string): Promise<StaffDashboardData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    overview: {
      activeClassrooms: 3,
      totalStudents: 78,
      studentsNeedingAttention: 5,
      recentInterventions: 12,
    },
    classrooms: [
      {
        id: 'cls_1',
        name: 'Algebra 101 - Fall',
        subject: 'Algebra',
        studentCount: 28,
        joinCode: 'ALG-F26-9X',
        isActive: true,
      },
      {
        id: 'cls_2',
        name: 'Intro to Geometry',
        subject: 'Geometry',
        studentCount: 25,
        joinCode: 'GEO-A14-4B',
        isActive: true,
      },
      {
        id: 'cls_3',
        name: 'Advanced Math Honors',
        subject: 'Pre-Calculus',
        studentCount: 25,
        joinCode: 'ADV-M88-2K',
        isActive: true,
      }
    ],
    insights: {
      masteryDistribution: {
        mastered: 45,
        developing: 30,
        needsReview: 15,
        struggling: 10,
      },
      studentsProgressingCount: 65,
      studentsStuckCount: 13,
      lowMasteryConcepts: [
        {
          id: 'c_991',
          name: 'Factoring Polynomials',
          averageMastery: 32,
          affectedStudents: 14,
        },
        {
          id: 'c_882',
          name: 'Pythagorean Theorem',
          averageMastery: 45,
          affectedStudents: 8,
        }
      ]
    }
  };
}
