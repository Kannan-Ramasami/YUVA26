import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ReviewService } from '../../features/adaptive/reviewEngine';
import type { ReviewCandidate } from '../../features/adaptive/reviewEngine';
import { PYTHON_CONCEPTS } from '../../features/diagnostic/data/pythonDiagnostic';
import type { LearnerConceptState } from '../../types/evidence';
import { RefreshCw, BookOpen, Clock, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

const reviewService = new ReviewService();

export function ReviewCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<ReviewCandidate[]>([]);
  const [states, setStates] = useState<Record<string, LearnerConceptState>>({});

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data } = await supabase
        .from('learner_concept_states')
        .select('*')
        .eq('student_id', user.id);
      
      if (data) {
        const stateMap = data.reduce((acc, s) => {
          acc[s.concept_id] = s;
          return acc;
        }, {} as Record<string, LearnerConceptState>);
        
        setStates(stateMap);
        
        // Find review candidates
        // We will pass no specific target concept so it just evaluates general spaced review and performance drops.
        // Wait, for PREREQUISITE_REMEDIATION, we need to know their target.
        // For the Review Center, we'll just check all concepts for standard review, 
        // unless we know their active learning target. For simplicity, we just evaluate general health.
        const reviewList = reviewService.getReviewCandidates(data);
        setCandidates(reviewList);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user]);

  if (loading) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const getReasonIcon = (reason: ReviewCandidate['reason']) => {
    switch (reason) {
      case 'SPACED_REVIEW': return <Clock className="w-5 h-5 text-indigo-400" />;
      case 'PERFORMANCE_DECLINE': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'UNCERTAINTY': return <RefreshCw className="w-5 h-5 text-amber-400" />;
      case 'PREREQUISITE_REMEDIATION': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    }
  };

  const getReasonText = (candidate: ReviewCandidate) => {
    switch (candidate.reason) {
      case 'SPACED_REVIEW': return `Last practiced ${Math.floor(candidate.daysSinceLastReview)} days ago. Time to refresh!`;
      case 'PERFORMANCE_DECLINE': return `Recent performance dropped on this concept. Let's strengthen it.`;
      case 'UNCERTAINTY': return `The engine detected high uncertainty during your last attempts.`;
      case 'PREREQUISITE_REMEDIATION': return `This is a weak prerequisite blocking other concepts.`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400" />
          Review Center
        </h1>
        <p className="text-slate-400 mt-2">Concepts that need your attention based on spaced repetition and performance decay.</p>
      </div>

      {candidates.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-surfaceBorder/50 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all caught up!</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            There are no concepts due for review at the moment. Keep pushing forward on your learning path.
          </p>
          <button 
            onClick={() => navigate('/student/learning-path')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]"
          >
            Go to Learning Path
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/20 text-indigo-200 text-sm flex items-center gap-2">
             <AlertTriangle className="w-4 h-4 text-indigo-400" />
             <strong>{candidates.length} concepts</strong> need review to maintain optimal mastery.
          </div>

          <div className="grid gap-4">
            {candidates.map((candidate, idx) => {
              const concept = PYTHON_CONCEPTS.find(c => c.id === candidate.conceptId);
              if (!concept) return null;
              
              const state = states[candidate.conceptId];

              return (
                <div key={idx} className="glass-panel p-6 rounded-2xl border border-surfaceBorder/50 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between group hover:border-indigo-500/30 transition-colors">
                  <div className="flex gap-4">
                    <div className="p-3 bg-surfaceBorder/30 rounded-xl shrink-0 mt-1 sm:mt-0 self-start sm:self-center">
                      {getReasonIcon(candidate.reason)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{concept.name}</h3>
                      <p className="text-sm text-slate-400 mb-2">
                        {getReasonText(candidate)}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {state?.mastery_score || 0}% Mastery</span>
                        <span className="text-indigo-400">Urgency: {Math.round(candidate.priorityScore)}/100</span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate(`/student/learn/${concept.id}`)}
                    className="w-full sm:w-auto bg-surfaceBorder hover:bg-indigo-600 hover:text-white text-slate-300 font-bold py-3 px-6 rounded-xl transition-all flex justify-center items-center gap-2 shrink-0"
                  >
                    Review Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
