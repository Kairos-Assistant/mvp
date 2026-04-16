import { useState } from "react";
import { CompanyProfile, EvaluatorType, FocusMode, Difficulty, RoundLength } from "../types";
import { Play, X, Info } from "lucide-react";
import { cn } from "../lib/utils";

interface SimulationSetupProps {
  profile: CompanyProfile;
  onStart: (config: {
    evaluator: EvaluatorType;
    focus: FocusMode;
    difficulty: Difficulty;
    roundLength: RoundLength;
  }) => void;
  onCancel: () => void;
}

export default function SimulationSetup({ profile, onStart, onCancel }: SimulationSetupProps) {
  const [evaluator, setEvaluator] = useState<EvaluatorType>("VC");
  const [focus, setFocus] = useState<FocusMode>("Full");
  const [difficulty, setDifficulty] = useState<Difficulty>("Neutral");
  const [roundLength, setRoundLength] = useState<RoundLength>("5");

  const evaluators: EvaluatorType[] = ["VC", "Angel Investor", "Incubator", "Accelerator", "Pitch Competition"];
  const focuses: FocusMode[] = ["Idea", "Business Model", "Traction", "Full"];
  const difficulties: Difficulty[] = ["Friendly", "Neutral", "Aggressive"];
  const lengths: { value: RoundLength; label: string; desc: string }[] = [
    { value: "2", label: "Quick Fire", desc: "Indicative score only. Confidence will be Low." },
    { value: "5", label: "Standard", desc: "Balanced session for a clear picture." },
    { value: "10", label: "Deep Dive", desc: "Thorough stress-test of your business." },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Simulation Setup</h1>
          <p className="text-slate-500">
            Configure your session with {profile.name}.
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="grid gap-12">
        {/* Evaluator Type */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">1. Select Evaluator</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {evaluators.map((e) => (
              <button
                key={e}
                onClick={() => setEvaluator(e)}
                className={cn(
                  "p-4 text-sm font-bold rounded-xl border transition-all text-center",
                  evaluator === e 
                    ? "bg-[#6279b8] text-white border-[#6279b8] shadow-lg shadow-[#6279b8]/20" 
                    : "bg-white/40 backdrop-blur-sm border-black/5 text-slate-600 hover:border-[#6279b8]"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </section>

        {/* Focus Mode */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">2. Test Focus</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {focuses.map((f) => (
              <button
                key={f}
                onClick={() => setFocus(f)}
                className={cn(
                  "p-4 text-sm font-bold rounded-xl border transition-all text-center",
                  focus === f 
                    ? "bg-[#5aaa95] text-white border-[#5aaa95] shadow-lg shadow-[#5aaa95]/20" 
                    : "bg-white/40 backdrop-blur-sm border-black/5 text-slate-600 hover:border-[#5aaa95]"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Difficulty */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">3. Difficulty</h2>
            <div className="flex gap-3">
              {difficulties.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "flex-1 p-4 text-sm font-bold rounded-xl border transition-all text-center",
                    difficulty === d 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white/40 backdrop-blur-sm border-black/5 text-slate-600 hover:border-slate-900"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </section>

          {/* Round Length */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">4. Round Length</h2>
            <div className="grid gap-3">
              {lengths.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setRoundLength(l.value)}
                  className={cn(
                    "p-4 text-left rounded-xl border transition-all relative group",
                    roundLength === l.value 
                      ? "bg-white border-[#6279b8] ring-2 ring-[#6279b8]/20" 
                      : "bg-white/40 backdrop-blur-sm border-black/5 hover:border-[#6279b8]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">{l.label} ({l.value} min)</span>
                    {roundLength === l.value && <div className="w-2 h-2 rounded-full bg-[#6279b8]" />}
                  </div>
                  <p className="text-xs text-slate-500">{l.desc}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="pt-8 border-t border-black/5">
          <button
            onClick={() => onStart({ evaluator, focus, difficulty, roundLength })}
            className="w-full flex items-center justify-center gap-3 p-6 bg-[#6279b8] text-white text-xl font-bold rounded-xl hover:bg-[#5266a0] transition-all shadow-xl shadow-[#6279b8]/20"
          >
            <Play size={24} fill="currentColor" />
            <span>Start Simulation</span>
          </button>
          <p className="text-center text-xs text-slate-500 mt-4 font-medium">
            The timer is enforced. Identify your blind spots before seeking funding.
          </p>
        </div>
      </div>
    </div>
  );
}
