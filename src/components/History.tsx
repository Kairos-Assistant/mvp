import { CompanyProfile, SimulationSession } from "../types";
import { StorageService } from "../services/storageService";
import React, { useState, useEffect } from "react";
import { Calendar, Award, ChevronRight, Search, Filter, History as HistoryIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface HistoryProps {
  profile: CompanyProfile;
  onViewSession: (session: SimulationSession) => void;
}

export default function History({ profile, onViewSession }: HistoryProps) {
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const allSessions = StorageService.getSessions();
    setSessions(allSessions.filter(s => s.companyProfileId === profile.id).reverse());
  }, [profile.id]);

  const filteredSessions = sessions.filter(s => 
    s.evaluatorType.toLowerCase().includes(search.toLowerCase()) ||
    s.focusType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Simulation History</h1>
          <p className="text-slate-500">Review your past sessions and track your progress.</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white/40 backdrop-blur-sm border border-black/5 rounded-lg outline-none focus:ring-2 focus:ring-[#6279b8] transition-all w-full md:w-64 font-medium"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredSessions.length > 0 ? filteredSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onViewSession(session)}
            className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/40 backdrop-blur-sm border border-black/5 rounded-xl hover:border-[#6279b8] transition-all group text-left"
          >
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="w-14 h-14 rounded-xl bg-white/40 flex flex-col items-center justify-center text-[#6279b8]">
                <span className="text-xl font-bold">{session.scores.convictionScore}</span>
                <span className="text-[8px] font-bold uppercase tracking-tighter opacity-50">/100</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800">{session.evaluatorType} Simulation</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-white/40 rounded-full font-bold uppercase tracking-widest text-slate-500">
                    {session.focusType}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Award size={12} />
                    <span className={cn(
                      "font-bold",
                      session.scores.confidenceLevel === 'High' ? "text-green-500" : 
                      session.scores.confidenceLevel === 'Medium' ? "text-amber-500" : "text-red-500"
                    )}>
                      {session.scores.confidenceLevel} Confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Top Blind Spot</p>
                <p className="text-sm font-bold text-slate-700 max-w-[200px] truncate">
                  {session.scores.fixNext[0]?.item || "None identified"}
                </p>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-[#6279b8] group-hover:translate-x-1 transition-all" />
            </div>
          </button>
        )) : (
          <div className="text-center py-24 bg-white/40 backdrop-blur-sm rounded-2xl border-2 border-dashed border-black/10">
            <HistoryIcon size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 font-bold">No sessions found.</p>
            <p className="text-sm text-slate-500 font-medium">Run your first simulation to identify your blind spots.</p>
          </div>
        )}
      </div>
    </div>
  );
}
