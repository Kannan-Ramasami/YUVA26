import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  BrainCircuit, 
  Target, 
  GitBranch, 
  Database,
  Network,
  CheckCircle2,
  Lock,
  AlertCircle,
  User,
  ShieldCheck,
  Zap,
  Repeat,
  ArrowRight,
  Clock,
  LineChart
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-slate-100 font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full pt-40 pb-48 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-[#0B0514] via-[#160B32] to-[#2C1664]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-500/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          
          {/* HERO LEFT - Content */}
          <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-sm font-medium mb-8 shadow-lg">
              <BrainCircuit className="w-4 h-4 text-primary-300" />
              <span className="tracking-wide">INTELLIGENT ADAPTIVE LEARNING</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              Learning that adapts to what you <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">actually know.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-purple-100/90 max-w-2xl mb-10 leading-relaxed font-light">
              MasteryFlow builds a personalized learning path from your evidence, mastery, and learning history — not a fixed sequence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                to="/student"
                className="btn bg-white hover:bg-slate-100 text-purple-900 rounded-full px-8 py-4 text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
              >
                I'm a Student
              </Link>
              <Link 
                to="/mentor"
                className="btn bg-purple-900/40 hover:bg-purple-900/60 backdrop-blur-md border border-purple-300/30 text-white rounded-full px-8 py-4 text-lg font-bold transition-all hover:border-purple-300/60"
              >
                I'm a Mentor
              </Link>
            </div>
          </div>

          {/* HERO RIGHT - Product Visual */}
          <div className="relative w-full max-w-lg lg:w-[500px] xl:w-[600px] mt-8 lg:mt-0 z-10 lg:ml-auto perspective-1000">
            
            {/* Floating Capsules */}
            <div className="absolute -left-6 md:-left-12 top-6 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 shadow-2xl animate-float-slow z-20 flex items-center gap-2">
              <Network className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-white">Adaptive Path</span>
            </div>
            <div className="absolute -right-4 md:-right-8 top-1/4 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 shadow-2xl animate-float-slower z-20 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Mastery 78%</span>
            </div>
            <div className="absolute -left-8 md:-left-16 bottom-1/3 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 shadow-2xl animate-float z-20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-semibold text-white">Prerequisite Gap Detected</span>
            </div>
            <div className="absolute -right-6 md:-right-12 bottom-12 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 shadow-2xl animate-float-slow z-20 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">Next Best Action</span>
            </div>

            {/* Main Dashboard Visual */}
            <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative bg-surface/40 backdrop-blur-2xl transform md:rotate-y-[-5deg] md:rotate-x-[5deg]">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-500/20 p-2 rounded-xl">
                    <BrainCircuit className="w-6 h-6 text-primary-300" />
                  </div>
                  <span className="font-bold text-white text-lg tracking-wide">MasteryFlow</span>
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-primary-200/70">Your Path</div>
              </div>
              
              <div className="space-y-5 relative pl-2">
                {/* Path Line */}
                <div className="absolute left-7 top-5 bottom-5 w-0.5 bg-gradient-to-b from-emerald-500/50 via-primary-500/50 to-surfaceBorder"></div>
                
                {/* Node 1 */}
                <div className="flex items-center gap-5 relative group">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3.5 flex justify-between items-center border border-white/5 transition-colors group-hover:bg-white/10">
                    <span className="text-sm font-medium text-slate-200">Variables</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">100%</span>
                  </div>
                </div>
                
                {/* Node 2 */}
                <div className="flex items-center gap-5 relative group">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3.5 flex justify-between items-center border border-white/5 transition-colors group-hover:bg-white/10">
                    <span className="text-sm font-medium text-slate-200">Data Types</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">100%</span>
                  </div>
                </div>
                
                {/* Node 3 */}
                <div className="flex items-center gap-5 relative group">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 border-2 border-primary-400 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                    <div className="w-3 h-3 rounded-full bg-primary-300 animate-pulse-glow"></div>
                  </div>
                  <div className="flex-1 bg-primary-500/15 border border-primary-500/40 rounded-xl p-3.5 flex justify-between items-center shadow-inner">
                    <span className="text-sm font-bold text-white">Operators</span>
                    <span className="text-xs font-bold text-primary-200 bg-primary-500/20 px-2 py-1 rounded-md">78%</span>
                  </div>
                </div>
                
                {/* Node 4 */}
                <div className="flex items-center gap-5 relative opacity-70">
                  <div className="w-10 h-10 rounded-full bg-surfaceBorder border-2 border-slate-600 flex items-center justify-center z-10">
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3.5 flex justify-between items-center border border-white/5">
                    <span className="text-sm font-medium text-slate-300">Conditions</span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded-md">52%</span>
                  </div>
                </div>

                {/* Node 5 */}
                <div className="flex items-center gap-5 relative opacity-40">
                  <div className="w-10 h-10 rounded-full bg-surfaceBorder border-2 border-slate-700 flex items-center justify-center z-10">
                     <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3.5 flex justify-between items-center border border-white/5">
                    <span className="text-sm font-medium text-slate-400">Loops</span>
                    <span className="text-xs text-slate-500"><Lock className="w-3.5 h-3.5"/></span>
                  </div>
                </div>
              </div>
              
              {/* Recommendation Panel */}
              <div className="mt-8 bg-gradient-to-r from-rose-900/30 to-purple-900/30 border border-rose-500/20 rounded-2xl p-5 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Recommended Next</div>
                </div>
                <div className="text-lg text-white font-bold mb-2">Practice Conditions</div>
                <div className="text-sm text-rose-200/90 flex items-start gap-2 leading-snug">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>Why? Your prerequisite mastery needs work before advancing to Loops.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved Bottom Transition */}
        <svg className="absolute bottom-0 left-0 w-full text-background h-auto translate-y-1 pointer-events-none" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" fill="currentColor"></path>
        </svg>
      </section>

      {/* 2. NEXT SECTION — WHY MASTERYFLOW */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Learning built around <span className="text-gradient">mastery.</span></h2>
          <p className="text-xl text-slate-400 leading-relaxed">
            Instead of moving every learner through the same sequence, MasteryFlow continuously adapts to evidence, prerequisites, and learning history.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Database, title: "Evidence-Based", desc: "Tracks meaningful learning evidence." },
            { icon: GitBranch, title: "Adaptive", desc: "Chooses the next best learning action." },
            { icon: ShieldCheck, title: "Prerequisite-Aware", desc: "Identifies knowledge gaps that block progress." },
            { icon: BrainCircuit, title: "Explainable", desc: "Shows learners and mentors why a recommendation was made." }
          ].map((item, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl text-center group hover:border-primary-500/40 transition-all duration-300">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-900/30 flex items-center justify-center mb-6 border border-primary-500/20 group-hover:scale-110 transition-transform">
                <item.icon className="w-8 h-8 text-primary-400 group-hover:text-primary-300" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CORE FEATURE SECTION */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Core Capabilities</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: User,
              title: 'Personalized Learning Paths',
              desc: 'Every learner gets a path shaped by their mastery and learning history.'
            },
            {
              icon: Database,
              title: 'Evidence-Based Mastery',
              desc: 'Mastery updates from more than just right and wrong answers.'
            },
            {
              icon: ShieldCheck,
              title: 'Prerequisite Intelligence',
              desc: 'Detect weak foundations before advancing to dependent concepts.'
            },
            {
              icon: Zap,
              title: 'Adaptive Recommendations',
              desc: 'Choose between practice, review, remediation, advancement, challenge, or mentor intervention.'
            },
            {
              icon: Clock,
              title: 'Spaced Review',
              desc: 'Bring important concepts back when they need reinforcement.'
            },
            {
              icon: Users,
              title: 'Mentor Intelligence',
              desc: 'Give mentors visibility into mastery, stuck learners, concept gaps, and interventions.'
            }
          ].map((feature, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-3xl hover:-translate-y-2 hover:border-primary-500/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-surface border border-surfaceBorder flex items-center justify-center mb-6 group-hover:bg-primary-900/30 group-hover:border-primary-500/30 transition-colors">
                <feature.icon className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. ADAPTIVE INTELLIGENCE VISUAL */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        <div className="glass-panel p-10 md:p-16 rounded-[3rem] border-primary-500/20 relative overflow-hidden bg-surface/80">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-rose-900/10 pointer-events-none"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Continuous Adaptive Loop</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">MasteryFlow's intelligence is a continuous cycle of observation and adaptation.</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative z-10 max-w-5xl mx-auto">
            {/* Background Line Desktop */}
            <div className="hidden md:block absolute top-8 left-8 right-8 h-0.5 bg-gradient-to-r from-primary-500/20 via-primary-500/50 to-primary-500/20 -z-10"></div>
            
            {[
              { icon: Target, label: 'Learn' },
              { icon: Database, label: 'Collect Evidence' },
              { icon: LineChart, label: 'Update Mastery' },
              { icon: Network, label: 'Check Prerequisites' },
              { icon: Zap, label: 'Decide Next Action', highlight: true }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center relative group">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg relative ${
                  step.highlight ? 'bg-primary-600 border border-primary-400 shadow-[0_0_20px_rgba(139,92,246,0.6)]' : 'bg-surface border border-surfaceBorder'
                }`}>
                  <step.icon className={`w-7 h-7 ${step.highlight ? 'text-white' : 'text-primary-400'}`} />
                  {idx < 4 && (
                    <div className="hidden md:block absolute -right-[calc(50%+1rem)] top-1/2 -translate-y-1/2 w-8 text-center text-primary-500/50">
                      <ArrowRight className="w-5 h-5 mx-auto" />
                    </div>
                  )}
                </div>
                <span className={`text-sm font-semibold max-w-[120px] text-center ${step.highlight ? 'text-primary-300' : 'text-slate-300'}`}>
                  {step.label}
                </span>
                
                {/* Mobile Connector */}
                {idx !== 4 && (
                  <div className="md:hidden w-[2px] h-8 bg-primary-500/30 my-2"></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-12 relative z-10">
            <div className="flex items-center gap-2 text-primary-400 font-medium px-5 py-2.5 rounded-full bg-primary-900/20 border border-primary-500/20 shadow-inner">
              <Repeat className="w-4 h-4" />
              <span>Learn Again</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. "WHY THIS IS DIFFERENT" SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Why this is different</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">Fixed sequencing leaves learners behind. Adaptive sequencing meets them where they are.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Fixed Learning */}
          <div className="glass-panel p-8 md:p-10 rounded-3xl border-slate-700/50 bg-slate-900/50 opacity-80 flex flex-col items-center">
            <h3 className="text-2xl font-bold text-slate-300 mb-6 flex items-center gap-3 w-full justify-center">
              <span className="w-3 h-3 rounded-full bg-slate-500"></span>
              Fixed Learning
            </h3>
            <p className="text-slate-400 mb-8 font-medium text-center">Everyone follows the exact same path:</p>
            
            <div className="space-y-4 w-full flex flex-col items-center flex-1 justify-center">
              {['Concept A', 'Concept B', 'Concept C', 'Concept D'].map((c, i) => (
                <div key={i} className="flex flex-col items-center w-full max-w-[220px]">
                  <div className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3.5 text-center text-slate-300 font-medium">
                    {c}
                  </div>
                  {i < 3 && <div className="w-0.5 h-6 bg-slate-700 my-1"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Adaptive Learning */}
          <div className="glass-panel p-8 md:p-10 rounded-3xl border-primary-500/30 shadow-[0_0_40px_rgba(139,92,246,0.15)] relative overflow-hidden flex flex-col items-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 w-full justify-center">
              <span className="w-3 h-3 rounded-full bg-primary-500 animate-pulse"></span>
              MasteryFlow
            </h3>
            <p className="text-primary-200 mb-8 font-medium text-center">Dynamically generated for the individual:</p>
            
            <div className="space-y-4 relative z-10 w-full flex flex-col items-center flex-1 justify-center">
              <div className="flex flex-col items-center w-full max-w-[280px]">
                <div className="w-full bg-surface border border-white/10 rounded-lg p-3.5 text-slate-300 font-medium flex items-center justify-between">
                  <span>Learner Evidence</span> <Database className="w-4 h-4 text-slate-400" />
                </div>
                <div className="w-0.5 h-4 bg-primary-500/50 my-1"></div>
                
                <div className="w-full bg-surface border border-white/10 rounded-lg p-3.5 text-slate-300 font-medium flex items-center justify-between">
                  <span>Learner Model</span> <User className="w-4 h-4 text-slate-400" />
                </div>
                <div className="w-0.5 h-4 bg-primary-500/50 my-1"></div>
                
                <div className="w-full bg-surface border border-white/10 rounded-lg p-3.5 text-slate-300 font-medium flex items-center justify-between">
                  <span>Prerequisite Analysis</span> <Network className="w-4 h-4 text-slate-400" />
                </div>
                <div className="w-0.5 h-4 bg-primary-500/50 my-1"></div>

                <div className="w-full bg-primary-600 border border-primary-400 rounded-lg p-3.5 text-white font-bold shadow-lg flex items-center justify-between">
                  <span>Personalized Action</span> <Zap className="w-5 h-5 text-yellow-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ABOUT MASTERYFLOW */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="glass-panel p-10 md:p-16 rounded-[3rem] border-primary-500/20 relative overflow-hidden bg-surface/80 flex flex-col md:flex-row gap-12 items-center">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-primary-900/10 pointer-events-none"></div>
          
          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-6">
              <BrainCircuit className="w-4 h-4" />
              <span>About the Platform</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">What is MasteryFlow?</h2>
            <p className="text-lg text-slate-300 mb-6 leading-relaxed">
              MasteryFlow is an explainable adaptive learning platform that continuously understands learner evidence, mastery, prerequisite relationships, and learning history to determine the next best learning action.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              Built on the principles of evidence-based mastery and prerequisite-aware learning, it provides a highly personalized experience for students while equipping mentors with deep, explainable insights to guide effective interventions.
            </p>
          </div>
          
          <div className="flex-1 relative z-10 w-full">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                <Database className="w-8 h-8 text-primary-400 mb-3" />
                <span className="font-semibold text-white">Evidence-Based</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                <Network className="w-8 h-8 text-emerald-400 mb-3" />
                <span className="font-semibold text-white">Prerequisite-Aware</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                <BrainCircuit className="w-8 h-8 text-indigo-400 mb-3" />
                <span className="font-semibold text-white">Explainable</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                <Users className="w-8 h-8 text-purple-400 mb-3" />
                <span className="font-semibold text-white">Mentor Driven</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. STUDENT + MENTOR SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full border-t border-white/5">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Student */}
          <div className="flex flex-col items-start relative group glass-panel p-10 rounded-[2.5rem] hover:border-indigo-500/30 transition-colors">
             <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-8">
               <GraduationCap className="w-8 h-8 text-indigo-400" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-4">Your learning path adapts to you.</h2>
             <ul className="space-y-3 mb-10 text-slate-300 font-medium">
               <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Personalized learning</li>
               <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> True mastery tracking</li>
               <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Targeted practice & review</li>
             </ul>
             <Link to="/student" className="btn bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 py-4 mt-auto shadow-lg shadow-indigo-500/25">
               Explore Student Learning <ArrowRight className="w-4 h-4" />
             </Link>
          </div>

          {/* Mentor */}
          <div className="flex flex-col items-start relative group glass-panel p-10 rounded-[2.5rem] hover:border-purple-500/30 transition-colors">
             <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-8">
               <Users className="w-8 h-8 text-purple-400" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-4">See where learners need support.</h2>
             <ul className="space-y-3 mb-10 text-slate-300 font-medium">
               <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Classroom analytics</li>
               <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Identify concept gaps</li>
               <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Evidence-based interventions</li>
             </ul>
             <Link to="/mentor" className="btn bg-purple-600 hover:bg-purple-500 text-white rounded-full px-8 py-4 mt-auto shadow-lg shadow-purple-500/25">
               Explore Mentor Tools <ArrowRight className="w-4 h-4" />
             </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="w-full border-t border-white/5 bg-surface/50 py-12 px-4 mt-12 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-white text-lg tracking-wide">MasteryFlow</span>
          </div>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} MasteryFlow. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-400 font-medium">
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
