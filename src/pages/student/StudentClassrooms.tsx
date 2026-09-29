import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { setLearningContext } from '../../services/learningContextManager';

// Mock list of classrooms for demo purposes
// In a real app, this would be fetched from `classroom_members` joined with `classrooms`
const MOCK_JOINED_CLASSROOMS = [
  {
    id: 'cls_1',
    name: 'Algebra 101 - Fall',
    subject: 'Mathematics',
    educator: 'Jane Doe',
    studentCount: 28
  }
];

export function StudentClassrooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleOpenClassroom = async (classroomId: string, subject: string) => {
    if (!user) return;
    setLoading(classroomId);
    
    // Set the learning context to Classroom mode
    await setLearningContext(user.id, 'classroom', subject, classroomId);
    
    // Navigate to the Classroom Learning Dashboard
    navigate(`/student/classrooms/${classroomId}`);
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in-up pb-12">
      <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-400" />
            My Classrooms
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl">
            Select a classroom to enter. Your learning path will adapt to your personal needs while following the classroom's curriculum.
          </p>
        </div>
        <Link to="/student/classroom/join" className="bg-surfaceBorder hover:bg-surfaceBorder/80 border border-slate-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm shrink-0">
          <Plus className="w-4 h-4" />
          Join New Class
        </Link>
      </div>

      {MOCK_JOINED_CLASSROOMS.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center">
          <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No classrooms yet</h3>
          <p className="text-slate-400 mb-6">You haven't joined any teacher-led classrooms.</p>
          <Link to="/student/classroom/join" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-block">
            Join a Classroom
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {MOCK_JOINED_CLASSROOMS.map((cls) => (
            <div key={cls.id} className="glass-panel p-6 rounded-2xl hover:border-indigo-500/40 transition-all group flex flex-col cursor-pointer shadow-lg hover:-translate-y-1" onClick={() => handleOpenClassroom(cls.id, cls.subject)}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{cls.name}</h3>
                  <p className="text-sm text-slate-400">{cls.subject}</p>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-surfaceBorder/50 flex items-center justify-between">
                <div className="text-sm text-slate-400 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                    {cls.educator.charAt(0)}
                  </span>
                  {cls.educator}
                </div>
                
                <button
                  disabled={loading === cls.id}
                  className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white p-2 rounded-lg transition-colors group-hover:bg-indigo-500 group-hover:text-white"
                >
                  {loading === cls.id ? (
                    <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
