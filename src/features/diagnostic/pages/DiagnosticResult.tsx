import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Play, CheckCircle2, TrendingUp, AlertTriangle, User, BookOpen, BrainCircuit, Lock } from 'lucide-react';
import type { LearnerConceptState } from '../types';
import { PYTHON_CONCEPTS } from '../data/pythonDiagnostic';

export function DiagnosticResult() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [learnerStates, setLearnerStates] = useState<LearnerConceptState[]>([]);
  const [loading, setLoading] = useState(true);

  const topicName = localStorage.getItem('masteryflow_current_topic_name') || 'Python Programming';

  useEffect(() => {
    if (!user) return;
    
    // In a real app we might fetch only states updated by this session,
    // but fetching all for this student is fine for prototype.
    const fetchStates = async () => {
      try {
        const { data, error } = await supabase
          .from('learner_concept_states')
          .select('*')
          .eq('student_id', user.id);
        
        if (!error && data) {
          setLearnerStates(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStates();
  }, [user, sessionId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  // Combine fetched state with standard concepts
  const displayConcepts = PYTHON_CONCEPTS.map(concept => {
    const state = learnerStates.find(s => s.concept_id === concept.id);
    return {
      name: concept.name,
      status: state?.status || 'NOT_ASSESSED',
      score: state?.mastery_score || 0
    };
  });

  // Level Estimation
  const avgScore = displayConcepts.length > 0 
    ? displayConcepts.reduce((acc, c) => acc + c.score, 0) / displayConcepts.length 
    : 0;

  let level = 'BEGINNER';
  let levelDesc = 'You are just starting out. We will build a strong foundation first.';
  if (avgScore > 75) {
    level = 'ADVANCED';
    levelDesc = 'You have excellent mastery. We will focus on advanced application and optimization.';
  } else if (avgScore > 40) {
    level = 'INTERMEDIATE';
    levelDesc = 'Based on your diagnostic performance, you already understand the fundamentals. We\'ll focus on strengthening application and problem-solving skills.';
  } else if (avgScore > 15) {
    level = 'FOUNDATION';
    levelDesc = 'You have some foundational knowledge. We will reinforce core concepts before moving to complex topics.';
  }

  // Path Recommendation
  let firstDevelopingFound = false;
  const path = displayConcepts.map(c => {
    if (c.status === 'MASTERED') {
      return { name: c.name, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400' };
    }
    if (c.status === 'DEVELOPING' || c.status === 'NEEDS_REMEDIATION' || (!firstDevelopingFound && c.status === 'NOT_ASSESSED')) {
      firstDevelopingFound = true;
      return { name: c.name, icon: <TrendingUp className="w-5 h-5" />, color: 'text-primary-400' };
    }
    return { name: c.name, icon: <Lock className="w-5 h-5" />, color: 'text-slate-500' };
  });

  // Recommended Next
  const nextUp = displayConcepts.find(c => c.status === 'DEVELOPING' || c.status === 'NEEDS_REMEDIATION' || c.status === 'NOT_ASSESSED');
  const recommendedNext = nextUp ? `Practice ${nextUp.name}` : 'Start Advanced Practice';
  const recommendedWhy = nextUp && nextUp.status === 'NEEDS_REMEDIATION'
    ? `Your prerequisite mastery needs strengthening before advancing.`
    : `This is the optimal next step based on your current concept graph mapping.`;

  return (
    <div className="max-w-3xl mx-auto w-full pb-20 pt-8 animate-fade-in-up">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Your Learning Profile</h1>
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-slate-300">
          <BookOpen className="w-4 h-4 text-primary-400" />
          Topic: <span className="text-white font-medium capitalize">{topicName}</span>
        </div>
      </div>

      <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] border-primary-500/30 relative overflow-hidden mb-12 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-primary-900/10 pointer-events-none"></div>

        <div className="relative z-10 grid md:grid-cols-2 gap-12">
          {/* Left Column: Level & Recommendation */}
          <div>
            <div className="mb-10">
              <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Current Level</h2>
              <div className="text-3xl font-bold text-white mb-4">{level}</div>
              <p className="text-slate-300 leading-relaxed">{levelDesc}</p>
            </div>

            <div className="bg-primary-500/10 border border-primary-500/20 p-6 rounded-2xl">
              <h2 className="text-primary-300 text-sm font-bold uppercase tracking-wider mb-2">Recommended Next</h2>
              <div className="text-xl font-bold text-white mb-3">{recommendedNext}</div>
              <div className="text-sm text-slate-300">
                <span className="font-bold text-white">Why?</span> {recommendedWhy}
              </div>
            </div>
          </div>

          {/* Right Column: Path */}
          <div>
            <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              Your Learning Path
            </h2>
            <div className="space-y-4">
              {path.map((item, idx) => (
                <div key={idx} className={`flex items-center gap-4 ${item.color}`}>
                  <div className="w-8 h-8 rounded-full bg-surfaceBorder flex items-center justify-center bg-opacity-50">
                    {item.icon}
                  </div>
                  <span className={`font-medium ${item.color === 'text-slate-500' ? 'opacity-50' : ''}`}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Link 
          to="/student/dashboard"
          className="btn-primary px-12 py-5 rounded-full text-lg font-bold group"
        >
          <Play className="w-5 h-5 fill-current mr-2 inline-block group-hover:scale-110 transition-transform" />
          Start Learning
        </Link>
      </div>
    </div>
  );
}
