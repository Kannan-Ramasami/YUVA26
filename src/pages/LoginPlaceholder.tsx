import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Users } from 'lucide-react';

export function LoginPlaceholder() {
  const location = useLocation();
  const isStaff = location.pathname.includes('staff');
  
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center space-y-6 animate-fade-in-up">
        <div className="mx-auto w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center border border-primary-500/30">
          {isStaff ? (
            <Users className="w-8 h-8 text-primary-400" />
          ) : (
            <User className="w-8 h-8 text-primary-400" />
          )}
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {isStaff ? 'Staff Login' : 'Student Login'}
          </h1>
          <p className="text-slate-400 text-sm">
            Authentication is not implemented yet. This is a placeholder for the authentication flow.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Link 
            to={isStaff ? '/staff' : '/student'}
            className="block w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary-500/20"
          >
            Bypass to Dashboard
          </Link>
          <Link 
            to="/"
            className="flex items-center justify-center gap-2 w-full bg-surfaceBorder hover:bg-surfaceBorder/80 text-white py-3 rounded-xl font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
