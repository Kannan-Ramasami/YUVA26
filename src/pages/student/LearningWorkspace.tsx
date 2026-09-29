import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, BookOpen, Terminal, CheckCircle2, AlertCircle, Lightbulb, FastForward, Play, ShieldAlert } from 'lucide-react';
import { PYTHON_CONCEPTS, PYTHON_QUESTIONS } from '../../features/diagnostic/data/pythonDiagnostic';
import { MasteryEngine } from '../../features/adaptive/masteryEngine';
import { AdaptiveDecisionEngine } from '../../features/adaptive/decisionEngine';
import { conceptGraphService } from '../../features/graph/services/conceptGraphService';
import type { LearnerConceptState, QuestionAttempt, LearningSession } from '../../types/evidence';
import type { Question } from '../../features/diagnostic/types';
import type { AdaptiveAction } from '../../features/adaptive/decisionEngine/types';

const masteryEngine = new MasteryEngine();
const decisionEngine = new AdaptiveDecisionEngine();

export function LearningWorkspace() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<LearningSession | null>(null);
  
  // State maps
  const [allStates, setAllStates] = useState<LearnerConceptState[]>([]);
  
  // Local active question
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Attempt UI
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Post-attempt engine output
  const [recommendation, setRecommendation] = useState<AdaptiveAction | null>(null);
  
  const concept = PYTHON_CONCEPTS.find(c => c.id === conceptId);
  const activeState = allStates.find(s => s.concept_id === conceptId);

  useEffect(() => {
    if (!user || !conceptId) return;

    const loadData = async () => {
      // Fetch all states for the graph checks
      const { data } = await supabase
        .from('learner_concept_states')
        .select('*')
        .eq('student_id', user.id);
      
      if (data) setAllStates(data);
      
      const conceptQs = PYTHON_QUESTIONS.filter(q => q.concept_id === conceptId);
      setQuestions(conceptQs);
      
      // Start session
      setSession({
        id: crypto.randomUUID(),
        student_id: user.id,
        concept_id: conceptId,
        started_at: new Date().toISOString(),
        activity_count: 0,
        learning_mode: 'individual'
      });
      
      setLoading(false);
    };
    
    loadData();
  }, [user, conceptId]);

  if (loading || !concept) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const currentQuestion = questions[currentQuestionIdx];

  const handleSubmit = async () => {
    if (!selectedOption || !currentQuestion || !activeState || !user) return;
    
    const correct = selectedOption === currentQuestion.correct_answer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    // 1. Build Question Attempt (Evidence)
    const attempt: QuestionAttempt = {
      id: crypto.randomUUID(),
      student_id: user.id,
      concept_id: conceptId!,
      question_id: currentQuestion.id,
      session_id: session?.id,
      correctness: correct,
      difficulty: currentQuestion.difficulty as any,
      response_time_ms: 15000, // mock time
      confidence: 0.8, // mock confidence
      hint_used: false,
      attempt_number: 1,
      source: 'practice',
      timestamp: new Date().toISOString()
    };
    
    // 2. Mastery Engine updates learner state
    const { newState } = masteryEngine.updateMastery(activeState, attempt);
    
    // Update local states array so decision engine has latest
    const updatedStates = allStates.map(s => s.concept_id === conceptId ? newState : s);
    setAllStates(updatedStates);
    
    // 3. Adaptive Decision Engine calculates Next Action
    const stateMap = updatedStates.reduce((acc, state) => {
      acc[state.concept_id] = state;
      return acc;
    }, {} as Record<string, LearnerConceptState>);

    const nextAction = decisionEngine.getNextBestAction({
      student_id: user.id,
      target_concept: conceptId!,
      learning_context: 'individual',
      concept_graph: {
        getPrerequisites: conceptGraphService.getPrerequisites,
        getDependents: conceptGraphService.getDependents,
        checkPrerequisiteReadiness: conceptGraphService.checkPrerequisiteReadiness,
        getFirstWeakPrerequisite: conceptGraphService.getFirstWeakPrerequisite.bind(conceptGraphService)
      },
      learner_states: stateMap,
      recent_attempts: [attempt],
      review_candidates: []
    });

    setRecommendation(nextAction);
    
    // 4. Update Supabase asynchronously
    await supabase.from('learner_concept_states').upsert(newState, { onConflict: 'student_id,concept_id' });
  };

  const nextActivity = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setRecommendation(null);
    
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // Loop back or show completion
      setCurrentQuestionIdx(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col animate-fade-in">
      {/* Header */}
      <header className="border-b border-surfaceBorder/50 bg-slate-900/50 p-4 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-surfaceBorder/50 hover:bg-surfaceBorder rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
               <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Subject: Python 101</div>
               <h1 className="text-xl font-bold text-white flex items-center gap-2">
                 <BookOpen className="w-5 h-5 text-indigo-400" />
                 {concept.name}
               </h1>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-3">
             <span className="text-sm text-slate-400">Activity {currentQuestionIdx + 1} of {questions.length}</span>
             <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%`}}></div>
             </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full grid lg:grid-cols-4 gap-8 p-4 sm:p-6 lg:p-8">
        
        {/* Main Content Area (3 cols) */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Lesson Concept Block */}
          {!showFeedback && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-surfaceBorder/50 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-bold text-white">Concept Lesson</h2>
              </div>
              <p className="text-slate-300 leading-relaxed text-lg">
                {concept.description}
                <br /><br />
                This is a mock interactive lesson block. In a full implementation, this area renders markdown, code playgrounds, or instructional videos explaining the specific nuances of <strong>{concept.name}</strong> before transitioning directly into practice.
              </p>
            </div>
          )}

          {/* Practice Block */}
          {currentQuestion && (
            <div className={`glass-panel p-6 sm:p-8 rounded-3xl border transition-colors duration-500 ${showFeedback ? isCorrect ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10' : 'border-surfaceBorder/50 shadow-xl'}`}>
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <Play className="w-5 h-5 text-indigo-400" />
                 Knowledge Check
               </h3>
               
               <p className="text-lg text-slate-200 mb-8 font-medium">
                 {currentQuestion.text}
               </p>
               
               <div className="space-y-3">
                 {currentQuestion.options?.map((option, idx) => {
                   const isSelected = selectedOption === option;
                   let btnStyle = "bg-surfaceBorder/30 hover:bg-surfaceBorder/60 border-transparent hover:border-slate-600 text-slate-300";
                   
                   if (showFeedback) {
                     if (option === currentQuestion.correct_answer) {
                       btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-100 font-bold";
                     } else if (isSelected) {
                       btnStyle = "bg-rose-500/20 border-rose-500/50 text-rose-100 font-bold";
                     } else {
                       btnStyle = "bg-slate-800/30 border-transparent text-slate-600 opacity-50";
                     }
                   } else if (isSelected) {
                     btnStyle = "bg-indigo-500/20 border-indigo-500/50 text-white font-bold";
                   }
                   
                   return (
                     <button
                       key={idx}
                       disabled={showFeedback}
                       onClick={() => setSelectedOption(option)}
                       className={`w-full text-left p-4 rounded-xl border-2 transition-all ${btnStyle}`}
                     >
                       {option}
                     </button>
                   );
                 })}
               </div>
               
               {!showFeedback && (
                 <div className="mt-8 flex justify-end">
                   <button 
                     onClick={handleSubmit}
                     disabled={!selectedOption}
                     className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-8 rounded-xl transition-all"
                   >
                     Submit Answer
                   </button>
                 </div>
               )}

               {/* Feedback & Recommendation Block */}
               {showFeedback && recommendation && (
                 <div className="mt-8 pt-8 border-t border-surfaceBorder/50 space-y-6 animate-fade-in-up">
                    <div className="flex gap-4">
                      <div className="shrink-0 pt-1">
                        {isCorrect ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <AlertCircle className="w-8 h-8 text-rose-400" />}
                      </div>
                      <div>
                         <h4 className={`text-xl font-bold mb-2 ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {isCorrect ? 'Correct!' : 'Incorrect'}
                         </h4>
                         <p className="text-slate-300">
                           {isCorrect 
                             ? "Great job! Your evidence has been recorded."
                             : `The correct answer was "${currentQuestion.correct_answer}". Review the lesson notes above if you're stuck.`
                           }
                         </p>
                      </div>
                    </div>

                    <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                         <ShieldAlert className="w-32 h-32 text-indigo-500" />
                       </div>
                       
                       <div className="relative z-10">
                         <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold uppercase tracking-widest text-xs">
                           <Lightbulb className="w-4 h-4" /> Adaptive Engine Recommendation
                         </div>
                         <h3 className="text-2xl font-bold text-white mb-2">
                           What's next: <span className="text-indigo-400">{recommendation.action.replace('_', ' ')}</span>
                         </h3>
                         <p className="text-slate-300 italic bg-slate-900/50 p-4 rounded-xl border border-surfaceBorder/30">
                           "{recommendation.reason}"
                         </p>
                       </div>
                       
                       <div className="mt-6 flex justify-end relative z-10">
                         <button 
                           onClick={nextActivity}
                           className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] transition-all hover:scale-105"
                         >
                           Continue Path <FastForward className="w-4 h-4" />
                         </button>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Right Sidebar (1 col) */}
        <div className="lg:col-span-1">
           <div className="sticky top-28 space-y-6">
             
             {/* Mastery Snapshot */}
             <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50">
               <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Mastery Snapshot</h3>
               <div className="flex justify-between items-end mb-2">
                  <span className="text-4xl font-bold text-white">{activeState?.mastery_score || 0}<span className="text-xl text-slate-500 font-normal">%</span></span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${activeState?.status === 'MASTERED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {activeState?.status || 'NOT_ASSESSED'}
                  </span>
               </div>
               <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
                 <div className={`h-full transition-all duration-1000 ${activeState?.status === 'MASTERED' ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${activeState?.mastery_score || 0}%` }}></div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 text-center border-t border-surfaceBorder/50 pt-4">
                 <div>
                   <div className="text-xl font-bold text-white">{activeState?.attempt_count || 0}</div>
                   <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Attempts</div>
                 </div>
                 <div>
                   <div className="text-xl font-bold text-white">{Math.round((1 - (activeState?.uncertainty || 0)) * 100)}%</div>
                   <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Confidence</div>
                 </div>
               </div>
             </div>

             {/* Why this lesson */}
             <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50 bg-slate-900/50">
               <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-widest flex items-center gap-2">
                 <Lightbulb className="w-4 h-4 text-amber-400" />
                 Context
               </h3>
               <p className="text-xs text-slate-400 leading-relaxed">
                 You are currently learning <strong>{concept.name}</strong>. This concept is required before you can unlock advanced topics like {conceptGraphService.getDependents(concept.id).map(d => PYTHON_CONCEPTS.find(c => c.id === d.concept_id)?.name).filter(Boolean).join(', ')}.
               </p>
             </div>

           </div>
        </div>
      </div>
    </div>
  );
}
