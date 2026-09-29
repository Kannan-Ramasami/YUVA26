import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Code, Database, Compass, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { setLearningContext } from '../../services/learningContextManager';

// Mock subject data - eventually fetched from DB
const AVAILABLE_SUBJECTS = [
  { id: 'sub_python', name: 'Python Programming', icon: Code, description: 'Learn Python from syntax basics to advanced data manipulation.' },
  { id: 'sub_ds', name: 'Data Structures', icon: Database, description: 'Master arrays, trees, graphs, and algorithmic efficiency.' },
  { id: 'sub_cs', name: 'Computer Science Fundamentals', icon: Compass, description: 'Core principles of computing, logic, and discrete math.' }
];

export function IndividualLearningSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSelectSubject = async (subjectId: string) => {
    if (!user) return;
    setLoading(subjectId);
    
    // Set the learning context to Individual mode for this subject
    await setLearningContext(user.id, 'individual', subjectId, null);
    
    setSuccess(true);
    
    // Route to diagnostic assessment
    setTimeout(() => {
      navigate('/student/diagnostic/start');
    }, 1500);
  };

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Context Saved</h1>
        <p className="text-slate-400 max-w-md">
          Your adaptive engine is now focused on your selected subject. 
          (Routing to Learning Workspace in future sections...)
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in-up pb-12">
      <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center border border-primary-500/20 mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Individual Learning</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Choose a subject. The adaptive engine will personalize your learning path entirely based on your own mastery, history, and learning goals.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_SUBJECTS.map((subject) => (
          <div key={subject.id} className="glass-panel p-6 rounded-2xl flex flex-col h-full hover:border-primary-500/40 transition-colors group">
            <div className="w-12 h-12 bg-surfaceBorder/50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary-500/20 transition-all">
              <subject.icon className="w-6 h-6 text-slate-300 group-hover:text-primary-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{subject.name}</h3>
            <p className="text-slate-400 text-sm mb-8 flex-1">{subject.description}</p>
            
            <button
              onClick={() => handleSelectSubject(subject.id)}
              disabled={loading !== null}
              className="w-full bg-surfaceBorder hover:bg-primary-600 text-white py-3 rounded-xl font-medium transition-all group-hover:border-primary-500/50 border border-slate-700 disabled:opacity-50"
            >
              {loading === subject.id ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                'Select Subject'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
