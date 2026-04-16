import React, { useEffect, useState } from 'react';
import { getRegistrations } from '../lib/firebase';
import { Mail, Calendar, User, ShieldCheck, Search, Filter, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface Registration {
  id: string;
  email: string;
  registeredAt: any;
}

export default function Registrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRegistrations();
      if (data) {
        setRegistrations(data as Registration[]);
      }
    } catch (err) {
      setError("Failed to load registrations. You may not have permission.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const filtered = registrations.filter(r => 
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ["Email", "Registered At"],
      ...filtered.map(r => [
        r.email, 
        r.registeredAt?.toDate ? format(r.registeredAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'Unknown'
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kairos-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#6279b8]/10 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-[#6279b8]" size={18} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Admin Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Registered Founders</h1>
          <p className="text-slate-500 mt-2">Manage and view all email registrations from the beta signup.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchRegistrations}
            className="p-3 bg-white border border-black/5 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
            title="Refresh"
          >
            <RefreshCw size={20} className={cn(loading && "animate-spin")} />
          </button>
          <button 
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Registrations</p>
          <p className="text-3xl font-bold text-slate-900">{registrations.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Last 24 Hours</p>
          <p className="text-3xl font-bold text-slate-900">
            {registrations.filter(r => {
              const date = r.registeredAt?.toDate ? r.registeredAt.toDate() : new Date(0);
              return new Date().getTime() - date.getTime() < 24 * 60 * 60 * 1000;
            }).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Unique Domains</p>
          <p className="text-3xl font-bold text-slate-900">
            {new Set(registrations.map(r => r.email.split('@')[1])).size}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6279b8]/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Filter size={16} />
            <span>Showing {filtered.length} of {registrations.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">Founder Email</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">Registration Date</th>
                <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="text-[#6279b8] animate-spin" size={32} />
                      <p className="text-slate-500 font-medium">Loading registrations...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Mail className="text-slate-400" size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No registrations found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((reg, idx) => (
                  <tr key={reg.id} className={cn("hover:bg-slate-50/50 transition-colors", idx !== filtered.length - 1 && "border-b border-black/5")}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#6279b8]/10 rounded-xl flex items-center justify-center text-[#6279b8] font-bold">
                          {reg.email[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-700">{reg.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={16} />
                        <span className="font-medium">
                          {reg.registeredAt?.toDate ? format(reg.registeredAt.toDate(), 'MMM d, yyyy • h:mm a') : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
