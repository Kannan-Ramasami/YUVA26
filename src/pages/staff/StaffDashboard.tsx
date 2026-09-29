import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchStaffDashboardData } from '../../services/staffDashboardMock';
import type { StaffDashboardData } from '../../services/staffDashboardMock';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  AlertOctagon, 
  BookOpen, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PieChart,
  Target
} from 'lucide-react';

export function StaffDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchStaffDashboardData(profile.id).then((dashboardData) => {
        setData(dashboardData);
        setLoading(false);
      });
    }
  }, [profile]);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const { overview, classrooms, insights } = data;

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      
      {/* 1. Welcome Section */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {profile?.full_name.split(' ')[0] || 'Educator'}.</h1>
          <p className="text-slate-400 mt-2">Here is your classroom overview for today.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {/* 4. Create Classroom CTA */}
          <Link to="/staff/classrooms/create" className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Create Class
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
          <div className="text-3xl font-bold text-white">{overview.activeClassrooms}</div>
        </div>
        
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
          </div>
          <div className="text-3xl font-bold text-white">{overview.totalStudents}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">Needs Attention</span>
          </div>
          <div className="text-3xl font-bold text-rose-400">{overview.studentsNeedingAttention}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">Interventions</span>
          </div>
          <div className="text-3xl font-bold text-white">{overview.recentInterventions} <span className="text-sm font-normal text-slate-500">this week</span></div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column: Classrooms */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Your Classrooms
          </h2>
          
          {/* 3. Classroom Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {classrooms.map(cls => (
              <Link to={`/staff/classrooms/${cls.id}`} key={cls.id} className="glass-panel p-6 rounded-2xl hover:border-indigo-500/50 transition-all group flex flex-col h-full cursor-pointer hover:-translate-y-1 shadow-lg block">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{cls.name}</h3>
                    <p className="text-sm text-slate-400">{cls.subject}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${cls.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    {cls.isActive ? 'ACTIVE' : 'ARCHIVED'}
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
                      <span className="text-slate-300 font-mono tracking-wider">{cls.joinCode}</span>
                    </div>
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 text-indigo-400 group-hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar Column: Insights */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Global Insights
          </h2>
          
          {/* 6. Student insight preview */}
          <section className="glass-panel p-6 rounded-2xl space-y-6">
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">Mastery Distribution</span>
                <span className="text-xs text-slate-500">Across all classes</span>
              </div>
              <div className="w-full h-3 bg-surfaceBorder rounded-full overflow-hidden flex">
                <div style={{ width: `${(insights.masteryDistribution.mastered / overview.totalStudents) * 100}%` }} className="h-full bg-emerald-500"></div>
                <div style={{ width: `${(insights.masteryDistribution.developing / overview.totalStudents) * 100}%` }} className="h-full bg-blue-500"></div>
                <div style={{ width: `${(insights.masteryDistribution.needsReview / overview.totalStudents) * 100}%` }} className="h-full bg-amber-500"></div>
                <div style={{ width: `${(insights.masteryDistribution.struggling / overview.totalStudents) * 100}%` }} className="h-full bg-rose-500"></div>
              </div>
              <div className="flex justify-between text-xs mt-2 text-slate-400">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Mastered</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Stuck</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surfaceBorder/30 border border-surfaceBorder rounded-xl p-3 flex flex-col">
                <span className="text-xs text-slate-400 mb-1">Progressing</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">{insights.studentsProgressingCount}</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 flex flex-col">
                <span className="text-xs text-rose-300 mb-1">Currently Stuck</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-rose-400">{insights.studentsStuckCount}</span>
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3">Concepts Requiring Attention</h3>
              <div className="space-y-2">
                {insights.lowMasteryConcepts.map(concept => (
                  <div key={concept.id} className="p-3 bg-surfaceBorder/30 rounded-lg border border-surfaceBorder/50 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-white">{concept.name}</div>
                      <div className="text-xs text-slate-500">{concept.affectedStudents} students struggling</div>
                    </div>
                    <div className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                      {concept.averageMastery}% avg
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </section>

        </div>
      </div>
    </div>
  );
}
