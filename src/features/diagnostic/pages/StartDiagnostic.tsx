import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BrainCircuit, Play, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { startDiagnosticSession } from '../services/diagnosticService';

export function StartDiagnostic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!user) return;
    setLoading(true);
    
    // We assume 'sub_python' for this prototype
    const session = await startDiagnosticSession(user.id, 'sub_python');
    
    navigate(`/student/diagnostic/session/${session.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-in-up pb-12">
      <Link to="/student/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="glass-panel p-10 rounded-3xl text-center relative overflow-hidden border-primary-500/30">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/30 mx-auto mb-6 relative z-10">
          <BrainCircuit className="w-10 h-10 text-primary-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4 relative z-10">Let's understand what you already know.</h1>
        <p className="text-slate-400 max-w-lg mx-auto mb-10 relative z-10">
          This short assessment helps MasteryFlow create a learning path based on your current knowledge. We evaluate individual concepts, so answer to the best of your ability.
        </p>

        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:-translate-y-1 flex items-center justify-center gap-3 mx-auto w-full sm:w-auto min-w-[200px] relative z-10 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Start Diagnostic
            </>
          )}
        </button>
      </div>
    </div>
  );
}
