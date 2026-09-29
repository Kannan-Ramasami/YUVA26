import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, Sparkles, BrainCircuit, Search, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { setLearningContext } from '../../services/learningContextManager';
import { startDiagnosticSession } from '../../features/diagnostic/services/diagnosticService';

const DAILY_THOUGHTS = [
  "Small progress every day adds up to big mastery.",
  "Fun fact: Your brain strengthens learning when you actively recall information instead of only rereading it.",
  "Every difficult concept becomes easier when you break it into smaller ideas.",
  "Mistakes are just proof that you are trying and learning.",
  "The best way to learn is by connecting new ideas to what you already know."
];

export function IndividualLearningSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [loadingState, setLoadingState] = useState<string | null>(null);
  const [dailyThought, setDailyThought] = useState('');

  useEffect(() => {
    // Select a pseudo-random thought for the day
    const index = new Date().getDay() % DAILY_THOUGHTS.length;
    setDailyThought(DAILY_THOUGHTS[index]);
  }, []);

  const handleStartLearning = async () => {
    if (!user || !topic.trim()) return;
    
    // Simulated Topic Understanding & Preparation Flow
    setLoadingState('Understanding topic...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoadingState('Mapping to concept graph...');
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    setLoadingState('Preparing diagnostic assessment...');
    
    // Map the freeform topic to a dynamic ID (in a real app, this would be an API call)
    const topicId = 'dynamic_topic_' + topic.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Set the learning context to Individual mode for this new topic
    await setLearningContext(user.id, 'individual', topicId, null);
    
    // Store the raw topic name in localStorage so the diagnostic/results can use it
    localStorage.setItem('masteryflow_current_topic_name', topic.trim());
    
    // Actually create the diagnostic session record
    const session = await startDiagnosticSession(user.id, topicId);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Route directly to diagnostic assessment session
    navigate(`/student/diagnostic/session/${session.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in-up pb-12 pt-8">
      {/* 
        Note: The page-level "Back to Dashboard" has been removed as requested.
        The global Back button in the layout handles navigation. 
      */}

      {/* Panda / Robot Companion Area */}
      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 mb-6 relative">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
          <Bot className="w-12 h-12 text-indigo-400 relative z-10" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-surface border-2 border-surfaceBorder rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-3 h-3 text-emerald-400" />
          </div>
        </div>
        
        {/* Daily Thought Speech Bubble */}
        <div className="relative bg-surfaceBorder/50 border border-white/10 rounded-2xl p-4 max-w-sm mb-8 shadow-lg">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-surfaceBorder/50 border-t border-l border-white/10 transform rotate-45"></div>
          <p className="text-sm text-slate-300 relative z-10 italic">
            "{dailyThought}"
          </p>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          What would you like to learn today?
        </h1>
        <p className="text-slate-400 max-w-xl">
          Tell MasteryFlow what you want to study. We'll build a personalized path based on your current understanding.
        </p>
      </div>

      {/* Topic Input Area */}
      <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] border-primary-500/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="mb-6">
            <label htmlFor="topic-input" className="block text-sm font-medium text-slate-300 mb-3 ml-2">
              Topic or Skill
            </label>
            <div className="relative">
              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Python loops, SQL, DSA, machine learning, networking..."
                className="w-full bg-white text-slate-900 placeholder-slate-400 px-6 py-5 rounded-2xl text-lg font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/30 shadow-inner"
                disabled={loadingState !== null}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && topic.trim() && !loadingState) {
                    handleStartLearning();
                  }
                }}
              />
            </div>
          </div>

          {loadingState ? (
            <div className="bg-surfaceBorder/40 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 animate-pulse">
              <div className="flex gap-4 mb-2">
                <Search className={`w-6 h-6 ${loadingState.includes('Understanding') ? 'text-primary-400' : 'text-slate-500'}`} />
                <Database className={`w-6 h-6 ${loadingState.includes('Mapping') ? 'text-indigo-400' : 'text-slate-500'}`} />
                <BrainCircuit className={`w-6 h-6 ${loadingState.includes('Preparing') ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <p className="text-white font-medium text-center">{loadingState}</p>
            </div>
          ) : (
            <button
              onClick={handleStartLearning}
              disabled={!topic.trim()}
              className="w-full btn-primary py-5 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
            >
              Start Learning
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
