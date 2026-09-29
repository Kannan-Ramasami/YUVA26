import { Outlet, Link } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from '../components/BackButton';

export function SetupLayout() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-primary-500/30">
      {/* Global Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-900/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-primary-600/10 blur-[100px] mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen animate-blob animation-delay-4000"></div>
      </div>

      <header className="sticky top-0 z-50 glass-panel border-b border-surfaceBorder/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton />
            <Link to="/" className="flex items-center gap-3 group ml-2">
              <div className="bg-primary-500/10 p-2 rounded-xl group-hover:bg-primary-500/20 transition-colors border border-primary-500/20">
                <Sparkles className="w-6 h-6 text-primary-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary-100 transition-colors hidden sm:block">
                MasteryFlow
              </span>
            </Link>
          </div>

          <div className="flex gap-4 items-center">
            <button 
              onClick={signOut}
              className="btn-secondary p-2 sm:px-4 sm:py-2 text-sm"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
