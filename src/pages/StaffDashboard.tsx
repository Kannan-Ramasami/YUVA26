export function StaffDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Dashboard</h1>
          <p className="text-slate-500 mt-2">Manage classrooms and monitor student mastery.</p>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">
          Create Classroom
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Active Classrooms</h2>
        <p className="text-sm text-slate-600">List of classrooms will appear here.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-4">Needs Intervention</h2>
        <p className="text-sm text-slate-600">Students flagged by the Anti-Gaming or Mastery Engines will appear here.</p>
      </div>
    </div>
  );
}
