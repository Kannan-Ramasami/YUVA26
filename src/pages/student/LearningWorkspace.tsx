import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, BookOpen, Terminal, CheckCircle2, AlertCircle, Lightbulb, FastForward, Play, ShieldAlert } from 'lucide-react';
import { PYTHON_CONCEPTS, PYTHON_QUESTIONS } from '../../features/diagnostic/data/pythonDiagnostic';
import { MasteryEngine } from '../../features/adaptive/masteryEngine';
import { AdaptiveDecisionEngine } from '../../features/adaptive/decisionEngine';
import { QuestionSelectionEngine } from '../../features/adaptive/practiceEngine';
import { ReviewService } from '../../features/adaptive/reviewEngine/reviewService';
import { conceptGraphService } from '../../features/graph/services/conceptGraphService';
import { ActionType } from '../../features/adaptive/decisionEngine/types';
import { GenerativeEducationalService } from '../../features/ai/services/generativeService';
import type { AIRequestType, AIResponse } from '../../features/ai/services/generativeService';
import type { LearnerConceptState, QuestionAttempt, LearningSession } from '../../types/evidence';
import type { Question } from '../../features/diagnostic/types';
import type { AdaptiveAction } from '../../features/adaptive/decisionEngine/types';
import { getLearnerState } from '../../services/unifiedLearnerModel';

const masteryEngine = new MasteryEngine();
const decisionEngine = new AdaptiveDecisionEngine();
const questionEngine = new QuestionSelectionEngine();
const reviewService = new ReviewService();
const aiService = new GenerativeEducationalService();

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
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [attemptedQuestionIds, setAttemptedQuestionIds] = useState<Set<string>>(new Set());
  
  // Attempt UI
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  // Post-attempt engine output
  const [recommendation, setRecommendation] = useState<AdaptiveAction | null>(null);
  
  // AI State
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [aiLoading, setAiLoading] = useState<AIRequestType | null>(null);
  
  // Teacher Override State
  const [teacherOverrideActive, setTeacherOverrideActive] = useState(false);

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
      
      
      // Select first question
      const targetState = data?.find(s => s.concept_id === conceptId);
      if (targetState && conceptQs.length > 0) {
        const firstQ = questionEngine.selectQuestion(conceptQs, {
          targetConcept: conceptId,
          learnerState: targetState,
          currentAction: ActionType.PRACTICE, // Default for first load
          attemptedQuestionIds: new Set()
        });
        setCurrentQuestion(firstQ);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [user, conceptId]);

  if (loading || !concept) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

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
    
    // Update local states array so decision engine has latest (mainly for UI display sync)
    const updatedStates = allStates.map(s => s.concept_id === conceptId ? newState : s);
    setAllStates(updatedStates);
    
    // 3. Adaptive Decision Engine calculates Next Action (Phase 4)
    // Wait for the ML predictions and BKT to be built into a unified state
    const unifiedState = await getLearnerState(user.id, 'sub_python');

    const decisionContext = {
      student_id: user.id,
      topic_id: 'sub_python',
      target_concept: conceptId!,
      learning_context: 'individual' as const,
      concept_graph: {
        getPrerequisites: conceptGraphService.getPrerequisites,
        getDependents: conceptGraphService.getDependents,
        checkPrerequisiteReadiness: conceptGraphService.checkPrerequisiteReadiness,
        getFirstWeakPrerequisite: conceptGraphService.getFirstWeakPrerequisite.bind(conceptGraphService)
      },
      unified_state: unifiedState,
      recent_attempts: [attempt],
      review_candidates: reviewService.getReviewCandidates(updatedStates, conceptId, conceptGraphService).map(c => c.conceptId)
    };

    const nextAction = decisionEngine.getNextBestAction(decisionContext);

    // Check for Teacher Override
    const { data: overrides } = await supabase
      .from('teacher_overrides')
      .select('*')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (overrides && overrides.length > 0) {
      const activeOverride = overrides[0];
      // Inject override into recommendation
      nextAction.action = activeOverride.override_action as ActionType;
      nextAction.target_concept = activeOverride.override_concept;
      nextAction.reason = `Your teacher assigned an additional activity.`;
      nextAction.priority = 1000; // Force to top
      setTeacherOverrideActive(true);
    } else {
      setTeacherOverrideActive(false);
    }

    // Phase 4: Generate and persist decision trace
    const decisionTrace = await decisionEngine.traceDecision(decisionContext, nextAction, '4.0');
    setRecommendation(decisionTrace);
    
    // 4. Update Supabase asynchronously
    await supabase.from('learner_concept_states').upsert(newState, { onConflict: 'student_id,concept_id' });
  };

  const handleAiRequest = async (type: AIRequestType) => {
    if (!concept || !activeState) return;
    setAiLoading(type);
    
    const response = await aiService.generateEducationalContent(type, {
      concept,
      subjectId: 'sub_python',
      learnerState: activeState,
      currentAction: recommendation?.action || ActionType.PRACTICE,
      currentQuestion: currentQuestion || undefined,
      selectedAnswer: selectedOption || undefined,
      learnerLevel: (recommendation as any)?.learner_level || undefined
    });
    
    setAiLoading(null);
    setAiResponse(response);

    if (type === 'NEW_PRACTICE' && response.newQuestion) {
      setQuestions(prev => [...prev, response.newQuestion!]);
      
      setAttemptedQuestionIds(prev => {
        const next = new Set(prev);
        if (currentQuestion) next.add(currentQuestion.id);
        return next;
      });

      setCurrentQuestion(response.newQuestion);
      setSelectedOption(null);
      setShowFeedback(false);
      setRecommendation(null);
      setAiResponse(null);
    }
  };

  const nextActivity = () => {
    if (!recommendation || !activeState || !conceptId) return;

    if (recommendation.target_concept !== conceptId) {
      // Jump to remediation or advance!
      navigate(`/student/learn/${recommendation.target_concept}`);
      return;
    }

    setAttemptedQuestionIds(prev => {
      const next = new Set(prev);
      if (currentQuestion) next.add(currentQuestion.id);
      return next;
    });

    const nextQ = questionEngine.selectQuestion(questions, {
      targetConcept: recommendation.target_concept,
      learnerState: activeState,
      currentAction: recommendation.action,
      attemptedQuestionIds: new Set([...Array.from(attemptedQuestionIds), currentQuestion?.id].filter(Boolean) as string[])
    });

    setCurrentQuestion(nextQ);
    setSelectedOption(null);
    setShowFeedback(false);
    setRecommendation(null);
    setAiResponse(null);
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
             <span className="text-sm text-slate-400">Activity {attemptedQuestionIds.size + 1}</span>
             <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min(((attemptedQuestionIds.size + 1) / 10) * 100, 100)}%`}}></div>
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
              
              {/* AI Lesson Helpers */}
              <div className="flex flex-wrap gap-3 mt-4 border-t border-surfaceBorder/50 pt-4">
                <button 
                  onClick={() => handleAiRequest('EXPLAIN_DIFFERENTLY')}
                  disabled={aiLoading !== null}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 border border-indigo-500/20 transition-colors disabled:opacity-50"
                >
                  <Lightbulb className="w-4 h-4" /> 
                  {aiLoading === 'EXPLAIN_DIFFERENTLY' ? 'Thinking...' : 'Explain Differently'}
                </button>
                <button 
                  onClick={() => handleAiRequest('GIVE_EXAMPLE')}
                  disabled={aiLoading !== null}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-bold py-2 px-4 rounded-lg flex items-center gap-2 border border-indigo-500/20 transition-colors disabled:opacity-50"
                >
                  <Terminal className="w-4 h-4" /> 
                  {aiLoading === 'GIVE_EXAMPLE' ? 'Thinking...' : 'Give me an example'}
                </button>
              </div>

              {/* Display AI Response for Lesson */}
              {aiResponse && ['EXPLAIN_DIFFERENTLY', 'GIVE_EXAMPLE'].includes(aiResponse.type) && (
                <div className="bg-indigo-950/40 p-5 rounded-2xl border border-indigo-500/30 animate-fade-in">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2 text-xs uppercase tracking-widest">
                    <Lightbulb className="w-4 h-4" /> AI Assistant
                  </div>
                  <p className="text-slate-200">{aiResponse.content}</p>
                </div>
              )}
            </div>
          )}

          {/* Practice Block */}
          {currentQuestion ? (
            <div className={`glass-panel p-6 sm:p-8 rounded-3xl border transition-colors duration-500 ${showFeedback ? isCorrect ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-rose-500/30 bg-rose-950/10' : 'border-surfaceBorder/50 shadow-xl'}`}>
               <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                 <Play className="w-5 h-5 text-indigo-400" />
                 Knowledge Check
               </h3>
               
               <p className="text-lg text-slate-200 mb-8 font-medium">
                 {currentQuestion.prompt || currentQuestion.text}
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
                 <div className="mt-8 flex justify-between items-center">
                   <button 
                     onClick={() => handleAiRequest('GIVE_HINT')}
                     disabled={aiLoading !== null}
                     className="text-amber-400 hover:text-amber-300 text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                   >
                     <Lightbulb className="w-4 h-4" />
                     {aiLoading === 'GIVE_HINT' ? 'Generating hint...' : 'Give me a hint'}
                   </button>
                   <button 
                     onClick={handleSubmit}
                     disabled={!selectedOption}
                     className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 px-8 rounded-xl transition-all"
                   >
                     Submit Answer
                   </button>
                 </div>
               )}
               
               {/* Display AI Hint */}
               {aiResponse && aiResponse.type === 'GIVE_HINT' && !showFeedback && (
                 <div className="mt-4 bg-amber-950/40 p-4 rounded-xl border border-amber-500/30 animate-fade-in">
                   <p className="text-amber-200 text-sm">{aiResponse.content}</p>
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
                             : `The correct answer was "${currentQuestion.correct_answer}". `
                           }
                           {currentQuestion.explanation && (
                             <span className="block mt-2 font-medium text-slate-200">
                               {currentQuestion.explanation}
                             </span>
                           )}
                         </p>
                         
                         {/* AI Incorrect Feedback helpers */}
                         {!isCorrect && (
                           <div className="mt-4">
                             <button
                               onClick={() => handleAiRequest('WHY_WRONG')}
                               disabled={aiLoading !== null}
                               className="text-rose-400 hover:text-rose-300 text-sm font-bold underline disabled:opacity-50"
                             >
                               {aiLoading === 'WHY_WRONG' ? 'Analyzing...' : 'Why was my answer wrong?'}
                             </button>
                           </div>
                         )}

                         {/* Display AI Explanation */}
                         {aiResponse && aiResponse.type === 'WHY_WRONG' && (
                           <div className="mt-4 bg-rose-950/40 p-4 rounded-xl border border-rose-500/30 animate-fade-in">
                             <div className="flex items-center gap-2 text-rose-400 font-bold mb-1 text-xs uppercase tracking-widest">
                               <Lightbulb className="w-3 h-3" /> AI Analysis
                             </div>
                             <p className="text-rose-200 text-sm">{aiResponse.content}</p>
                           </div>
                         )}
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
                         {teacherOverrideActive && (
                           <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl mb-4 text-amber-200 text-sm flex items-center gap-2">
                             <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                             <span><strong>Teacher Override:</strong> Your educator has prioritized this step for your learning path.</span>
                           </div>
                         )}
                         <p className="text-slate-300 italic bg-slate-900/50 p-4 rounded-xl border border-surfaceBorder/30">
                           "{recommendation.reason}"
                         </p>
                       </div>
                       
                       <div className="mt-6 flex flex-wrap justify-end gap-3 relative z-10">
                         {recommendation.action === ActionType.PRACTICE && (
                           <button 
                             onClick={() => handleAiRequest('NEW_PRACTICE')}
                             disabled={aiLoading !== null}
                             className="bg-surfaceBorder hover:bg-surfaceBorder/80 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                           >
                             {aiLoading === 'NEW_PRACTICE' ? 'Generating...' : 'Practice another generated question'}
                           </button>
                         )}
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
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-surfaceBorder/50 text-center">
               <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-white mb-2">You've completed all available activities!</h3>
               <p className="text-slate-400 mb-6">Check your learning path to see what's next.</p>
               <button 
                 onClick={() => navigate('/student/learning-path')}
                 className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
               >
                 Return to Path
               </button>
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
