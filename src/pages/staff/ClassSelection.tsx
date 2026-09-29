import { Link } from 'react-router-dom';
import { Plus, LogIn } from 'lucide-react';

export function ClassSelection() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full animate-fade-in-up">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Manage Your Classroom
          </h1>
          <p className="text-xl text-slate-400">
            Create a new classroom or join an existing one to get started.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Create Class */}
          <div className="glass-panel interactive-card p-8 rounded-3xl flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6 group-hover:scale-110 transition-transform">
              <Plus className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Create a Classroom</h3>
            <p className="text-slate-400 mb-8 h-16">
              Create a classroom, generate a unique class code, and invite students to join.
            </p>
            <Link to="/staff/classrooms/create" className="btn-primary w-full">
              Create a Classroom
            </Link>
          </div>

          {/* Join Class */}
          <div className="glass-panel interactive-card p-8 rounded-3xl flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-6 group-hover:scale-110 transition-transform">
              <LogIn className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Join a Classroom</h3>
            <p className="text-slate-400 mb-8 h-16">
              Enter a classroom code to join an existing classroom and access its learning environment.
            </p>
            <Link to="/staff/join-class" className="btn-secondary w-full">
              Join a Classroom
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/staff/dashboard" className="text-slate-400 hover:text-white transition-colors">
            Skip to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
