import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { conceptGraphService } from '../../features/graph/services/conceptGraphService';
import { Network, Lock, CheckCircle2, AlertTriangle, ChevronRight, BookOpen, Star, RefreshCw, AlertCircle } from 'lucide-react';
import type { LearnerConceptState } from '../../types/evidence';
import type { Concept } from '../../features/diagnostic/types';
import type { ReadinessResult } from '../../features/graph/types';
import { LearningPlanService } from '../../features/adaptive/learningPlan';
import { ActionType } from '../../features/adaptive/decisionEngine/types';

const planService = new LearningPlanService();

export function ConceptGraph() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [states, setStates] = useState<LearnerConceptState[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadGraph = async () => {
      const allConcepts = conceptGraphService.getConcepts();
      setConcepts(allConcepts);

      const { data } = await supabase
        .from('learner_concept_states')
        .select('*')
        .eq('student_id', user.id);
      
      if (data) setStates(data);
      setLoading(false);
    };
    loadGraph();
  }, [user]);

  // Compute layers/levels for visual path
  const graphLevels = useMemo(() => {
    if (concepts.length === 0) return [];
    const levels: { level: number; concepts: Concept[] }[] = [];
    const conceptLevelMap = new Map<string, number>();

    const getLevel = (conceptId: string): number => {
      if (conceptLevelMap.has(conceptId)) return conceptLevelMap.get(conceptId)!;
      const prereqs = conceptGraphService.getPrerequisites(conceptId);
      if (prereqs.length === 0) {
        conceptLevelMap.set(conceptId, 0);
        return 0;
      }
      const maxPrereqLevel = Math.max(...prereqs.map(p => getLevel(p.prerequisite_concept_id)));
      const level = maxPrereqLevel + 1;
      conceptLevelMap.set(conceptId, level);
      return level;
    };

    concepts.forEach(c => getLevel(c.id));
    
    Array.from(conceptLevelMap.entries()).forEach(([id, level]) => {
      if (!levels[level]) levels[level] = { level, concepts: [] };
      levels[level].concepts.push(concepts.find(c => c.id === id)!);
    });

    return levels.filter(Boolean); // Remove empty holes
  }, [concepts]);

  // Calculate readiness map
  const readinessMap = useMemo(() => {
    const map = new Map<string, ReadinessResult>();
    concepts.forEach(c => {
      map.set(c.id, conceptGraphService.checkPrerequisiteReadiness(c.id, states));
    });
    return map;
  }, [concepts, states]);

  // Generate learning plan to find "Recommended Next"
  const planData = useMemo(() => {
    if (!user || concepts.length === 0) return null;
    
    const stateMap = states.reduce((acc, state) => {
      acc[state.concept_id] = state;
      return acc;
    }, {} as Record<string, LearnerConceptState>);

    return planService.generatePlan(
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
        recent_attempts: [],
        review_candidates: []
      },
      concepts.map(c => c.id)
    );
  }, [user, states, concepts]);

  if (loading) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const getStatusColor = (status: ReadinessResult['status']) => {
    switch (status) {
      case 'MASTERED': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10';
      case 'DEVELOPING': return 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-amber-500/10';
      case 'NEEDS_REVIEW': return 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-rose-500/10';
      case 'AVAILABLE': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 shadow-indigo-500/10';
      case 'BLOCKED': return 'text-slate-500 bg-slate-800/80 border-slate-700/50 shadow-none';
    }
  };

  const getStatusIcon = (status: ReadinessResult['status']) => {
    switch (status) {
      case 'MASTERED': return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case 'DEVELOPING': return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'NEEDS_REVIEW': return <RefreshCw className="w-6 h-6 text-rose-400" />;
      case 'AVAILABLE': return <BookOpen className="w-6 h-6 text-indigo-400" />;
      case 'BLOCKED': return <Lock className="w-6 h-6 text-slate-500" />;
    }
  };

  const activeConcept = selectedConcept ? concepts.find(c => c.id === selectedConcept) : null;
  const activeReadiness = activeConcept ? readinessMap.get(activeConcept.id) : null;
  const activeState = activeConcept ? states.find(s => s.concept_id === activeConcept.id) : null;
  
  // Find highest priority pending item in the plan
  const recommendedNext = planData?.items
    .filter(i => i.status !== 'COMPLETED')
    .sort((a, b) => b.priority - a.priority)[0];
    
  const recommendedConcept = recommendedNext ? concepts.find(c => c.id === recommendedNext.concept_id) : null;

  const getActionIcon = (action: ActionType) => {
    switch (action) {
      case ActionType.REMEDIATE_PREREQUISITE: return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case ActionType.PRACTICE: return <BookOpen className="w-5 h-5 text-amber-400" />;
      case ActionType.REVIEW: return <RefreshCw className="w-5 h-5 text-indigo-400" />;
      case ActionType.CHALLENGE: return <Star className="w-5 h-5 text-fuchsia-400" />;
      case ActionType.TEACHER_INTERVENTION: return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-20 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Network className="w-8 h-8 text-indigo-400" />
          Interactive Learning Path
        </h1>
        <p className="text-slate-400 mt-2">Your personalized journey through Python concepts, driven by real-time adaptive engine decisions.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Concept Flow Map */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Adaptive Highlight banner */}
          {recommendedNext && recommendedConcept && (
            <div 
              onClick={() => setSelectedConcept(recommendedConcept.id)}
              className="glass-panel p-6 rounded-2xl border-2 border-indigo-500/50 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] cursor-pointer hover:bg-surfaceBorder/30 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  {getActionIcon(recommendedNext.recommended_action)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Recommended Next</h3>
                  <h2 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {recommendedConcept.name} — {recommendedNext.recommended_action.replace('_', ' ')}
                  </h2>
                  <p className="text-sm text-slate-300 bg-indigo-950/40 p-3 rounded-lg border border-indigo-500/20">
                    "{recommendedNext.reason}"
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-indigo-400 group-hover:translate-x-1 transition-transform self-center" />
              </div>
            </div>
          )}

          <div className="glass-panel p-8 rounded-3xl border border-surfaceBorder/50 relative overflow-hidden">
             {/* Path line connecting levels */}
             <div className="absolute top-12 bottom-12 left-1/2 w-1 bg-surfaceBorder/40 -translate-x-1/2 z-0 hidden md:block"></div>
             
             <div className="space-y-12 relative z-10 flex flex-col items-center">
               {graphLevels.map((levelObj, levelIndex) => (
                 <div key={levelIndex} className="w-full">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                       {levelObj.concepts.map(concept => {
                         const readiness = readinessMap.get(concept.id);
                         const isSelected = selectedConcept === concept.id;
                         const isRecommended = recommendedNext?.concept_id === concept.id;
                         
                         if (!readiness) return null;

                         return (
                           <button
                             key={concept.id}
                             onClick={() => setSelectedConcept(concept.id)}
                             className={`relative group flex flex-col items-center w-48 p-4 rounded-2xl transition-all border-2
                               ${isSelected ? 'border-indigo-500 bg-surfaceBorder/80 scale-105 z-20' : 'border-transparent bg-surfaceBorder/30 hover:bg-surfaceBorder/60 hover:border-slate-600'}
                               ${isRecommended ? 'ring-4 ring-indigo-500/30' : ''}
                             `}
                           >
                             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border-2 shadow-lg transition-transform group-hover:scale-110 ${getStatusColor(readiness.status)}`}>
                               {getStatusIcon(readiness.status)}
                             </div>
                             
                             <h3 className={`text-sm font-bold text-center leading-tight mb-1 ${readiness.status === 'BLOCKED' ? 'text-slate-400' : 'text-white'}`}>
                               {concept.name}
                             </h3>
                             
                             <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                               {readiness.status.replace('_', ' ')}
                             </span>
                           </button>
                         );
                       })}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Concept Detail Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            {activeConcept && activeReadiness ? (
              <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50 shadow-xl animate-fade-in-up">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-lg mb-6 ${getStatusColor(activeReadiness.status)}`}>
                  {getStatusIcon(activeReadiness.status)}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">{activeConcept.name}</h2>
                <p className="text-slate-400 text-sm mb-6">
                  {activeConcept.description}
                </p>
                
                {/* Find what the engine says about this specific concept */}
                {(() => {
                  const planItem = planData?.items.find(i => i.concept_id === activeConcept.id);
                  if (planItem && planItem.status !== 'COMPLETED') {
                    return (
                      <div className="mb-6 bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/20 text-sm text-slate-300">
                        <strong className="block text-indigo-400 text-xs uppercase tracking-widest mb-1">Engine Decision: {planItem.recommended_action}</strong>
                        {planItem.reason}
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="space-y-6">
                  {/* Current Mastery */}
                  <div className="bg-surfaceBorder/30 p-4 rounded-2xl border border-surfaceBorder/50">
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-slate-400 font-medium">Estimated Mastery</span>
                      <span className="text-white font-bold">{activeState?.mastery_score || 0}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full ${activeState?.mastery_score && activeState.mastery_score >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${activeState?.mastery_score || 0}%` }}
                      ></div>
                    </div>
                    {activeState?.recent_performance && activeState.recent_performance.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-surfaceBorder/50">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-2">Recent Evidence</span>
                        <div className="flex gap-1">
                          {activeState.recent_performance.slice(-10).map((isCorrect, idx) => (
                            <div key={idx} className={`h-2 flex-1 rounded-sm ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prerequisites */}
                  {activeReadiness.allPrerequisites.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Prerequisite Map</h4>
                      <div className="space-y-2">
                        {activeReadiness.allPrerequisites.map((p, idx) => (
                          <div key={idx} className="bg-surfaceBorder/30 p-3 rounded-xl border border-surfaceBorder/50 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-white">{p.prerequisiteName}</span>
                              {p.isSatisfied ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Lock className="w-4 h-4 text-rose-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${p.isSatisfied ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${p.currentMastery}%` }}></div>
                              </div>
                              <span className="text-xs font-bold text-slate-400">{p.currentMastery}% / {p.minimumMastery}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {activeReadiness.status === 'BLOCKED' ? (
                     <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 cursor-not-allowed">
                       <Lock className="w-4 h-4" /> Locked By Prerequisites
                     </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/student/learn/${activeConcept.id}`)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] flex justify-center items-center gap-2"
                    >
                      <BookOpen className="w-5 h-5" />
                      {activeState?.attempt_count ? 'Continue Learning' : 'Start Learning'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-3xl border border-surfaceBorder/50 text-center flex flex-col items-center justify-center min-h-[400px]">
                <Network className="w-16 h-16 text-slate-700 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Select a concept</h3>
                <p className="text-sm text-slate-400 max-w-[250px]">
                  Click on any concept in the path to view its prerequisites, your current evidence, and recommended actions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
