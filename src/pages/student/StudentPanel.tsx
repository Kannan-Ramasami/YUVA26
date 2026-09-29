import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, BookOpen, Target, BrainCircuit } from 'lucide-react';

export function StudentPanel() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center animate-fade-in-up">
        
        <div className="mx-auto w-20 h-20 bg-primary-500/10 rounded-3xl flex items-center justify-center border border-primary-500/20 mb-8">
          <GraduationCap className="w-10 h-10 text-primary-400" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Welcome to the Student Portal
        </h1>
        
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
          Learn individually or join a classroom. MasteryFlow builds a personalized learning path that adapts dynamically to your performance, memory, and prerequisite gaps.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
          <div className="glass-panel p-6 rounded-2xl border-primary-500/20">
            <BookOpen className="w-8 h-8 text-primary-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Learn at your pace</h3>
            <p className="text-sm text-slate-400">Follow a path designed specifically for your current knowledge level.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-primary-500/20">
            <Target className="w-8 h-8 text-primary-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Master concepts</h3>
            <p className="text-sm text-slate-400">Ensure you have strong foundations before moving to advanced topics.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-primary-500/20">
            <BrainCircuit className="w-8 h-8 text-primary-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Evidence-based</h3>
            <p className="text-sm text-slate-400">The system learns how you learn, tracking your mastery over time.</p>
          </div>
        </div>

        <Link 
          to="/student/login"
          className="btn-primary inline-flex items-center gap-2 px-10 py-4 text-lg rounded-full"
        >
          Sign In to Learn
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
