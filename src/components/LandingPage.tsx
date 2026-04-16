import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Shield, Zap, Target, BarChart3 } from "lucide-react";

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#E3DBD5]">
      {/* Hero Section */}
      <header className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tighter text-[#6279b8] mb-8">
                KAIROS
              </h1>
              <p className="text-2xl md:text-3xl text-slate-700 font-medium leading-tight mb-12">
                Identify blind spots and articulate your business <br className="hidden md:block" />
                with precision before you seek funding.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={onStart}
                  className="w-full sm:w-auto px-10 py-5 bg-[#6279b8] text-white font-bold rounded-2xl hover:bg-[#5266a0] transition-all shadow-xl shadow-[#6279b8]/20 flex items-center justify-center gap-2 text-lg"
                >
                  Try Demo <ArrowRight size={20} />
                </button>
                <a
                  href="#features"
                  className="w-full sm:w-auto px-10 py-5 bg-white/50 text-slate-700 font-bold rounded-2xl border-2 border-white/20 hover:border-[#5aaa95] hover:text-[#5aaa95] transition-all flex items-center justify-center gap-2 text-lg"
                >
                  Learn More
                </a>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Abstract background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6279b8] rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#5aaa95] rounded-full blur-[120px]" />
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#5aaa95] mb-4">Why Kairos?</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Articulate your vision with confidence.
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="text-[#6279b8]" />,
                title: "Expose Blind Spots",
                description: "Our AI probes your business model to find the questions you haven't asked yourself yet."
              },
              {
                icon: <Target className="text-[#5aaa95]" />,
                title: "Precision Articulation",
                description: "Learn to communicate complex ideas simply and effectively before meeting investors."
              },
              {
                icon: <BarChart3 className="text-[#c2948a]" />,
                title: "Conviction Scoring",
                description: "Measure your readiness with a 'Conviction Score' based on real investor-grade rubrics."
              },
              {
                icon: <Shield className="text-[#6279b8]" />,
                title: "Risk Mitigation",
                description: "Identify and address potential deal-breakers in a safe, simulated environment."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl border border-white/20 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-[#6279b8] rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">
                Ready to find your blind spots?
              </h2>
              <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
                Join founders who are using Kairos to stress-test their business logic and articulate their value before seeking capital.
              </p>
              <button
                onClick={onStart}
                className="px-12 py-6 bg-white text-[#6279b8] font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-xl text-xl"
              >
                Start Simulation
              </button>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5aaa95]/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-display font-bold text-2xl text-[#6279b8]">KAIROS</div>
          <p className="text-slate-500 text-sm">© 2026 Kairos. All rights reserved.</p>
          <div className="flex items-center gap-8 text-sm font-bold text-slate-700">
            <a href="#" className="hover:text-[#6279b8]">Privacy</a>
            <a href="#" className="hover:text-[#6279b8]">Terms</a>
            <a href="#" className="hover:text-[#6279b8]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
