import { useEffect, useState } from 'react';
import { conceptGraphService } from '../../features/graph/services/conceptGraphService';
import { Network, ChevronRight, Lock } from 'lucide-react';
import type { Concept } from '../../features/diagnostic/types';

export function StaffConceptGraph() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  useEffect(() => {
    // Read-only view of the static graph
    setConcepts(conceptGraphService.getConcepts());
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="flex-1 flex justify-center p-12"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const activeConcept = selectedConcept ? concepts.find(c => c.id === selectedConcept) : null;
  const prereqs = activeConcept ? conceptGraphService.getPrerequisites(activeConcept.id) : [];

  return (
    <div className="max-w-6xl mx-auto w-full pb-20 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Network className="w-8 h-8 text-indigo-400" />
          Concept Graph Engine
        </h1>
        <p className="text-slate-400 mt-2">Read-only view of the subject prerequisite structures.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Concept List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-surfaceBorder/50">
            <div className="space-y-3 relative">
              <div className="absolute top-6 bottom-6 left-6 w-0.5 bg-surfaceBorder"></div>

              {concepts.map((concept, idx) => {
                const isSelected = selectedConcept === concept.id;
                const conceptPrereqs = conceptGraphService.getPrerequisites(concept.id);

                return (
                  <button
                    key={concept.id}
                    onClick={() => setSelectedConcept(concept.id)}
                    className={`w-full flex items-center p-4 rounded-xl transition-all relative z-10 ${
                      isSelected ? 'bg-surfaceBorder/80 border-slate-600 shadow-lg' : 'hover:bg-surfaceBorder/50 border-transparent border hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-sm mr-4 bg-slate-800 border-slate-700 text-slate-400">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-white">{concept.name}</h3>
                        <span className="text-xs font-medium text-slate-500 bg-surfaceBorder px-2 py-1 rounded">
                          {conceptPrereqs.length} prereq(s)
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{concept.description}</p>
                    </div>

                    <ChevronRight className={`w-5 h-5 ml-4 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="sticky top-28">
            {activeConcept ? (
              <div className="glass-panel p-6 rounded-2xl border border-surfaceBorder/50 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-white mb-2">{activeConcept.name}</h2>
                <p className="text-slate-400 text-sm mb-6 pb-6 border-b border-surfaceBorder/50">
                  {activeConcept.description}
                </p>

                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Engine Rules</h4>
                
                {prereqs.length > 0 ? (
                  <div className="space-y-3">
                    {prereqs.map((p, idx) => {
                      const pConcept = concepts.find(c => c.id === p.prerequisite_concept_id);
                      return (
                        <div key={idx} className="bg-surfaceBorder/30 p-4 rounded-xl border border-surfaceBorder/50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                              <Lock className="w-4 h-4 text-slate-500" />
                              {pConcept?.name || p.prerequisite_concept_id}
                            </span>
                            <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                              {p.relationship_type}
                            </span>
                          </div>
                          <div className="text-sm text-slate-400">
                            Minimum mastery required: <span className="text-white font-bold">{p.minimum_mastery}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 bg-surfaceBorder/20 p-4 rounded-xl border border-surfaceBorder/30">
                    This is a root concept. It has no prerequisites.
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel p-8 rounded-2xl border border-surfaceBorder/50 text-center animate-fade-in flex flex-col items-center justify-center min-h-[300px]">
                <Network className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Select a concept</h3>
                <p className="text-sm text-slate-400">View configuration and prerequisite thresholds.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
