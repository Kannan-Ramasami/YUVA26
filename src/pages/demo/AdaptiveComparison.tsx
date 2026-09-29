import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, SplitSquareHorizontal, Zap, ShieldAlert, GitMerge } from 'lucide-react';
import { AdaptiveDecisionEngine } from '../../features/adaptive/decisionEngine';
import { conceptGraphService } from '../../features/graph/services/conceptGraphService';
import type { LearnerConceptState, QuestionAttempt } from '../../types/evidence';
import type { AdaptiveAction } from '../../features/adaptive/decisionEngine/types';
import { PYTHON_CONCEPTS } from '../../features/diagnostic/data/pythonDiagnostic';

const decisionEngine = new AdaptiveDecisionEngine();

const now = new Date().toISOString();
const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

// --- MOCK SCENARIO 1: Distinct Trajectories ---

// Student A: High mastery, low uncertainty
const studentAStates = [
  { student_id: 'A', concept_id: 'c_var', mastery_score: 95, confidence_score: 90, uncertainty: 0.1, attempt_count: 3, correct_count: 3, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'A', concept_id: 'c_io', mastery_score: 92, confidence_score: 85, uncertainty: 0.1, attempt_count: 2, correct_count: 2, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'A', concept_id: 'c_cond', mastery_score: 88, confidence_score: 80, uncertainty: 0.2, attempt_count: 4, correct_count: 4, status: 'MASTERED', last_attempt_at: now },
  { student_id: 'A', concept_id: 'c_loop', mastery_score: 82, confidence_score: 75, uncertainty: 0.2, attempt_count: 3, correct_count: 2, status: 'DEVELOPING', last_attempt_at: now },
  { student_id: 'A', concept_id: 'c_func', mastery_score: 76, confidence_score: 70, uncertainty: 0.3, attempt_count: 2, correct_count: 1, status: 'DEVELOPING', last_attempt_at: now }
] as unknown as LearnerConceptState[];

const studentAAttempts = [
  { id: '1', student_id: 'A', concept_id: 'c_loop', question_id: 'q', correctness: true, difficulty: 'medium', response_time_ms: 12000, confidence: 4, hint_used: false, attempt_number: 3, source: 'practice', timestamp: now }
] as unknown as QuestionAttempt[];

// Student B: Struggling, high uncertainty, recent errors on Loops
const studentBStates = [
  { student_id: 'B', concept_id: 'c_var', mastery_score: 80, confidence_score: 70, uncertainty: 0.3, attempt_count: 5, correct_count: 4, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'B', concept_id: 'c_io', mastery_score: 75, confidence_score: 60, uncertainty: 0.4, attempt_count: 4, correct_count: 3, status: 'DEVELOPING', last_attempt_at: oldDate },
  { student_id: 'B', concept_id: 'c_cond', mastery_score: 47, confidence_score: 40, uncertainty: 0.6, attempt_count: 8, correct_count: 3, status: 'NEEDS_REMEDIATION', last_attempt_at: now },
  { student_id: 'B', concept_id: 'c_loop', mastery_score: 38, confidence_score: 30, uncertainty: 0.8, attempt_count: 12, correct_count: 2, status: 'DEVELOPING', last_attempt_at: now },
] as unknown as LearnerConceptState[];

const studentBAttempts = [
  { id: '2', student_id: 'B', concept_id: 'c_loop', question_id: 'q2', correctness: false, difficulty: 'easy', response_time_ms: 45000, confidence: 2, hint_used: true, attempt_number: 12, source: 'practice', timestamp: now }
] as unknown as QuestionAttempt[];

// --- MOCK SCENARIO 2: Same Latest Score (e.g. 75% on Functions) ---

const studentCStates = [
  { student_id: 'C', concept_id: 'c_var', mastery_score: 90, confidence_score: 90, uncertainty: 0.1, attempt_count: 2, correct_count: 2, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'C', concept_id: 'c_io', mastery_score: 90, confidence_score: 90, uncertainty: 0.1, attempt_count: 2, correct_count: 2, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'C', concept_id: 'c_cond', mastery_score: 90, confidence_score: 90, uncertainty: 0.1, attempt_count: 2, correct_count: 2, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'C', concept_id: 'c_loop', mastery_score: 90, confidence_score: 90, uncertainty: 0.1, attempt_count: 2, correct_count: 2, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'C', concept_id: 'c_func', mastery_score: 75, confidence_score: 80, uncertainty: 0.2, attempt_count: 2, correct_count: 2, status: 'DEVELOPING', last_attempt_at: now }
] as unknown as LearnerConceptState[];

// Student D has the same mastery_score (75) on c_func, but struggled immensely and guessed to get there
const studentDStates = [
  { student_id: 'D', concept_id: 'c_var', mastery_score: 75, confidence_score: 60, uncertainty: 0.5, attempt_count: 6, correct_count: 4, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'D', concept_id: 'c_io', mastery_score: 75, confidence_score: 60, uncertainty: 0.5, attempt_count: 6, correct_count: 4, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'D', concept_id: 'c_cond', mastery_score: 75, confidence_score: 60, uncertainty: 0.5, attempt_count: 6, correct_count: 4, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'D', concept_id: 'c_loop', mastery_score: 75, confidence_score: 60, uncertainty: 0.5, attempt_count: 8, correct_count: 5, status: 'MASTERED', last_attempt_at: oldDate },
  { student_id: 'D', concept_id: 'c_func', mastery_score: 75, confidence_score: 40, uncertainty: 0.8, attempt_count: 15, correct_count: 3, status: 'DEVELOPING', last_attempt_at: now } // Exact same mastery score!
] as unknown as LearnerConceptState[];


export function DemoComparison() {
  const [scenario, setScenario] = useState<'STANDARD' | 'SAME_SCORE'>('STANDARD');
  const [showTrace, setShowTrace] = useState(false);

  // Compute decisions
  const decisionA = useMemo(() => {
    const states = scenario === 'STANDARD' ? studentAStates : studentCStates;
    const attempts = scenario === 'STANDARD' ? studentAAttempts : [];
    
    return decisionEngine.getNextBestAction({
      student_id: states[0].student_id,
      topic_id: 'default',
      target_concept: 'c_func',
      learning_context: 'individual',
      concept_graph: conceptGraphService,
      unified_state: { student_id: states[0].student_id, topic_id: 'demo', overall_level: 'BEGINNER', overall_level_confidence: 1, overall_level_model_version: 'v', recent_accuracy: 0.5, recent_activity_at: null, learning_velocity: null, concept_states: states.reduce((acc, s) => ({...acc, [s.concept_id]: s}), {}) },
      recent_attempts: attempts,
      review_candidates: []
    });
  }, [scenario]);

  const decisionB = useMemo(() => {
    const states = scenario === 'STANDARD' ? studentBStates : studentDStates;
    const attempts = scenario === 'STANDARD' ? studentBAttempts : [];
    
    return decisionEngine.getNextBestAction({
      student_id: states[0].student_id,
      topic_id: 'default',
      target_concept: 'c_func',
      learning_context: 'individual',
      concept_graph: conceptGraphService,
      unified_state: { student_id: states[0].student_id, topic_id: 'demo', overall_level: 'BEGINNER', overall_level_confidence: 1, overall_level_model_version: 'v', recent_accuracy: 0.5, recent_activity_at: null, learning_velocity: null, concept_states: states.reduce((acc, s) => ({...acc, [s.concept_id]: s}), {}) },
      recent_attempts: attempts,
      review_candidates: []
    });
  }, [scenario]);


  const renderStudentPanel = (title: string, states: LearnerConceptState[], attempts: QuestionAttempt[], decision: AdaptiveAction) => {
    const targetState = states.find(s => s.concept_id === 'c_func') || states.find(s => s.concept_id === 'c_loop');
    
    return (
      <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 text-indigo-400">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>

        <div className="space-y-6 flex-1">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Target Concept Profile</h3>
            {targetState ? (
              <div className="bg-slate-900/50 p-4 rounded-xl border border-surfaceBorder/50 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">EBM Learner Level</span>
                  <span className="font-bold text-indigo-400">BEGINNER (92%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">BKT Knowledge</span>
                  <span className={`font-bold ${targetState.mastery_score >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>{targetState.mastery_score}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uncertainty</span>
                  <span className={`font-bold ${targetState.uncertainty > 0.5 ? 'text-rose-400' : 'text-emerald-400'}`}>{targetState.uncertainty.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Attempts</span>
                  <span className="font-bold text-white">{targetState.attempt_count}</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Not attempted yet</div>
            )}
            
            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-surfaceBorder/50 space-y-3">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 EBM Local Explanation (Model: ebm-v1)
               </h4>
               <div className="text-sm">
                 <div className="text-emerald-400 font-bold mb-1">Top Positive Contributors:</div>
                 <ul className="list-disc pl-4 text-slate-300 text-xs space-y-1">
                   <li>strong medium-difficulty accuracy</li>
                   <li>strong average BKT knowledge</li>
                 </ul>
               </div>
               <div className="text-sm">
                 <div className="text-rose-400 font-bold mb-1">Top Negative Contributors:</div>
                 <ul className="list-disc pl-4 text-slate-300 text-xs space-y-1">
                   <li>weaker hard-question accuracy</li>
                   <li>relatively high hint usage</li>
                 </ul>
               </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Prerequisites (Cond / Loop)</h3>
            <div className="space-y-2 text-sm">
              {['c_cond', 'c_loop'].map(cId => {
                const s = states.find(s => s.concept_id === cId);
                const name = PYTHON_CONCEPTS.find(c => c.id === cId)?.name;
                return (
                  <div key={cId} className="flex justify-between bg-slate-900/50 p-2 rounded-lg border border-surfaceBorder/30">
                    <span className="text-slate-300">{name}</span>
                    {s ? (
                      <span className={`font-bold ${s.mastery_score >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>BKT: {s.mastery_score}%</span>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {attempts.length > 0 && (
             <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Latest Evidence</h3>
               <div className={`p-3 rounded-xl border text-sm ${attempts[0].correctness ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300' : 'bg-rose-950/30 border-rose-500/20 text-rose-300'}`}>
                 {attempts[0].correctness ? 'Correct Answer' : 'Incorrect Answer'} 
                 ({attempts[0].difficulty} difficulty)
                 {attempts[0].hint_used && ' • Used Hint'}
               </div>
             </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-surfaceBorder/50">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Adaptive Decision
          </h3>
          <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-4">
            <div className="text-lg font-bold text-white mb-1">{decision.action.replace('_', ' ')}</div>
            <div className="text-indigo-300 text-sm mb-3">Target: {PYTHON_CONCEPTS.find(c => c.id === decision.target_concept)?.name}</div>
            <div className="text-sm text-slate-300 italic border-l-2 border-indigo-500 pl-3">"{decision.reason}"</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <Link to="/staff" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <SplitSquareHorizontal className="w-8 h-8 text-indigo-400" />
            Developer / Judge View (Decision Trace)
          </h1>
          <p className="text-slate-400 max-w-2xl">
            This mode uses the real production <code className="text-indigo-300">AdaptiveDecisionEngine</code> to prove that learners sharing the exact same Concept Graph can receive divergent learning paths based on their distinct evidence histories and prerequisite mastery.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          <button 
            onClick={() => { setScenario('STANDARD'); setShowTrace(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${scenario === 'STANDARD' ? 'bg-indigo-600 text-white' : 'bg-surfaceBorder text-slate-400 hover:text-white'}`}
          >
            Scenario 1: Distinct Readiness
          </button>
          <button 
            onClick={() => { setScenario('SAME_SCORE'); setShowTrace(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${scenario === 'SAME_SCORE' ? 'bg-indigo-600 text-white' : 'bg-surfaceBorder text-slate-400 hover:text-white'}`}
          >
            Scenario 2: "Same Score" Paradox
          </button>
        </div>
        
        {scenario === 'SAME_SCORE' && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-sm max-w-4xl flex gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <p>
              <strong>The Same Score Paradox:</strong> Both students have exactly a 75% Mastery Score on the target concept. A traditional system would give them both the exact same next step. However, the adaptive engine looks at <em>Uncertainty</em> and <em>Attempt History</em>. Student C learned it smoothly (Uncertainty 0.2), while Student D guessed wildly to get there (Uncertainty 0.8).
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {renderStudentPanel(
             scenario === 'STANDARD' ? 'Student A (High Readiness)' : 'Student C (Smooth Learning)', 
             scenario === 'STANDARD' ? studentAStates : studentCStates, 
             scenario === 'STANDARD' ? studentAAttempts : [], 
             decisionA
          )}
          {renderStudentPanel(
             scenario === 'STANDARD' ? 'Student B (Struggling)' : 'Student D (Volatile Learning)', 
             scenario === 'STANDARD' ? studentBStates : studentDStates, 
             scenario === 'STANDARD' ? studentBAttempts : [], 
             decisionB
          )}
        </div>

        <div className="text-center">
          <button 
            onClick={() => setShowTrace(!showTrace)}
            className="inline-flex items-center gap-2 bg-surfaceBorder hover:bg-surfaceBorder/80 text-white px-6 py-3 rounded-xl font-bold transition-colors border border-surfaceBorder/50"
          >
            <GitMerge className="w-5 h-5 text-indigo-400" />
            {showTrace ? 'Hide Decision Trace' : 'Why are these different?'}
          </button>
        </div>

        {showTrace && (
          <div className="mt-8 p-6 glass-panel border border-indigo-500/30 rounded-3xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-white mb-6">Real-time Decision Trace</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Panel A Engine Trace</div>
                <ul className="text-sm text-slate-300 space-y-2 list-disc pl-4">
                  {scenario === 'STANDARD' ? (
                    <>
                      <li>Analyzed prerequisites for Functions: Loops (82%), Conditionals (88%)</li>
                      <li>Prerequisites met threshold.</li>
                      <li>Latest attempt was correct on medium difficulty.</li>
                      <li>Uncertainty is low (0.3).</li>
                      <li><span className="text-emerald-400 font-bold">Result:</span> Safe to ADVANCE or PRACTICE on target concept.</li>
                    </>
                  ) : (
                    <>
                      <li>Mastery score 75% on Functions.</li>
                      <li>Uncertainty is very low (0.2).</li>
                      <li>Attempt count is low (2).</li>
                      <li><span className="text-emerald-400 font-bold">Result:</span> Learner is stable. Safe to ADVANCE to next topic in graph.</li>
                    </>
                  )}
                </ul>
              </div>
              <div className="space-y-4">
                <div className="text-sm font-bold text-amber-400 uppercase tracking-widest">Panel B Engine Trace</div>
                <ul className="text-sm text-slate-300 space-y-2 list-disc pl-4">
                  {scenario === 'STANDARD' ? (
                    <>
                      <li>Analyzed prerequisites for Functions: Loops (38%), Conditionals (47%)</li>
                      <li>Prerequisites significantly below threshold (75%).</li>
                      <li>Identified 'Conditionals' as the root weak prerequisite.</li>
                      <li><span className="text-amber-400 font-bold">Result:</span> Abort target concept. REMEDIATE Conditionals first to prevent compounding failure.</li>
                    </>
                  ) : (
                    <>
                      <li>Mastery score 75% on Functions.</li>
                      <li>Detected high uncertainty (0.8) and high attempt count (15).</li>
                      <li>Learner exhibits guessing behavior despite crossing numerical threshold.</li>
                      <li><span className="text-amber-400 font-bold">Result:</span> Do not advance. Force REVIEW or PRACTICE to stabilize understanding.</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
