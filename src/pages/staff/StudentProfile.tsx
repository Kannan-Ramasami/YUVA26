import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Activity, BookOpen, AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { LearnerConceptState } from '../../types/evidence';
import { PYTHON_CONCEPTS } from '../../features/diagnostic/data/pythonDiagnostic';
import { StuckLearnerService, type StuckLearnerFlag } from '../../features/staff/services/stuckLearnerService';
import { OverrideService } from '../../features/staff/services/overrideService';
import { ActionType } from '../../features/adaptive/decisionEngine/types';
import { useAuth } from '../../contexts/AuthContext';
import { AdaptiveDecisionEngine } from '../../features/adaptive/decisionEngine';
import { conceptGraphService } from '../../features/graph/services/conceptGraphService';
import type { TeacherOverride } from '../../features/staff/types';

const stuckLearnerService = new StuckLearnerService();
const overrideService = new OverrideService();
const decisionEngine = new AdaptiveDecisionEngine();

export function StaffStudentProfile() {
  const { studentId } = useParams();
  const { profile: staffProfile } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [states, setStates] = useState<LearnerConceptState[]>([]);
  const [flags, setFlags] = useState<StuckLearnerFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [classroomId, setClassroomId] = useState<string | null>(null);

  // Recommendation State
  const [currentAction, setCurrentAction] = useState<{ action: ActionType, concept: string } | null>(null);
  const [activeOverrides, setActiveOverrides] = useState<TeacherOverride[]>([]);
  
  // Modal State
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    action: 'PRACTICE' as ActionType,
    concept: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const load = async () => {
      // 1. Get user profile
      const { data: pData } = await supabase.from('profiles').select('*').eq('id', studentId).single();
      if (pData) setProfile(pData);

      // 2. Get classroom ID mapping
      const { data: cData } = await supabase.from('classroom_students').select('classroom_id').eq('student_id', studentId).limit(1);
      const cId = cData?.[0]?.classroom_id;
      if (cId) setClassroomId(cId);

      // 3. Get states
      const { data: sData } = await supabase.from('learner_concept_states').select('*').eq('student_id', studentId);
      const loadedStates = sData as LearnerConceptState[] || [];
      setStates(loadedStates);
      setFlags(stuckLearnerService.analyzeStates(loadedStates));

      // 4. Compute Current Recommendation
      if (loadedStates.length > 0) {
        // Find most recently active concept
        const activeState = [...loadedStates].sort((a, b) => {
           const timeA = new Date(a.last_attempt_at || 0).getTime();
           const timeB = new Date(b.last_attempt_at || 0).getTime();
           return timeB - timeA;
        })[0];

        const stateMap = loadedStates.reduce((acc, s) => {
          acc[s.concept_id] = s;
          return acc;
        }, {} as Record<string, LearnerConceptState>);

        try {
          const rec = decisionEngine.getNextBestAction({
            student_id: studentId,
            target_concept: activeState.concept_id,
            learning_context: 'classroom',
            concept_graph: conceptGraphService,
            learner_states: stateMap,
            recent_attempts: [],
            review_candidates: []
          });
          setCurrentAction({ action: rec.action, concept: rec.target_concept });
          setOverrideForm(prev => ({ ...prev, concept: rec.target_concept }));
        } catch (e) {
          console.warn("Could not calculate recommendation:", e);
        }
      }

      // 5. Get Active Overrides
      if (cId) {
        const overrides = await overrideService.getActiveOverrides(studentId, cId);
        setActiveOverrides(overrides);
      }

      setLoading(false);
    };

    load();
  }, [studentId]);

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffProfile || !classroomId || !currentAction || !studentId) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const newOverride: TeacherOverride = {
        student_id: studentId,
        classroom_id: classroomId,
        original_action: currentAction.action,
        original_concept: currentAction.concept,
        override_action: overrideForm.action,
        override_concept: overrideForm.concept,
        reason: overrideForm.reason,
        created_by: staffProfile.id
      };

      await overrideService.submitOverride(newOverride);
      
      // Refresh overrides
      const overrides = await overrideService.getActiveOverrides(studentId, classroomId);
      setActiveOverrides(overrides);
      setShowOverrideModal(false);
      setOverrideForm(prev => ({ ...prev, reason: '' }));
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const activeConcepts = states.filter(s => s.status !== 'NOT_ASSESSED');
  const masteredCount = states.filter(s => s.status === 'MASTERED').length;
  const avgMastery = activeConcepts.length > 0 
    ? Math.round(activeConcepts.reduce((acc, s) => acc + (s.mastery_score || 0), 0) / activeConcepts.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in-up pb-12 max-w-5xl mx-auto">
      <Link to={-1 as any} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="glass-panel p-8 rounded-3xl border border-surfaceBorder/50 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500/30">
            <User className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{profile?.full_name || 'Student Profile'}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> {masteredCount} Concepts Mastered</span>
              <span className="flex items-center gap-1"><Activity className="w-4 h-4" /> {avgMastery}% Overall Avg</span>
            </div>
          </div>
        </div>
        
        {flags.length > 0 && (
          <div className="bg-rose-500/20 border border-rose-500/30 p-4 rounded-xl text-rose-300 text-sm max-w-xs w-full">
            <div className="font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Action Required
            </div>
            This student has {flags.length} active learning flags that require educator attention.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Flags & Recommendations */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Recommendation & Intervention */}
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-indigo-950/10">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Adaptive Engine
            </h2>
            
            {currentAction ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">System Recommends</div>
                  <div className="text-white font-bold">{currentAction.action.replace('_', ' ')}</div>
                  <div className="text-sm text-indigo-300">{PYTHON_CONCEPTS.find(c => c.id === currentAction.concept)?.name || currentAction.concept}</div>
                </div>

                {activeOverrides.length > 0 && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl mt-4">
                    <div className="text-xs text-emerald-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                       <CheckCircle2 className="w-3 h-3" /> Teacher Override Active
                    </div>
                    <div className="text-white font-bold">{activeOverrides[0].override_action.replace('_', ' ')}</div>
                    <div className="text-sm text-emerald-300">{PYTHON_CONCEPTS.find(c => c.id === activeOverrides[0].override_concept)?.name}</div>
                    <div className="text-xs text-slate-400 mt-2">"{activeOverrides[0].reason}"</div>
                  </div>
                )}

                <button 
                  onClick={() => setShowOverrideModal(true)}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                >
                  Override Recommendation
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-400">No active recommendation available.</div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Intervention Flags</h2>
            
            {flags.length === 0 ? (
              <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">No active flags.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {flags.map((flag, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${flag.severity === 'high' ? 'bg-rose-950/40 border-rose-500/30 text-rose-200' : flag.severity === 'medium' ? 'bg-amber-950/40 border-amber-500/30 text-amber-200' : 'bg-slate-900/50 border-surfaceBorder/50 text-slate-300'}`}>
                    <div className="font-bold text-xs uppercase tracking-widest mb-1 opacity-80">{flag.reason.replace('_', ' ')}</div>
                    <div className="text-sm">{flag.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Concept Mastery */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-indigo-400" />
              Detailed Concept Mastery
            </h2>
            
            <div className="space-y-4">
              {PYTHON_CONCEPTS.map(concept => {
                const state = states.find(s => s.concept_id === concept.id);
                if (!state || state.status === 'NOT_ASSESSED') return null;

                return (
                  <div key={concept.id} className="bg-surfaceBorder/20 border border-surfaceBorder/50 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-white text-sm">{concept.name}</div>
                        <div className="text-xs text-slate-400 mt-1">Attempts: {state.attempt_count} | Correct: {state.correct_count}</div>
                      </div>
                      <div className={`text-sm font-bold px-2 py-1 rounded ${state.status === 'MASTERED' ? 'bg-emerald-500/20 text-emerald-400' : state.mastery_score < 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                        {state.mastery_score}%
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${state.status === 'MASTERED' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${state.mastery_score}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {activeConcepts.length === 0 && (
                <div className="text-center text-slate-500 py-8">No data available for this student yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && currentAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-surfaceBorder p-8 rounded-3xl max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setShowOverrideModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Override Recommendation</h2>
            <p className="text-slate-400 text-sm mb-6">Manually force the adaptive engine's behavior for this student.</p>
            
            <form onSubmit={handleOverrideSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Action</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={overrideForm.action}
                  onChange={e => setOverrideForm({...overrideForm, action: e.target.value as ActionType})}
                >
                  {Object.values(ActionType).map(action => (
                    <option key={action} value={action}>{action.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Concept</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={overrideForm.concept}
                  onChange={e => setOverrideForm({...overrideForm, concept: e.target.value})}
                >
                  {PYTHON_CONCEPTS.map(concept => (
                    <option key={concept.id} value={concept.id}>{concept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reason for Override (Required)</label>
                <textarea 
                  required
                  placeholder="e.g. Student demonstrated understanding during class activity."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                  value={overrideForm.reason}
                  onChange={e => setOverrideForm({...overrideForm, reason: e.target.value})}
                ></textarea>
              </div>

              {submitError && <div className="text-rose-400 text-sm">{submitError}</div>}

              <button 
                type="submit" 
                disabled={submitting || overrideForm.reason.length < 5}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {submitting ? 'Applying...' : 'Apply Override'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
