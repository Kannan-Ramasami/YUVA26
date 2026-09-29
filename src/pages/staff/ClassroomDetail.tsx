import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, AlertOctagon, Activity, Settings, TrendingUp, AlertTriangle } from 'lucide-react';
import { useClassroomIntelligence } from '../../features/staff/hooks/useClassroomIntelligence';
import { PYTHON_CONCEPTS } from '../../features/diagnostic/data/pythonDiagnostic';

export function StaffClassroomDetail() {
  const { id } = useParams();
  const { data, loading, error, classroomName } = useClassroomIntelligence(id);

  if (loading) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (error || !data) {
    return <div className="p-12 text-rose-400 text-center">Error loading classroom intelligence: {error}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      <Link to="/staff/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{classroomName || 'Classroom'}</h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>ID: {id?.substring(0, 8)}...</span>
            <span>Subject: Python 101</span>
          </div>
        </div>
        <button className="bg-surfaceBorder hover:bg-surfaceBorder/80 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm border border-slate-700">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-surfaceBorder/50">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold uppercase tracking-wider text-xs">Total Students</h3>
          </div>
          <div className="text-3xl font-bold text-white">{data.totalStudents}</div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl border border-surfaceBorder/50">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold uppercase tracking-wider text-xs">Active (7d)</h3>
          </div>
          <div className="text-3xl font-bold text-white">{data.activeLearners}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-rose-950/10">
          <div className="flex items-center gap-3 text-rose-400 mb-2">
            <AlertOctagon className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-xs">Needs Attention</h3>
          </div>
          <div className="text-3xl font-bold text-rose-400">{data.studentsNeedingAttention}</div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-surfaceBorder/50">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold uppercase tracking-wider text-xs">Avg Mastery</h3>
          </div>
          <div className="text-3xl font-bold text-white">{data.averageMastery}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Main Column: Student Table */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-indigo-400" />
              Student Analysis
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surfaceBorder/50 text-xs uppercase tracking-widest text-slate-500">
                    <th className="pb-3 px-2">Student</th>
                    <th className="pb-3 px-2 text-center">Avg Mastery</th>
                    <th className="pb-3 px-2">Status Flags</th>
                    <th className="pb-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surfaceBorder/30">
                  {data.students.map((student) => (
                    <tr key={student.id} className="hover:bg-surfaceBorder/10 transition-colors">
                      <td className="py-4 px-2">
                        <div className="font-medium text-white">{student.name}</div>
                        <div className="text-xs text-slate-400">{student.states.length} concepts engaged</div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <span className={`font-bold ${student.overallMastery >= 80 ? 'text-emerald-400' : student.overallMastery < 50 ? 'text-amber-400' : 'text-indigo-400'}`}>
                          {student.overallMastery}%
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        {student.flags.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {student.flags.slice(0, 2).map((flag, idx) => (
                              <span key={idx} className={`text-xs px-2 py-1 rounded w-max ${flag.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {flag.reason.replace('_', ' ')}
                              </span>
                            ))}
                            {student.flags.length > 2 && <span className="text-xs text-slate-500">+{student.flags.length - 2} more</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded">On Track</span>
                        )}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <Link to={`/staff/student/${student.id}`} className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors font-medium">Profile</Link>
                      </td>
                    </tr>
                  ))}
                  {data.students.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-500">No students enrolled.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Sidebar: Hotspots & Concepts */}
        <div className="lg:col-span-1 space-y-6">
          {/* Hotspots */}
          {data.hotspots.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-rose-500/30 bg-rose-950/10">
              <h3 className="text-sm font-bold text-rose-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Classroom Hotspots
              </h3>
              <div className="space-y-4">
                {data.hotspots.map(hotspot => (
                  <div key={hotspot.conceptId} className="bg-slate-900/50 p-3 rounded-lg border border-rose-500/20">
                    <div className="font-bold text-white text-sm mb-1">{hotspot.name}</div>
                    <div className="text-xs text-rose-300">
                      <strong>{hotspot.percentageStruggling}%</strong> ({hotspot.studentsBelowMastery}/{hotspot.totalStudentsAssessed}) below threshold.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concept Distribution */}
          <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Concept Mastery</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto hide-scrollbar pr-2">
              {PYTHON_CONCEPTS.map(concept => {
                const dist = data.conceptDistribution[concept.id];
                if (!dist) return null;
                
                const total = dist.MASTERED + dist.DEVELOPING + dist.REVIEW + dist.NOT_ASSESSED;
                if (total === 0) return null;

                const getW = (val: number) => `${Math.max((val / total) * 100, 0)}%`;

                return (
                  <div key={concept.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white font-medium truncate pr-2">{concept.name}</span>
                      <span className="text-emerald-400 font-bold shrink-0">{dist.MASTERED} / {total}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500" style={{ width: getW(dist.MASTERED) }} title={`Mastered: ${dist.MASTERED}`}></div>
                      <div className="h-full bg-indigo-500" style={{ width: getW(dist.DEVELOPING) }} title={`Developing: ${dist.DEVELOPING}`}></div>
                      <div className="h-full bg-amber-500" style={{ width: getW(dist.REVIEW) }} title={`Needs Review: ${dist.REVIEW}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
