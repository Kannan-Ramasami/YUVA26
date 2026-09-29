import { Outlet, Link, useLocation } from 'react-router-dom';
import { Sparkles, BookOpen, Network, RefreshCw, Users, User, LogOut, Map } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function StudentLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Learning', path: '/student/dashboard', icon: BookOpen },
    { name: 'Plan', path: '/student/learning-plan', icon: Map },
    { name: 'Path', path: '/student/learning-path', icon: Network },
    { name: 'Review', path: '/student/review', icon: RefreshCw },
    { name: 'Classroom', path: '/student/classroom', icon: Users },
    { name: 'Profile', path: '/student/profile', icon: User },
  ];

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
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-primary-100 transition-colors hidden sm:block">
              MasteryFlow
            </span>
          </Link>
          
          <nav className="hidden md:flex gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/student/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-surfaceBorder/50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium text-slate-300 hidden sm:block">
              {profile?.full_name}
            </span>
            <button 
              onClick={signOut}
              className="bg-surfaceBorder hover:bg-surfaceBorder/80 border border-slate-700 text-white p-2 sm:px-4 sm:py-2 rounded-full font-medium transition-all flex items-center gap-2 text-sm"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex overflow-x-auto border-t border-surfaceBorder/50 px-2 py-2 hide-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
