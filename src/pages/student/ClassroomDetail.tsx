import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, BrainCircuit, Play, Target, Activity } from 'lucide-react';

export function StudentClassroomDetail() {
  const { id: _id } = useParams();

  // In a real app, fetch classroom details, educator info, and personal progress here using `id`
  
  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Algebra 101 - Fall</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Educator: Jane Doe</span>
            <span>Subject: Mathematics</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel p-8 rounded-3xl border-primary-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2 relative z-10">
              <BrainCircuit className="w-5 h-5 text-primary-400" />
              Your Personalized Path
            </h2>
            <p className="text-slate-400 text-sm mb-6 max-w-lg relative z-10">
              Even within this classroom, the MasteryFlow engine adapts to your specific learning history. Your next assignment is tailored to your current knowledge gaps.
            </p>
            
            <div className="bg-surfaceBorder/40 border border-surfaceBorder rounded-xl p-6 relative z-10 mb-6">
              <div className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-2">Next Concept</div>
              <h3 className="text-2xl font-bold text-white mb-2">Factoring Polynomials</h3>
              <p className="text-slate-300 text-sm">Recommended because you recently mastered Distributive Property.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <button className="flex-1 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:-translate-y-1 flex items-center justify-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Start Next Lesson
              </button>
              <button className="flex-1 bg-surfaceBorder hover:bg-surfaceBorder/80 border border-slate-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                View Learning Path
              </button>
            </div>
          </section>

          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-primary-400" />
              Classroom Goals
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Your educator has highlighted these core concepts to be mastered by the end of the semester.
            </p>
            <div className="space-y-3">
              {['Linear Equations', 'Graphing Inequalities', 'Polynomials'].map((concept, idx) => (
                <div key={idx} className="bg-surfaceBorder/30 p-3 rounded-lg border border-surfaceBorder/50 flex justify-between items-center text-sm">
                  <span className="text-white">{concept}</span>
                  <span className="text-slate-500">In curriculum</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-primary-400" />
              Your Progress in this Class
            </h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">Overall Mastery</span>
                  <span className="text-primary-400 font-bold">42%</span>
                </div>
                <div className="w-full h-2 bg-surfaceBorder rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: '42%' }}></div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-surfaceBorder/50 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Concepts Mastered</span>
                  <span className="text-white font-medium">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Time Spent Learning</span>
                  <span className="text-white font-medium">4h 15m</span>
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}
