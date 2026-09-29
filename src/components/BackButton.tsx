import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // Basic fallback logic based on current path
    const path = location.pathname;
    let fallback = '/';
    if (path.startsWith('/student') && path !== '/student') fallback = '/student';
    if (path.startsWith('/mentor') || path.startsWith('/staff')) fallback = '/mentor';
    
    // Check if we can safely go back in history without leaving the app
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-all mr-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  );
}
