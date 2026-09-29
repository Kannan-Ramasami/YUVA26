import { Link } from 'react-router-dom';
import { Users, ArrowRight, LineChart, AlertOctagon, GraduationCap } from 'lucide-react';

export function MentorPanel() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center animate-fade-in-up">
        
        <div className="mx-auto w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 mb-8">
          <Users className="w-10 h-10 text-indigo-400" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Welcome to the Mentor Portal
        </h1>
        
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
          Create classrooms, manage students, and monitor real mastery. MasteryFlow gives you intelligent insights so you know exactly when and how to intervene.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
          <div className="glass-panel p-6 rounded-2xl border-indigo-500/20">
            <LineChart className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Track real mastery</h3>
            <p className="text-sm text-slate-400">Go beyond simple scores. See true prerequisite understanding.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-indigo-500/20">
            <GraduationCap className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Manage Classrooms</h3>
            <p className="text-sm text-slate-400">Create classes and track cohorts through the learning graph.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-indigo-500/20">
            <AlertOctagon className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Timely Interventions</h3>
            <p className="text-sm text-slate-400">Intervene effectively when the adaptive engine requests your help.</p>
          </div>
        </div>

        <Link 
          to="/staff/login"
          className="btn-secondary inline-flex items-center gap-2 px-10 py-4 text-lg rounded-full"
        >
          Sign In to Mentor
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
