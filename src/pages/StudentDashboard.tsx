import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchStudentDashboardData } from '../services/studentDashboardMock';
import type { StudentDashboardData } from '../services/studentDashboardMock';
import {
  BrainCircuit, 
  Play, 
  Target, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Lock,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // For testing empty state, you can flip this boolean manually
  const SIMULATE_NEW_STUDENT = false;

  useEffect(() => {
    if (profile) {
      fetchStudentDashboardData(profile.id, SIMULATE_NEW_STUDENT).then((dashboardData) => {
        setData(dashboardData);
        setLoading(false);
      });
    }
  }, [profile]);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const { overview, currentLearning, todayRecommendation, recentActivity, needsReview } = data;
  const isNew = currentLearning === null;

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      
      {/* 1. Welcome Section */}
      <section>
        <h1 className="text-3xl font-bold text-white">Welcome back, {profile?.full_name.split(' ')[0] || 'Student'}.</h1>
        <p className="text-slate-400 mt-2">Let's continue building your mastery.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 2. Current Learning Section */}
          <section className="glass-panel interactive-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border-indigo-500/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-400" />
              Current Focus
            </h2>

            {isNew ? (
              <div className="text-center py-8">
                <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Ready to begin?</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">Take your first diagnostic assessment so the adaptive engine can build your initial knowledge graph.</p>
                <Link to="/student/diagnostic/start" className="btn-primary flex mx-auto w-max">
                  <Play className="w-4 h-4 fill-current" />
                  Start Diagnostic
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between relative z-10">
                <div className="flex-1">
                  <div className="text-sm font-medium text-primary-400 mb-1">{currentLearning.subject}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{currentLearning.conceptName}</h3>
                  <p className="text-sm text-slate-400 mb-4 bg-surfaceBorder/40 p-3 rounded-lg border border-surfaceBorder">
                    <span className="font-semibold text-slate-300">Engine Reasoning:</span> {currentLearning.recommendedAction.reasoning}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-3 bg-surfaceBorder rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-1000 relative"
                        style={{ width: `${currentLearning.masteryPercentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary-300">{currentLearning.masteryPercentage}%</span>
                  </div>
                </div>

                <button className="w-full sm:w-auto btn-primary group shrink-0">
                  <Play className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
                  Continue Learning
                </button>
              </div>
            )}
          </section>


          {/* 6. Recent Activity */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-400" />
              Recent Activity
            </h2>
            
            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No recent activity found.</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-4 rounded-xl bg-surfaceBorder/30 border border-surfaceBorder/50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${activity.isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {activity.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">{activity.conceptName}</h4>
                        <span className="text-xs text-slate-500 capitalize">{activity.type} • {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 font-bold text-sm ${activity.masteryChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {activity.masteryChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {activity.masteryChange > 0 ? '+' : ''}{activity.masteryChange}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* 4. Mastery Overview */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              Mastery Overview
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-2xl font-bold text-emerald-400 mb-1">{overview.masteredCount}</div>
                <div className="text-xs text-emerald-300 uppercase tracking-wider font-semibold">Mastered</div>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{overview.developingCount}</div>
                <div className="text-xs text-blue-300 uppercase tracking-wider font-semibold">Developing</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-2xl font-bold text-amber-400 mb-1">{overview.needsReviewCount}</div>
                <div className="text-xs text-amber-300 uppercase tracking-wider font-semibold">Needs Review</div>
              </div>
              <div className="p-4 rounded-xl bg-surfaceBorder/50 border border-surfaceBorder text-center flex flex-col items-center justify-center">
                <Lock className="w-4 h-4 text-slate-500 mb-2" />
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{overview.lockedCount} Locked</div>
              </div>
            </div>
          </section>

          {/* 5. Today's Recommendation (Adaptive Engine Output) */}
          {todayRecommendation && (
            <section className="p-[1px] rounded-2xl bg-gradient-to-b from-primary-500 to-transparent shadow-[0_0_15px_rgba(124,58,237,0.2)]">
              <div className="glass-panel p-6 rounded-2xl h-full bg-surface/90">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary-400" />
                  <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-500">Adaptive Recommendation</h2>
                </div>
                
                <div className="mb-4">
                  <div className="text-xs font-bold text-primary-400 uppercase tracking-wider mb-1">Target Concept</div>
                  <h3 className="text-lg font-semibold text-white">Order of Operations</h3>
                </div>
                
                <p className="text-sm text-slate-400 mb-6 italic border-l-2 border-primary-500/30 pl-3">
                  "{todayRecommendation.reasoning}"
                </p>

                <button className="w-full bg-surfaceBorder hover:bg-primary-600 text-white py-2.5 rounded-lg font-medium transition-colors border border-slate-700 hover:border-primary-500">
                  Review Concept
                </button>
              </div>
            </section>
          )}

          {/* 7. Review Section */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-amber-400" />
              Spaced Review Queue
            </h2>
            
            {needsReview.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Your memory is sharp! Nothing to review right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {needsReview.map(item => (
                  <div key={item.conceptId} className="p-3 rounded-xl bg-surfaceBorder/30 border border-surfaceBorder/50 flex items-center justify-between group cursor-pointer hover:border-amber-500/30 transition-colors">
                    <div>
                      <h4 className="font-medium text-white text-sm">{item.conceptName}</h4>
                      <span className="text-xs text-slate-500">{item.subject}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3 h-3 text-amber-400 fill-current" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
