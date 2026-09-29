import { Outlet, Link } from 'react-router-dom';
import { Sparkles, User, LogIn, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AppLayout() {
  const { user, profile, signOut } = useAuth();

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
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-primary-500/10 p-2 rounded-xl group-hover:bg-primary-500/20 transition-colors border border-primary-500/20">
              <Sparkles className="w-6 h-6 text-primary-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-primary-100 transition-colors">
              MasteryFlow
            </span>
          </Link>
          
          <nav className="hidden md:flex gap-8 items-center">
            <a href="#about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">About</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How it Works</a>
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
          </nav>

          <div className="flex gap-4 items-center">
            {user && profile ? (
              <>
                <Link 
                  to={`/${profile.role}/dashboard`}
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button 
                  onClick={signOut}
                  className="bg-surfaceBorder hover:bg-surfaceBorder/80 border border-slate-700 text-white px-5 py-2.5 rounded-full font-medium transition-all flex items-center gap-2 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/student/login" 
                  className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link 
                  to="/student/login"
                  className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] flex items-center gap-2 text-sm"
                >
                  <User className="w-4 h-4" />
                  Start Learning
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
