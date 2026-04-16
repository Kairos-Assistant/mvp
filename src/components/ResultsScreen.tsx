import { SimulationSession } from "../types";
import { CATEGORIES } from "../constants";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Award, Target, AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, BarChart3, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";

interface ResultsScreenProps {
  session: SimulationSession;
  onDone: () => void;
}

export default function ResultsScreen({ session, onDone }: ResultsScreenProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { scores } = session;

  const chartData = CATEGORIES.map((cat) => ({
    subject: cat.split(" ")[0], // Shorten for chart
    full: cat,
    value: scores.categoryScores[cat]?.score || 0,
  }));

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "High": return "text-green-500";
      case "Medium": return "text-amber-500";
      case "Low": return "text-red-500";
      default: return "text-slate-500";
    }
  };

  const handleViewInTranscript = (index: number) => {
    setShowFullTranscript(true);
    setHighlightedIndex(index);
    
    // Use a small timeout to ensure the modal is rendered before scrolling
    setTimeout(() => {
      const element = messageRefs.current[index];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="bg-white/40 backdrop-blur-sm border border-black/5 rounded-3xl p-8 md:p-12 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/40 rounded-full text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">
              <Award size={14} />
              <span>Simulation Complete</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-[#6279b8] mb-2">
              {scores.convictionScore}<span className="text-2xl md:text-4xl text-slate-400">/100</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
              <div className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Conviction Score
              </div>
              <div className={cn("flex items-center gap-1 text-sm font-bold", getConfidenceColor(scores.confidenceLevel))}>
                <Target size={14} />
                <span>{scores.confidenceLevel} Confidence</span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold text-slate-500">
                <BarChart3 size={14} />
                <span>{scores.coverageScore}% Coverage</span>
              </div>
            </div>
            <p className="text-lg text-slate-700 leading-relaxed italic font-medium">
              "{scores.investorSummary}"
            </p>
          </div>

          <div className="w-full md:w-80 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData}>
                <PolarGrid stroke="#00000010" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#6279b8"
                  fill="#6279b8"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {session.roundLength === 2 && (
          <div className="mt-8 p-4 bg-amber-50/50 border border-amber-100 rounded-xl flex items-start gap-3 text-amber-700 text-sm">
            <AlertTriangle size={18} className="shrink-0" />
            <p>
              <strong>Quick Fire round</strong> — score is indicative only. Run a 5 or 10-minute session for a fuller picture of your blind spots.
            </p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Breakdown */}
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Category Breakdown</h2>
            <div className="grid gap-3">
              {CATEGORIES.map((cat) => {
                const score = scores.categoryScores[cat];
                const isExpanded = expandedCategory === cat;
                return (
                  <div 
                    key={cat}
                    className="bg-white/40 backdrop-blur-sm border border-black/5 rounded-xl overflow-hidden"
                  >
                    <button 
                      onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/40 flex items-center justify-center font-bold text-[#6279b8]">
                          {Math.round(score?.score || 0)}
                        </div>
                        <span className="font-bold text-sm text-slate-700">{cat}</span>
                      </div>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {isExpanded && (
                      <div className="p-4 pt-0 text-sm text-slate-600 border-t border-black/5">
                        <p className="leading-relaxed font-medium">{score?.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">Transcript Highlights</h2>
              <button 
                onClick={() => setShowFullTranscript(true)}
                className="text-xs text-[#6279b8] font-bold hover:underline"
              >
                View Full Transcript
              </button>
            </div>
            <div className="space-y-4">
              {session.transcript.filter(m => m.role !== 'system').slice(-4).map((m, i) => (
                <div key={i} className={cn(
                  "p-4 rounded-xl text-sm font-medium",
                  m.role === 'investor' ? "bg-white/40 border border-black/5 ml-0 mr-12" : "bg-[#6279b8]/10 ml-12 mr-0 border border-[#6279b8]/20"
                )}>
                  <div className="font-bold uppercase text-[10px] tracking-widest mb-1 opacity-50">
                    {m.role}
                  </div>
                  <p>{m.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Fix Next & Strengths */}
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Top 3 Fix-Next</h2>
            <div className="grid gap-3">
              {scores.fixNext.map((fix, i) => (
                <div key={i} className="p-4 bg-white/40 backdrop-blur-sm border border-black/5 rounded-xl border-l-4 border-l-red-500">
                  <p className="text-sm font-bold mb-2 text-slate-800">{fix.item}</p>
                  <button 
                    onClick={() => handleViewInTranscript(fix.transcriptIndex)}
                    className="text-xs text-[#6279b8] font-bold flex items-center gap-1 hover:underline"
                  >
                    View in transcript <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Top 3 Strengths</h2>
            <div className="grid gap-3">
              {scores.strengths.map((strength, i) => (
                <div key={i} className="p-4 bg-white/40 backdrop-blur-sm border border-black/5 rounded-xl border-l-4 border-l-[#5aaa95]">
                  <div className="flex items-center gap-2 text-[#5aaa95] mb-1">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-bold uppercase tracking-widest">Strength</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{strength}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-8">
            <button
              onClick={onDone}
              className="w-full p-4 bg-[#6279b8] text-white font-bold rounded-xl hover:bg-[#5266a0] transition-all shadow-lg shadow-[#6279b8]/20"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
      {/* Full Transcript Modal */}
      {showFullTranscript && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setShowFullTranscript(false);
              setHighlightedIndex(null);
            }}
          />
          <div className="relative w-full max-w-3xl bg-[#E3DBD5] rounded-[32px] shadow-2xl border border-black/5 flex flex-col max-h-[80vh]">
            <div className="p-8 border-b border-black/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-800">Full Transcript</h2>
                <p className="text-sm text-slate-500 font-medium">Review your session with the {session.evaluatorType}</p>
              </div>
              <button 
                onClick={() => {
                  setShowFullTranscript(false);
                  setHighlightedIndex(null);
                }}
                className="p-2 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6" ref={transcriptRef}>
              {session.transcript.map((m, i) => (
                <div 
                  key={i} 
                  ref={el => messageRefs.current[i] = el}
                  className={cn(
                    "p-6 rounded-2xl text-sm font-medium transition-all duration-500",
                    m.role === 'investor' 
                      ? "bg-white/60 border border-black/5 ml-0 mr-12" 
                      : "bg-[#6279b8]/10 ml-12 mr-0 border border-[#6279b8]/20",
                    highlightedIndex === i && "ring-2 ring-red-500 ring-offset-4 bg-red-50/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold uppercase text-[10px] tracking-widest opacity-50">
                      {m.role}
                    </div>
                    <div className="text-[10px] opacity-30">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <p className="text-base leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
