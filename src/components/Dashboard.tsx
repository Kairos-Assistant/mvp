import { CompanyProfile, SimulationSession } from "../types";
import { StorageService } from "../services/storageService";
import { useState, useEffect } from "react";
import { Play, TrendingUp, History as HistoryIcon, Target, Award, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../lib/utils";

interface DashboardProps {
  profile: CompanyProfile;
  onStartSim: () => void;
}

export default function Dashboard({ profile, onStartSim }: DashboardProps) {
  const [sessions, setSessions] = useState<SimulationSession[]>([]);

  useEffect(() => {
    const allSessions = StorageService.getSessions();
    setSessions(allSessions.filter(s => s.companyProfileId === profile.id));
  }, [profile.id]);

  const latestSession = sessions[sessions.length - 1];
  const chartData = sessions.slice(-10).map(s => ({
    date: new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: s.scores.convictionScore
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{profile.name}</h1>
          <p className="text-slate-500 max-w-xl">{profile.oneLiner}</p>
        </div>
        <button
          onClick={onStartSim}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#6279b8] text-white font-bold rounded-xl hover:bg-[#5266a0] transition-all shadow-lg shadow-[#6279b8]/20"
        >
          <Play size={20} fill="currentColor" />
          <span>Run Simulation</span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Stats Cards */}
        <div className="bg-white/40 backdrop-blur-sm border border-black/5 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <Award size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Latest Score</span>
          </div>
          <div className="text-5xl font-bold text-[#6279b8]">
            {latestSession ? latestSession.scores.convictionScore : "--"}<span className="text-xl text-slate-400">/100</span>
          </div>
          <div className="mt-2 text-sm text-slate-600">
            {latestSession ? `Confidence: ${latestSession.scores.confidenceLevel}` : "No sessions yet"}
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-sm border border-black/5 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <Target size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Focus Area</span>
          </div>
          <div className="text-2xl font-bold">
            {latestSession ? latestSession.focusType : "N/A"}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Based on last session
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-sm border border-black/5 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <HistoryIcon size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Total Sessions</span>
          </div>
          <div className="text-5xl font-bold">
            {sessions.length}
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Identify your blind spots
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-sm border border-black/5 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-slate-500">
              <TrendingUp size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Score Trend</span>
            </div>
          </div>
          <div className="h-64 w-full">
            {sessions.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255,255,255,0.9)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6279b8" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6279b8', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <p className="font-medium">Not enough data for trend chart.</p>
                <p className="text-xs">Complete 2 or more simulations to track progress.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Fix-Next */}
        <div className="bg-white/40 backdrop-blur-sm border border-black/5 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Priority Fixes</h3>
          <div className="space-y-4">
            {latestSession ? latestSession.scores.fixNext.map((fix, i) => (
              <div key={i} className="flex items-start gap-3 group cursor-pointer">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#c2948a] shrink-0" />
                <p className="text-sm font-medium group-hover:text-[#6279b8] transition-colors">{fix.item}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-500 italic">No blind spots identified yet.</p>
            )}
          </div>
          {latestSession && (
            <button className="w-full mt-8 text-xs font-bold text-[#6279b8] flex items-center justify-center gap-1 hover:underline">
              View full report <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
