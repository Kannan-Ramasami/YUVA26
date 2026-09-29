import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Plus, 
  Users, 
  BookOpen, 
  ChevronRight
} from 'lucide-react';

export function StaffDashboard() {
  const { profile } = useAuth();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // We fetch classrooms for this staff member
  useEffect(() => {
    if (!profile) return;
    
    const fetchClassrooms = async () => {
      const { data } = await supabase
        .from('classrooms')
        .select('*')
        .eq('created_by', profile.id);
        
      if (data) {
        // Also fetch student counts for each
        const withCounts = await Promise.all(data.map(async (c) => {
          const { count } = await supabase
            .from('classroom_students')
            .select('*', { count: 'exact', head: true })
            .eq('classroom_id', c.id);
            
          return { ...c, studentCount: count || 0 };
        }));
        setClassrooms(withCounts);
      }
      setLoading(false);
    };

    fetchClassrooms();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      
      {/* 1. Welcome Section */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {profile?.full_name.split(' ')[0] || 'Educator'}.</h1>
          <p className="text-slate-400 mt-2">Here is your classroom overview for today.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {/* Create Classroom CTA */}
          <Link to="/staff/classrooms/create" className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Create Class
          </Link>
          <Link to="/admin/evaluation" className="flex-1 sm:flex-none bg-surfaceBorder hover:bg-surfaceBorder/80 text-white px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm">
            Run Engine Diagnostics
          </Link>
        </div>
      </section>

      {/* 2. Classroom Overview */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Active Classes</span>
          </div>
          <div className="text-3xl font-bold text-white">{classrooms.length}</div>
        </div>
        
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {classrooms.reduce((acc, c) => acc + c.studentCount, 0)}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8">
        {/* Main Column: Classrooms */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Your Classrooms
          </h2>
          
          {/* 3. Classroom Cards */}
          {classrooms.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-3xl">
              <BookOpen className="w-12 h-12 text-indigo-500/50 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No classrooms yet</h3>
              <p className="text-slate-400">Create a class to get started.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classrooms.map(cls => (
                <Link to={`/staff/classrooms/${cls.id}`} key={cls.id} className="glass-panel p-6 rounded-2xl hover:border-indigo-500/50 transition-all group flex flex-col h-full cursor-pointer hover:-translate-y-1 shadow-lg block">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{cls.name}</h3>
                      <p className="text-sm text-slate-400">Python 101</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-6">
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="text-slate-500 block text-xs uppercase font-bold">Students</span>
                        <span className="text-white font-medium">{cls.studentCount}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500 block text-xs uppercase font-bold">Code</span>
                        <span className="text-slate-300 font-mono tracking-wider">{cls.join_code}</span>
                      </div>
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 text-indigo-400 group-hover:text-white transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
