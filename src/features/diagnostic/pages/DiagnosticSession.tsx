import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PYTHON_QUESTIONS, PYTHON_CONCEPTS } from '../data/pythonDiagnostic';
import { saveAttempt } from '../services/attemptService';
import { completeDiagnosticSession } from '../services/diagnosticService';
import { generateInitialLearnerState } from '../services/learnerStateService';
import { useAuth } from '../../../contexts/AuthContext';
import { BrainCircuit, Loader2 } from 'lucide-react';
import type { DiagnosticAttempt } from '../types';

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

  const question = PYTHON_QUESTIONS[currentIndex];
  const concept = PYTHON_CONCEPTS.find(c => c.id === question?.concept_id);
  const progress = ((currentIndex) / PYTHON_QUESTIONS.length) * 100;

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  if (!question || !concept) return null;

  const handleNext = async (isSkip = false) => {
    if (!user || !sessionId) return;
    
    // Save evidence
    const responseTimeMs = Date.now() - questionStartTime;
    const isCorrect = isSkip ? false : (selectedAnswer === question.correct_answer);

    const attempt: Omit<DiagnosticAttempt, 'id' | 'created_at'> = {
      session_id: sessionId,
      student_id: user.id,
      question_id: question.id,
      concept_id: question.concept_id,
      correctness: isCorrect,
      difficulty: question.difficulty,
      response_time_ms: responseTimeMs,
      confidence: confidence || 3, // Default to 3 if skipped
      attempt_number: 1
    };

    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);
    
    // Fire and forget save to DB
    saveAttempt(attempt);

    if (currentIndex < PYTHON_QUESTIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer('');
      setConfidence(null);
    } else {
      // Complete diagnostic
      setIsSubmitting(true);
      
      await completeDiagnosticSession(sessionId);
      
      // Generate initial learner state
      // We pass the newAttempts array in so we don't need to re-fetch from the DB
      await generateInitialLearnerState(user.id, newAttempts);
      
      navigate(`/student/diagnostic/results/${sessionId}`, { state: { attempts: newAttempts }});
    }
  };

  if (isSubmitting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Analyzing your responses...</h2>
        <p className="text-slate-400">MasteryFlow is generating your initial concept map.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full pb-20">
      {/* Header & Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-slate-400 font-medium">Question {currentIndex + 1} of {PYTHON_QUESTIONS.length}</span>
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
            <BrainCircuit className="w-4 h-4" />
            {concept.name}
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
        <h2 className="text-2xl font-bold text-white mb-8">{question.text}</h2>

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
            {currentIndex === PYTHON_QUESTIONS.length - 1 ? 'Finish Assessment' : 'Submit & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
