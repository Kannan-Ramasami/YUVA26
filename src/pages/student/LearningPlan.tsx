import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Map, BookOpen, AlertCircle, CheckCircle, BrainCircuit, RefreshCw, Star } from 'lucide-react';
import type { LearnerConceptState } from '../../types/evidence';
import { PYTHON_CONCEPTS } from '../../features/diagnostic/data/pythonDiagnostic';
import { LearningPlanService } from '../../features/adaptive/learningPlan';
import { ActionType } from '../../features/adaptive/decisionEngine/types';
import { conceptGraphService } from '../../features/graph/services/conceptGraphService';
import type { LearningPlanItem } from '../../features/adaptive/learningPlan/types';

const planService = new LearningPlanService();

export function LearningPlan() {
  const { user } = useAuth();
  const [states, setStates] = useState<LearnerConceptState[]>([]);
  const [loading, setLoading] = useState(true);
  const [planItems, setPlanItems] = useState<LearningPlanItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchStates = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('learner_concept_states')
      .select('*')
      .eq('student_id', user.id);
    
    if (data) {
      setStates(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStates();
  }, [user]);

  useEffect(() => {
    if (loading || !user) return;

    // Generate dynamic plan
    const stateMap = states.reduce((acc, state) => {
      acc[state.concept_id] = state;
      return acc;
    }, {} as Record<string, LearnerConceptState>);

    const { items } = planService.generatePlan(
      user.id,
      'python_101',
      {
        student_id: user.id,
        topic_id: 'default',
        learning_context: 'individual',
        concept_graph: {
          getPrerequisites: conceptGraphService.getPrerequisites,
          getDependents: conceptGraphService.getDependents,
          checkPrerequisiteReadiness: conceptGraphService.checkPrerequisiteReadiness,
          getFirstWeakPrerequisite: conceptGraphService.getFirstWeakPrerequisite.bind(conceptGraphService)
        },
        unified_state: { student_id: user.id, topic_id: 'default', overall_level: 'BEGINNER', overall_level_confidence: 1, overall_level_model_version: 'v', recent_accuracy: 0.5, recent_activity_at: null, learning_velocity: null, concept_states: stateMap },
        recent_attempts: [], // In real app, fetch recent attempts
        review_candidates: [] // In real app, fetch from spaced repetition engine
      },
      PYTHON_CONCEPTS.map(c => c.id)
    );

    setPlanItems(items);
  }, [loading, states, user]);

  const refreshPlan = async () => {
    setIsUpdating(true);
    await fetchStates();
    setIsUpdating(false);
  };

  if (loading) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Group items
  const completed = planItems.filter(i => i.status === 'COMPLETED');
  const review = planItems.filter(i => i.recommended_action === ActionType.REVIEW && i.status !== 'COMPLETED');
  
  // Active learning is everything that is not completed or review
  let activeItems = planItems.filter(i => i.status !== 'COMPLETED' && i.recommended_action !== ActionType.REVIEW);
  
  // Sort by priority
  activeItems.sort((a, b) => b.priority - a.priority);
  
  // Take top 2 for CURRENT, rest for UP NEXT
  const current = activeItems.slice(0, 2);
  const upNext = activeItems.slice(2);

  const getConceptDetails = (conceptId: string) => {
    return PYTHON_CONCEPTS.find(c => c.id === conceptId);
  };
  
  const getStateForConcept = (conceptId: string) => {
    return states.find(s => s.concept_id === conceptId);
  };

  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case ActionType.REMEDIATE_PREREQUISITE: return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case ActionType.PRACTICE: return <BookOpen className="w-5 h-5 text-amber-400" />;
      case ActionType.REVIEW: return <RefreshCw className="w-5 h-5 text-indigo-400" />;
      case ActionType.CHALLENGE: return <Star className="w-5 h-5 text-fuchsia-400" />;
      case ActionType.TEACHER_INTERVENTION: return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <BrainCircuit className="w-5 h-5 text-slate-400" />;
    }
  };

  const renderItem = (item: LearningPlanItem) => {
    const concept = getConceptDetails(item.concept_id);
    const state = getStateForConcept(item.concept_id);
    if (!concept) return null;

    return (
      <div key={item.id} className="glass-panel p-6 rounded-2xl border border-surfaceBorder/50 flex flex-col gap-3 relative overflow-hidden">
        {item.status === 'COMPLETED' && (
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-24 h-24 text-emerald-500" />
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-surfaceBorder/30 rounded-lg">
               {item.status === 'COMPLETED' ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : getActionIcon(item.recommended_action)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{concept.name}</h3>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {item.status === 'COMPLETED' ? 'Mastered' : item.recommended_action.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="text-right">
             <div className="text-2xl font-bold text-white">{state ? state.mastery_score : 0}<span className="text-sm font-normal text-slate-500">%</span></div>
             <div className="text-xs text-slate-400">Mastery</div>
          </div>
        </div>

        <p className="text-sm text-slate-300 italic mt-2 bg-slate-800/50 p-4 rounded-xl border border-surfaceBorder/30 z-10">
          "{item.reason}"
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Map className="w-8 h-8 text-indigo-400" />
            Your Learning Path
          </h1>
          <p className="text-slate-400 mt-2">A personalized plan adapted to your knowledge state.</p>
        </div>
        
        <button 
          onClick={refreshPlan}
          disabled={isUpdating}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Recalculating...' : 'Refresh Plan'}
        </button>
      </div>

      <div className="space-y-10">
        
        {/* CURRENT */}
        {current.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              CURRENT FOCUS
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {current.map(i => renderItem(i))}
            </div>
          </section>
        )}

        {/* REVIEW */}
        {review.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
              NEEDS REVIEW
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {review.map(i => renderItem(i))}
            </div>
          </section>
        )}

        {/* UP NEXT */}
        {upNext.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-slate-400" />
              UP NEXT
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75 hover:opacity-100 transition-opacity">
              {upNext.map(i => renderItem(i))}
            </div>
          </section>
        )}

        {/* COMPLETED */}
        {completed.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              COMPLETED
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-50">
              {completed.map(i => renderItem(i))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
