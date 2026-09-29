import { Link } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function ModeSelection() {
  const { user } = useAuth();
  const [joinedClassroomsCount, setJoinedClassroomsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from('classroom_members')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id);
      setJoinedClassroomsCount(count || 0);
    };
    fetchCount();
  }, [user]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full animate-fade-in-up">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Learning Mode
          </h1>
          <p className="text-xl text-slate-400">
            Select how you want to continue your learning journey.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Individual Mode */}
          <div className="glass-panel interactive-card p-8 rounded-3xl flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20 mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Individual Learning</h3>
            <p className="text-slate-400 mb-8 h-16">
              Learn at your own pace with a personalized learning path based on your mastery, history, and learning needs.
            </p>
            <Link to="/student/individual" className="btn-primary w-full">
              Continue with Individual Learning
            </Link>
          </div>

          {/* Group Mode */}
          <div className="glass-panel interactive-card p-8 rounded-3xl flex flex-col items-center text-center group">
            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Classroom Learning</h3>
            <p className="text-slate-400 mb-8 h-16">
              Join a mentor-guided classroom and follow an adaptive learning path based on your progress and mastery.
            </p>
            
            <div className="w-full">
              {joinedClassroomsCount === 0 ? (
                <div>
                  <p className="text-xs text-amber-400 font-semibold mb-2">No classrooms joined yet</p>
                  <Link to="/student/classroom/join" className="btn-secondary w-full">
                    Join a Classroom
                  </Link>
                </div>
              ) : (
                <Link to="/student/classrooms" className="btn-secondary w-full">
                  Open My Classrooms
                </Link>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
