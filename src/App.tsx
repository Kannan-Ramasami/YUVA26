import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { StaffLayout } from './layouts/StaffLayout';
import { SetupLayout } from './layouts/SetupLayout';
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { CreateClassroom } from './pages/staff/CreateClassroom';
import { StaffClassroomDetail } from './pages/staff/ClassroomDetail';
import { StaffStudentProfile } from './pages/staff/StudentProfile';
import { StaffClassrooms, StaffInterventions } from './pages/staff/Placeholders';
import { StaffAnalytics } from './pages/staff/StaffAnalytics';
import { StudentClassroomDetail } from './pages/student/ClassroomDetail';
import { JoinClassroom } from './pages/student/JoinClassroom';
import { IndividualLearningSetup } from './pages/student/IndividualLearningSetup';
import { StudentClassrooms } from './pages/student/StudentClassrooms';
import { StartDiagnostic } from './features/diagnostic/pages/StartDiagnostic';
import { DiagnosticSession } from './features/diagnostic/pages/DiagnosticSession';
import { DiagnosticResult } from './features/diagnostic/pages/DiagnosticResult';
import { MyMastery } from './pages/student/MyMastery';
import { LearningPlan } from './pages/student/LearningPlan';
import { ReviewCenter } from './pages/student/ReviewCenter';
import { LearningWorkspace } from './pages/student/LearningWorkspace';
import { ConceptGraph as StudentConceptGraph } from './pages/student/ConceptGraph';
import { StaffConceptGraph } from './pages/staff/ConceptGraph';
import { DemoComparison } from './pages/demo/AdaptiveComparison';
import { EvaluationSuite } from './pages/admin/EvaluationSuite';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { StudentPanel } from './pages/student/StudentPanel';
import { MentorPanel } from './pages/staff/MentorPanel';
import { ModeSelection } from './pages/student/ModeSelection';
import { ClassSelection } from './pages/staff/ClassSelection';
import { JoinClass } from './pages/staff/JoinClass';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="student" element={<StudentPanel />} />
            <Route path="mentor" element={<MentorPanel />} />
            <Route path="student/login" element={<Login role="student" />} />
            <Route path="student/register" element={<Register role="student" />} />
            <Route path="staff/login" element={<Login role="staff" />} />
            <Route path="staff/register" element={<Register role="staff" />} />
            <Route path="demo/adaptive-comparison" element={<DemoComparison />} />
          </Route>

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute allowedRole="student" />}>
            {/* Fullscreen Workspace */}
            <Route path="student/learn/:conceptId" element={<LearningWorkspace />} />
            
            {/* Setup Flow — minimal header */}
            <Route element={<SetupLayout />}>
              <Route path="student/mode" element={<ModeSelection />} />
              <Route path="student/individual" element={<IndividualLearningSetup />} />
              <Route path="student/classroom/join" element={<JoinClassroom />} />
            </Route>

            {/* Standard Layout Routes */}
            <Route element={<StudentLayout />}>
              <Route path="student/dashboard" element={<StudentDashboard />} />
              <Route path="student/diagnostic/start" element={<StartDiagnostic />} />
              <Route path="student/diagnostic/session/:sessionId" element={<DiagnosticSession />} />
              <Route path="student/diagnostic/results/:sessionId" element={<DiagnosticResult />} />
              <Route path="student/profile" element={<MyMastery />} />
              <Route path="student/learning-plan" element={<LearningPlan />} />
              <Route path="student/learning-path" element={<StudentConceptGraph />} />
              <Route path="student/review" element={<ReviewCenter />} />
              <Route path="student/classrooms" element={<StudentClassrooms />} />
              <Route path="student/classrooms/:id" element={<StudentClassroomDetail />} />
            </Route>
          </Route>

          {/* Protected Staff Routes */}
          <Route element={<ProtectedRoute allowedRole="staff" />}>
            {/* Setup Flow — minimal header */}
            <Route element={<SetupLayout />}>
              <Route path="staff/class-selection" element={<ClassSelection />} />
              <Route path="staff/join-class" element={<JoinClass />} />
              <Route path="staff/classrooms/create" element={<CreateClassroom />} />
            </Route>

            {/* Standard Layout Routes */}
            <Route element={<StaffLayout />}>
              <Route path="staff/dashboard" element={<StaffDashboard />} />
              <Route path="staff/graph" element={<StaffConceptGraph />} />
              <Route path="staff/classrooms/:id" element={<StaffClassroomDetail />} />
              <Route path="staff/student/:studentId" element={<StaffStudentProfile />} />
              <Route path="staff/classrooms" element={<StaffClassrooms />} />
              <Route path="staff/interventions" element={<StaffInterventions />} />
              <Route path="staff/analytics" element={<StaffAnalytics />} />
              <Route path="admin/evaluation" element={<EvaluationSuite />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
