import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BrainCircuit, Activity, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';
import type { LearnerConceptState } from '../../types/evidence';
import { PYTHON_CONCEPTS } from '../../features/diagnostic/data/pythonDiagnostic';

export function MyMastery() {
  const { user } = useAuth();
  const [states, setStates] = useState<LearnerConceptState[]>([]);
  const [loading, setLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStates = async () => {
      const { data } = await supabase
        .from('learner_concept_states')
        .select('*')
        .eq('student_id', user.id);
      
      if (data) setStates(data);
      setLoading(false);
    };
    fetchStates();
  }, [user]);

  if (loading) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Map state to human readable concepts
  const displayData = PYTHON_CONCEPTS.map(concept => {
    const state = states.find(s => s.concept_id === concept.id);
    return {
      concept,
      state
    };
  });

  const getStudentFriendlyExplanation = (state: LearnerConceptState) => {
    if (!state || state.attempt_count === 0) return "You haven't tried any questions for this concept yet. Ready to start?";
    
    if (state.status === 'MASTERED') {
      if (state.recent_correctness < 1) return "You've mastered this, but had a recent slip-up. Keep practicing to stay sharp!";
      return "You're showing rock-solid mastery. Great job!";
    }
    
    if (state.status === 'DEVELOPING') {
      if (state.recent_correctness === 1) return "You're getting very consistent! Just a little more practice needed.";
      return "You're on the right track, but still building consistency.";
    }

    if (state.status === 'NEEDS_REMEDIATION') {
      if (state.hint_usage_count > state.attempt_count * 0.4) return "You're relying heavily on hints. Let's try some easier practice without them.";
      if (state.recent_correctness > 0) return "You're starting to get it! Keep going.";
      return "This concept is proving tricky. A quick review lesson might help clear things up.";
    }

    return "Keep learning and practicing to build your mastery.";
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-400" />
            My Mastery
          </h1>
          <p className="text-slate-400 mt-2">A transparent view into your knowledge graph.</p>
        </div>
        
        {/* Secret Dev Mode Toggle for Hackathon Demo */}
        <button 
          onClick={() => setDevMode(!devMode)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${devMode ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-surfaceBorder text-slate-400 border-slate-700 hover:text-white'}`}
        >
          {devMode ? 'Disable Dev View' : 'Enable Dev View'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {displayData.map(({ concept, state }, idx) => (
          <div key={idx} className="glass-panel p-6 rounded-2xl flex flex-col h-full border border-surfaceBorder/50 hover:border-indigo-500/30 transition-colors relative overflow-hidden">
            
            {/* Status Indicator Bar */}
            <div className={`absolute top-0 left-0 w-full h-1 ${
              state?.status === 'MASTERED' ? 'bg-emerald-500' :
              state?.status === 'DEVELOPING' ? 'bg-amber-500' :
              state?.status === 'NEEDS_REMEDIATION' ? 'bg-rose-500' :
              'bg-slate-700'
            }`}></div>

            <div className="flex justify-between items-start mb-4 mt-2">
              <div>
                <h3 className="text-lg font-bold text-white">{concept.name}</h3>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{state?.status || 'NOT ASSESSED'}</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{state ? state.mastery_score : 0}<span className="text-sm text-slate-500 font-normal">%</span></div>
                <div className="text-xs text-slate-400">Mastery</div>
              </div>
            </div>

            <p className="text-sm text-slate-300 italic mb-6 flex-1 bg-surfaceBorder/20 p-4 rounded-xl border border-surfaceBorder/30">
              "{getStudentFriendlyExplanation(state!)}"
            </p>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-surfaceBorder/50">
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase font-semibold">Attempts</div>
                <div className="text-lg font-medium text-white">{state?.attempt_count || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase font-semibold">Trend</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {(state?.recent_correctness ?? 0) >= 0.6 ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : 
                   (state?.recent_correctness ?? 0) === 0 && (state?.attempt_count ?? 0) > 0 ? <TrendingDown className="w-4 h-4 text-rose-400" /> :
                   <Activity className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 uppercase font-semibold">Confidence</div>
                <div className="text-sm font-medium text-white mt-1">
                  {state ? (100 - (state.uncertainty * 100)).toFixed(0) : 0}%
                </div>
              </div>
            </div>

            {/* Recent Evidence */}
            {state?.recent_performance && state.recent_performance.length > 0 && (
              <div className="mt-4 pt-4 border-t border-surfaceBorder/50">
                <div className="text-xs text-slate-500 uppercase font-semibold mb-2">Recent Evidence</div>
                <div className="flex gap-1 flex-wrap">
                  {state.recent_performance.map((correct, i) => (
                    correct ? 
                      <div key={i} className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[12px] font-bold">✓</div> :
                      <div key={i} className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[12px] font-bold">✗</div>
                  ))}
                </div>
              </div>
            )}

            {/* Dev Mode Debug View */}
            {devMode && state && (
              <div className="mt-6 pt-4 border-t border-rose-500/30 bg-rose-500/5 p-4 rounded-xl animate-fade-in-up">
                <h4 className="text-xs font-bold text-rose-400 uppercase mb-2 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Evidence Engine Debug
                </h4>
                <div className="text-xs text-slate-300 font-mono space-y-1">
                  <div className="flex justify-between"><span>Correct/Incorrect:</span> <span>{state.correct_count} / {state.incorrect_count}</span></div>
                  <div className="flex justify-between"><span>Hint Count:</span> <span className={state.hint_usage_count > 0 ? 'text-amber-400' : ''}>{state.hint_usage_count}</span></div>
                  <div className="flex justify-between"><span>Recent Correctness:</span> <span>{state.recent_correctness * 100}%</span></div>
                  <div className="flex justify-between"><span>Base Uncertainty:</span> <span>{state.uncertainty}</span></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
