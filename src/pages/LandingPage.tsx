import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  BrainCircuit, 
  Target, 
  GitBranch, 
  Lightbulb, 
  Clock, 
  LineChart, 
  ArrowRight,
  Database,
  Network,
  Activity,
  CheckCircle2,
  User
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      
      {/* 2. Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-5xl w-full flex flex-col items-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-300 text-sm font-medium mb-8">
          <BrainCircuit className="w-4 h-4" />
          <span>Evidence-based adaptive learning</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Learning that <span className="text-gradient">adapts to you.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mb-12 leading-relaxed">
          MasteryFlow understands what learners know, what they struggle with, and exactly what they should learn next through an explainable learner model.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            to="/student/login"
            className="flex-1 sm:flex-none btn-primary rounded-full px-8 py-4 text-lg"
          >
            Start Learning
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/staff/login"
            className="flex-1 sm:flex-none btn-secondary rounded-full px-8 py-4 text-lg"
          >
            Explore for Educators
          </Link>
        </div>
      </section>

      {/* 3. Role Selection */}
      <section id="roles" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl w-full">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Card */}
          <div className="glass-panel interactive-card p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary-500/20 transition-colors pointer-events-none"></div>
            
            <GraduationCap className="w-16 h-16 text-primary-400 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Student</h2>
            <p className="text-slate-400 text-lg mb-8 h-16">
              Build your skills through a personalized learning path that adapts dynamically to your performance and memory.
            </p>
            <Link 
              to="/student/login"
              className="btn-primary w-full group-hover:bg-primary-500 transition-colors"
            >
              Continue as Student
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Staff Card */}
          <div className="glass-panel interactive-card p-8 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-500/20 transition-colors pointer-events-none"></div>
            
            <Users className="w-16 h-16 text-indigo-400 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Staff</h2>
            <p className="text-slate-400 text-lg mb-8 h-16">
              Create classrooms, monitor true learner mastery, and guide students with evidence-based interventions.
            </p>
            <Link 
              to="/staff/login"
              className="btn-outline w-full text-indigo-300 hover:text-white"
            >
              Continue as Staff
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl w-full text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-16">The Learning Loop</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-12 left-12 right-12 h-[2px] bg-gradient-to-r from-primary-900 via-primary-500 to-primary-900 -z-10"></div>
          
          {[
            { icon: Target, label: 'Assess', desc: 'Identify baseline' },
            { icon: Database, label: 'Understand', desc: 'Build knowledge graph' },
            { icon: GitBranch, label: 'Personalize', desc: 'Select best path' },
            { icon: Lightbulb, label: 'Learn', desc: 'Engage with content' },
            { icon: Activity, label: 'Adapt', desc: 'Update mastery model' }
          ].map((step, idx) => (
            <div key={idx} className="flex flex-col items-center w-full md:w-1/5 relative group">
              <div className="w-24 h-24 rounded-2xl glass-panel flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-primary-500/50 transition-all shadow-lg">
                <step.icon className="w-10 h-10 text-primary-400 group-hover:text-primary-300 group-hover:animate-pulse-glow" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{step.label}</h3>
              <p className="text-slate-400 text-sm">{step.desc}</p>
              
              {/* Mobile Connector */}
              {idx !== 4 && (
                <div className="md:hidden w-[2px] h-12 bg-surfaceBorder my-4"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 5. Adaptive Intelligence Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl w-full">
        <div className="glass-panel p-8 md:p-16 rounded-[3rem] border-primary-900/50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-indigo-900/10 pointer-events-none"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Deterministic Intelligence</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Not a black-box AI. Our engine uses proven cognitive science to map knowledge dependencies and select the Next Best Action for every student.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 relative z-10">
            <div className="glass-panel px-6 py-4 rounded-xl flex items-center gap-3 border-primary-500/30 w-full md:w-auto text-center md:text-left justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span className="font-semibold text-white">Learner Activity</span>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-600 rotate-90 md:rotate-0" />
            <div className="glass-panel px-6 py-4 rounded-xl flex items-center gap-3 border-primary-500/30 w-full md:w-auto justify-center">
              <Database className="w-6 h-6 text-blue-400" />
              <span className="font-semibold text-white">Collect Evidence</span>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-600 rotate-90 md:rotate-0" />
            <div className="glass-panel px-6 py-4 rounded-xl flex items-center gap-3 border-primary-500/30 w-full md:w-auto justify-center">
              <LineChart className="w-6 h-6 text-purple-400" />
              <span className="font-semibold text-white">Update Mastery</span>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-600 rotate-90 md:rotate-0" />
            <div className="glass-panel px-6 py-4 rounded-xl flex items-center gap-3 border-primary-500/30 bg-primary-900/20 w-full md:w-auto justify-center shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <Target className="w-6 h-6 text-primary-400" />
              <span className="font-bold text-white">Next Best Action</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Feature highlights */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white">Platform Features</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: User,
              title: 'Personalized Learning',
              desc: 'No two students see the same sequence. The platform adapts to individual pace and prior knowledge.'
            },
            {
              icon: Target,
              title: 'Concept Mastery',
              desc: 'We track understanding at a granular concept level, not just overall course completion.'
            },
            {
              icon: Network,
              title: 'Adaptive Paths',
              desc: 'Prerequisite graphs ensure students are always ready for what they are about to learn.'
            },
            {
              icon: BrainCircuit,
              title: 'Explainable AI',
              desc: 'Every recommendation comes with reasoning. Teachers and students always know why a topic was chosen.'
            },
            {
              icon: Clock,
              title: 'Spaced Review',
              desc: 'Combats the forgetting curve by strategically resurfacing past concepts right before they fade.'
            },
            {
              icon: LineChart,
              title: 'Teacher Insights',
              desc: 'Staff dashboards highlight struggling learners and gaming behaviors for timely human intervention.'
            }
          ].map((feature, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-900/30 flex items-center justify-center mb-6 border border-primary-500/20">
                <feature.icon className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="w-full border-t border-surfaceBorder bg-surface py-12 px-4 text-center mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-white text-lg">MasteryFlow</span>
          </div>
          <p className="text-slate-500">
            &copy; 2026 MasteryFlow. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
