export type Role = 'student' | 'staff';

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  gradeLevel?: number;
  learningPreferences?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface StaffProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  joinCode: string;
  teacherId: string; // References StaffProfile.id
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomMember {
  id: string;
  classroomId: string;
  studentId: string; // References StudentProfile.id
  joinedAt: string;
}
