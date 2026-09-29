import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { saveAttempt } from '../services/attemptService';
import { completeDiagnosticSession } from '../services/diagnosticService';
import { generateInitialLearnerState } from '../services/learnerStateService';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';
import type { DiagnosticAttempt, Question } from '../types';
import { GenerativeEducationalService } from '../../ai/services/generativeService';

export function DiagnosticSession() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState<DiagnosticAttempt[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const question = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  useEffect(() => {
    async function loadQuestions() {
      const topicName = localStorage.getItem('masteryflow_current_topic_name') || 'Python';
      const ai = new GenerativeEducationalService();
      try {
        const response = await ai.generateEducationalContent('GENERATE_DIAGNOSTIC', {
          subjectId: topicName,
          topicName: topicName,
          learnerState: null as any,
          currentAction: 'ADVANCE'
        });
        
        if (response.diagnosticQuestions && response.diagnosticQuestions.length > 0) {
          setQuestions(response.diagnosticQuestions);
        } else {
           throw new Error("No diagnostic questions generated");
        }
      } catch (e) {
        console.error("Failed to generate diagnostic", e);
        // Fallback to basic if AI fails
        setQuestions([{
          id: 'fallback_1',
          concept_id: 'fallback',
          concept_name: 'Basic Knowledge',
          type: 'MCQ',
          difficulty: 'easy',
          prompt: `What is the core idea of ${topicName}?`,
          text: `What is the core idea of ${topicName}?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_answer: 'Option A'
        } as any]);
      } finally {
        setIsLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, [sessionId]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  if (!question) return null;

  const handleNext = async (isSkip = false) => {
    if (!user || !sessionId) return;
    
    // ML Foundation Phase 1: Topic and Hint Tracking
    const currentTopicId = localStorage.getItem('masteryflow_current_topic_name') || 'sub_python';
    
    // Save evidence
    const responseTimeMs = Date.now() - questionStartTime;
    const isCorrect = isSkip ? false : (selectedAnswer === question.correct_answer);

    // Calculate attempt_number to track retries properly for ML (do not overwrite)
    const previousAttemptsForThisQuestion = attempts.filter(a => a.question_id === question.id).length;
    const attemptNumber = previousAttemptsForThisQuestion + 1;

    const attempt: Omit<DiagnosticAttempt, 'id' | 'created_at'> = {
      session_id: sessionId,
      student_id: user.id,
      question_id: question.id,
      concept_id: question.concept_id,
      topic_id: currentTopicId, // Track topic_id
      correctness: isCorrect,
      difficulty: question.difficulty,
      response_time_ms: Math.max(0, responseTimeMs), // Validation
      confidence: confidence || 3, // Default to 3 if skipped
      hint_used: false, // Hints are not available in diagnostic yet, safely default to false
      attempt_number: attemptNumber
    };

    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);
    
    // Fire and forget save to DB
    saveAttempt(attempt);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer('');
      setConfidence(null);
    } else {
      // Complete diagnostic
      setIsSubmitting(true);
      
      await completeDiagnosticSession(sessionId);
      
      // Generate initial learner state & ML Prediction
      // We pass the newAttempts array in so we don't need to re-fetch from the DB
      const { prediction } = await generateInitialLearnerState(user.id, newAttempts, currentTopicId);
      
      navigate(`/student/diagnostic/results/${sessionId}`, { state: { attempts: newAttempts, prediction, questions }});
    }
  };

  if (isSubmitting || isLoadingQuestions) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">
          {isLoadingQuestions ? 'Building your diagnostic...' : 'Analyzing your responses...'}
        </h2>
        <p className="text-slate-400">
          {isLoadingQuestions 
             ? 'MasteryFlow is generating tailored questions for your topic using AI.'
             : 'MasteryFlow is generating your initial concept map.'}
        </p>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="max-w-3xl mx-auto w-full pb-20">
      {/* Header & Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-slate-400 font-medium">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-primary-400 font-bold">{Math.round(progress)}% Completed</span>
        </div>
        <div className="w-full h-2 bg-surfaceBorder rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl">
        {/* Question Metadata */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-surfaceBorder/50">
          <div className="flex items-center gap-2 text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-lg text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            {question.metadata?.topic || 'Topic'} &mdash; {(question as any).concept_name || question.concept_id}
          </div>
          <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
            question.difficulty === 'hard' ? 'bg-rose-500/10 text-rose-400' : 
            question.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400' : 
            'bg-emerald-500/10 text-emerald-400'
          }`}>
            {question.difficulty}
          </div>
        </div>

        {/* Question Text */}
        <h2 className="text-2xl font-bold text-white mb-8">{question.prompt || question.text}</h2>

        {/* Answer Options */}
        {question.type === 'multiple_choice' || question.type === 'true_false' ? (
          <div className="space-y-3 mb-10">
            {question.options?.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedAnswer(option)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedAnswer === option 
                    ? 'bg-primary-500/20 border-primary-500 text-white' 
                    : 'bg-surfaceBorder/30 border-surfaceBorder/50 text-slate-300 hover:bg-surfaceBorder hover:border-slate-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-10">
            <input
              type="text"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full bg-surfaceBorder/50 border border-surfaceBorder rounded-xl px-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Confidence (Optional) */}
        {selectedAnswer && (
          <div className="mb-10 animate-fade-in-up">
            <label className="block text-sm font-medium text-slate-400 mb-4 text-center">How confident are you in this answer?</label>
            <div className="flex justify-between gap-2 max-w-md mx-auto">
              {[
                { val: 1, label: 'Very unsure' },
                { val: 2, label: 'Unsure' },
                { val: 3, label: 'Somewhat' },
                { val: 4, label: 'Confident' },
                { val: 5, label: 'Very confident' }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setConfidence(opt.val)}
                  className={`flex-1 py-3 rounded-lg text-xs font-medium transition-colors border ${
                    confidence === opt.val
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                      : 'bg-surfaceBorder/30 border-surfaceBorder/50 text-slate-400 hover:bg-surfaceBorder'
                  }`}
                >
                  <div className="hidden sm:block">{opt.label}</div>
                  <div className="sm:hidden">{opt.val}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-surfaceBorder/50">
          <button 
            onClick={() => handleNext(true)}
            className="text-slate-400 hover:text-white px-4 py-2 font-medium transition-colors"
          >
            Skip Question
          </button>
          
          <button
            onClick={() => handleNext(false)}
            disabled={!selectedAnswer}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:hover:bg-primary-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg"
          >
            {currentIndex === questions.length - 1 ? 'Finish Assessment' : 'Submit & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
