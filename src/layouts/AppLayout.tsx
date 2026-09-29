import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BackButton } from '../components/BackButton';

export function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-primary-500/30">
      {/* Global Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-900/20 blur-[120px] mix-blend-screen animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-primary-600/10 blur-[100px] mix-blend-screen animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen animate-blob animation-delay-4000"></div>
      </div>

      {isLandingPage ? (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <header className="glass-panel backdrop-blur-md bg-[#0F172A]/70 border border-slate-700/50 rounded-full w-auto max-w-full px-6 md:px-8 h-14 flex items-center gap-8 md:gap-12 shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-primary-500/10 p-1.5 rounded-full group-hover:bg-primary-500/20 transition-colors border border-primary-500/20">
                <Sparkles className="w-5 h-5 text-primary-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary-100 transition-colors">
                MasteryFlow
              </span>
            </Link>
            
            {/* Middle: Navigation */}
            <nav className="hidden md:flex gap-6 items-center">
              <Link to="/" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Home</Link>
              <a href="#how-it-works" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">About</a>
            </nav>

            {/* Right: Actions */}
            <div className="flex gap-4 items-center">
              {user && profile ? (
                <>
                  <Link 
                    to={profile.role === 'student' ? '/student/dashboard' : '/staff/dashboard'}
                    className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button 
                    onClick={signOut}
                    className="bg-surfaceBorder hover:bg-surfaceBorder/80 border border-slate-700 text-white px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : null}
            </div>
          </header>
        </div>
      ) : (
        <div className="sticky top-0 z-50 glass-panel border-b border-surfaceBorder/50">
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
          </div>
        </div>
      )}

      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
