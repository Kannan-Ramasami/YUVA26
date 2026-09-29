import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { Play, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import type { LearnerConceptState } from '../types';
import { PYTHON_CONCEPTS } from '../data/pythonDiagnostic';

export function DiagnosticResult() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const [learnerStates, setLearnerStates] = useState<LearnerConceptState[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 animate-fade-in-up">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Your learning profile is ready.</h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          MasteryFlow has estimated your starting knowledge based on the evidence collected. 
          Your path will continuously adapt as you learn.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {displayConcepts.map((concept, idx) => {
          let statusColor = 'text-slate-400';
          let statusBg = 'bg-slate-500';
          let Icon = TrendingUp;

          if (concept.status === 'MASTERED') {
            statusColor = 'text-emerald-400';
            statusBg = 'bg-emerald-500';
            Icon = CheckCircle2;
          } else if (concept.status === 'DEVELOPING') {
            statusColor = 'text-amber-400';
            statusBg = 'bg-amber-500';
            Icon = TrendingUp;
          } else if (concept.status === 'NEEDS_REMEDIATION' || concept.status === 'NOT_ASSESSED') {
            statusColor = 'text-rose-400';
            statusBg = 'bg-rose-500';
            Icon = AlertTriangle;
          }

          const displayLabel = concept.status === 'NEEDS_REMEDIATION' ? 'Needs Attention' : 
                               concept.status === 'NOT_ASSESSED' ? 'Not Assessed' : 
                               concept.status === 'DEVELOPING' ? 'Developing' : 'Mastered';

          return (
            <div key={idx} className="glass-panel p-6 rounded-2xl">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-white text-lg">{concept.name}</h3>
                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                  <Icon className="w-4 h-4" />
                  {displayLabel}
                </div>
              </div>
              
              <div className="w-full h-3 bg-surfaceBorder rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full ${statusBg} transition-all duration-1000`} 
                  style={{ width: `${concept.score}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-slate-400 font-medium">
                {concept.score}% Est. Mastery
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Link 
          to="/student/dashboard"
          className="btn-primary px-10 py-4"
        >
          <Play className="w-5 h-5 fill-current" />
          Continue to Dashboard
        </Link>
      </div>
    </div>
  );
}
