import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { LineChart, BarChart2, AlertCircle, ShieldAlert, BookOpen, Clock, Activity } from 'lucide-react';
import { PYTHON_CONCEPTS } from '../../features/diagnostic/data/pythonDiagnostic';

interface ClassroomData {
  id: string;
  name: string;
}

export function StaffAnalytics() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState<ClassroomData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  const [stats, setStats] = useState<any>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchClassrooms = async () => {
      const { data } = await supabase.from('classrooms').select('id, name').eq('created_by', user.id);
      if (data && data.length > 0) {
        setClassrooms(data);
        setSelectedClassId(data[0].id);
      } else {
        setLoading(false);
      }
    };
    fetchClassrooms();
  }, [user]);

  useEffect(() => {
    if (!selectedClassId) return;

    const fetchAnalytics = async () => {
      setLoading(true);

      // Fetch students in class
      const { data: roster } = await supabase
        .from('classroom_students')
        .select('student_id')
        .eq('classroom_id', selectedClassId);
      
      const studentIds = roster?.map(r => r.student_id) || [];

      // Fetch states for these students
      const { data: states } = await supabase
        .from('learner_concept_states')
        .select('*')
        .in('student_id', studentIds);

      // Fetch recent overrides/interventions
      const { data: overrides } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('event_type', 'teacher_override')
        .order('timestamp', { ascending: false })
        .limit(10);

      // Process Stats
      const s = states || [];
      const strugglingStudents = new Set();
      const conceptStats: Record<string, { totalMastery: number, count: number, lowScores: number }> = {};
      
      s.forEach(state => {
        if (!conceptStats[state.concept_id]) {
          conceptStats[state.concept_id] = { totalMastery: 0, count: 0, lowScores: 0 };
        }
        conceptStats[state.concept_id].totalMastery += state.mastery_score;
        conceptStats[state.concept_id].count += 1;
        
        if (state.status === 'NEEDS_REMEDIATION' || state.mastery_score < 50) {
          conceptStats[state.concept_id].lowScores += 1;
          strugglingStudents.add(state.student_id);
        }
      });

      const processedConceptStats = Object.keys(conceptStats).map(cId => ({
        id: cId,
        name: PYTHON_CONCEPTS.find(c => c.id === cId)?.name || cId,
        avgMastery: conceptStats[cId].count > 0 ? conceptStats[cId].totalMastery / conceptStats[cId].count : 0,
        strugglingCount: conceptStats[cId].lowScores
      })).sort((a, b) => b.strugglingCount - a.strugglingCount);

      setStats({
        totalStudents: studentIds.length,
        strugglingCount: strugglingStudents.size,
        conceptStats: processedConceptStats,
        activeStates: s.length
      });
      
      setInterventions(overrides || []);
      setLoading(false);
    };

    fetchAnalytics();
  }, [selectedClassId]);

  if (loading && classrooms.length === 0) return <div className="p-8 text-slate-400">Loading analytics...</div>;

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <LineChart className="w-8 h-8 text-emerald-400" />
            Classroom Analytics
          </h1>
          <p className="text-slate-400 mt-2">Deep insights into student mastery and intervention history.</p>
        </div>
        
        {classrooms.length > 0 && (
          <select 
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            className="bg-slate-900 border border-surfaceBorder rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500"
          >
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      {loading && classrooms.length > 0 ? (
         <div className="py-20 text-center text-slate-500">Processing classroom data...</div>
      ) : stats ? (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-surfaceBorder/50">
               <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Total Students</div>
               <div className="text-3xl font-bold text-white">{stats.totalStudents}</div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-surfaceBorder/50">
               <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4"/> Needing Attention</div>
               <div className="text-3xl font-bold text-rose-400">{stats.strugglingCount}</div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-surfaceBorder/50">
               <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Activity className="w-4 h-4"/> Active Concepts</div>
               <div className="text-3xl font-bold text-indigo-400">{stats.activeStates}</div>
            </div>
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-surfaceBorder/50">
               <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Interventions</div>
               <div className="text-3xl font-bold text-amber-400">{interventions.length}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Concept Difficulty Distribution */}
            <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
                Concept Difficulty Distribution
              </h3>
              <div className="space-y-4">
                {stats.conceptStats.map((c: any) => (
                  <div key={c.id} className="bg-slate-900/50 p-4 rounded-xl border border-surfaceBorder/30">
                    <div className="flex justify-between items-end mb-2">
                      <div className="font-bold text-slate-200">{c.name}</div>
                      <div className="text-sm font-mono text-emerald-400">{Math.round(c.avgMastery)}% Avg</div>
                    </div>
                    {/* Mastery Bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.avgMastery}%` }}></div>
                    </div>
                    {c.strugglingCount > 0 && (
                      <div className="text-xs text-rose-400 font-medium">
                        {c.strugglingCount} student(s) currently struggling with this concept.
                      </div>
                    )}
                  </div>
                ))}
                {stats.conceptStats.length === 0 && (
                  <div className="text-slate-500 italic text-sm text-center py-4">No active concept data yet.</div>
                )}
              </div>
            </div>

            {/* Intervention History */}
            <div className="glass-panel p-6 rounded-3xl border border-surfaceBorder/50">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Recent Teacher Interventions
              </h3>
              <div className="space-y-4">
                {interventions.map((inv: any) => (
                  <div key={inv.id} className="bg-amber-950/20 p-4 rounded-xl border border-amber-500/20">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-bold text-amber-300">Teacher Override</div>
                      <div className="text-xs text-slate-500">{new Date(inv.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="text-sm text-slate-300">
                      Changed <span className="text-slate-400">{inv.details?.original_action}</span> to <strong className="text-white">{inv.details?.override_action}</strong>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 bg-black/20 p-2 rounded italic">
                      "{inv.details?.reason}"
                    </div>
                  </div>
                ))}
                {interventions.length === 0 && (
                  <div className="text-slate-500 italic text-sm text-center py-4">No manual overrides have been issued.</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-slate-500">No classrooms found.</div>
      )}
    </div>
  );
}
