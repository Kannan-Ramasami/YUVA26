import { Users, AlertOctagon } from 'lucide-react';

export function StaffClassrooms() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 mb-6">
        <Users className="w-10 h-10 text-indigo-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Classroom Management</h1>
      <p className="text-slate-400 max-w-md">
        This is a placeholder for the full classroom management interface. Here educators will manage rosters, assignments, and settings.
      </p>
    </div>
  );
}

export function StaffInterventions() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
      <div className="w-20 h-20 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 mb-6">
        <AlertOctagon className="w-10 h-10 text-rose-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Intervention Hub</h1>
      <p className="text-slate-400 max-w-md">
        This is a placeholder. Educators will use this hub to override mastery scores, message students, and review anti-gaming flags.
      </p>
    </div>
  );
}


