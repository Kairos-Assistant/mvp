import React, { useState, useEffect } from 'react';
import { auth, loginWithGoogle, loginWithEmail, getUserSimulations, getUsers } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ShieldCheck, LogIn, AlertCircle, BarChart3, Users, Home, LogOut } from 'lucide-react';
import Registrations from './Registrations';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'registrations' | 'simulations'>('users');
  const [simulations, setSimulations] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [localAdminUser, setLocalAdminUser] = useState<string | null>(localStorage.getItem('kairos_admin_session'));

  const fallbackEmails = "lseyoum@andrew.cmu.edu,sajayi@andrew.cmu.edu";
  let rawAdminEmails = fallbackEmails;
  try {
    // @ts-ignore
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.ADMIN_EMAILS) {
      // @ts-ignore
      rawAdminEmails = import.meta.env.VITE_ADMIN_EMAILS;
    }
  } catch (e) {}
  
  const ADMIN_EMAILS = String(rawAdminEmails || fallbackEmails).split(',').map((e: string) => e.trim());

  const [emailInput, setEmailInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if ((user?.email && ADMIN_EMAILS.includes(user.email)) || (localAdminUser && ADMIN_EMAILS.includes(localAdminUser))) {
      const unsub = getUserSimulations(null, (sims) => {
        setSimulations(sims);
      });
      getUsers().then(u => {
        if (u) setDbUsers(u);
      });
      return () => unsub();
    }
  }, [user, localAdminUser]);

  const currentAdminEmail = user?.email || localAdminUser;
  const isAdmin = currentAdminEmail && ADMIN_EMAILS.includes(currentAdminEmail);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      if (localAdminUser) {
        setLocalAdminUser(null);
        localStorage.removeItem('kairos_admin_session');
      }
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // MVP Fallback: directly check if the provided email is literally in our exact Admin comma-separated string
    if (ADMIN_EMAILS.includes(emailInput)) {
      setLocalAdminUser(emailInput);
      localStorage.setItem('kairos_admin_session', emailInput);
    } else {
      setErrorMsg("This email is not authorized as an administrator.");
    }
  };

  const handleAdminLogout = async () => {
    localStorage.removeItem('kairos_admin_session');
    setLocalAdminUser(null);
    try {
      await auth.signOut();
    } catch(e) {}
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#E3DBD5]">
        <div className="animate-spin w-8 h-8 border-4 border-[#6279b8] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && !localAdminUser) {
    return (
      <div className="absolute inset-0 z-[100] bg-[#E3DBD5] flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center border border-black/5">
          <ShieldCheck className="mx-auto text-[#6279b8] w-16 h-16 mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 mb-6">Please sign in to access the admin portal.</p>
          
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex flex-col gap-1 items-center justify-center">
              <div className="flex items-center gap-2"><AlertCircle size={16} />{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-6 text-left">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1">Admin Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6279b8]/20 transition-all font-medium text-slate-800"
                placeholder="admin@andrew.cmu.edu"
                required
              />
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
              Enter Dashboard
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-white px-4 text-slate-400">Or continue with</span>
            </div>
          </div>

          <button onClick={handleLogin} type="button" className="w-full py-4 bg-[#6279b8] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#5268a7] transition-all shadow-lg shadow-[#6279b8]/20">
            <LogIn size={20} /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }



  if (!isAdmin) {
    return (
      <div className="absolute inset-0 z-[100] bg-[#E3DBD5] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center border border-black/5">
          <AlertCircle className="text-red-500 w-16 h-16 mb-4 mx-auto" />
          <h1 className="text-3xl font-bold mb-2 text-slate-800">Unauthorized</h1>
          <p className="text-slate-600 mb-8">Your account <span className="font-bold">{currentAdminEmail}</span> does not have access to the admin dashboard.</p>
          <div className="flex flex-col gap-3">
            <button onClick={handleLogout} className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              Sign out to switch accounts
            </button>
            <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              <Home size={18} /> Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] bg-[#E3DBD5] flex flex-col overflow-y-auto">
      <div className="p-8 max-w-6xl w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
              <ShieldCheck className="text-[#6279b8]" size={36} />
              Admin Portal
            </h1>
            <p className="text-slate-500 mt-2">Manage registered founders, waitlist, and view simulation statistics.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.location.href = '/'} className="p-3 px-6 bg-white border border-black/5 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 flex items-center gap-2 font-bold text-sm shadow-sm">
              <Home size={18} /> Home
            </button>
            <button onClick={handleAdminLogout} className="p-3 px-6 bg-slate-900 border border-black/5 rounded-xl hover:bg-slate-800 transition-colors text-white flex items-center gap-2 font-bold text-sm shadow-sm">
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-black/5 p-1.5 rounded-2xl w-full sm:w-fit overflow-x-auto">
          <button 
            onClick={() => setActiveTab('users')} 
            className={cn(
              "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap", 
              activeTab === 'users' 
                ? "bg-white text-[#6279b8] shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
            )}
          >
            <Users size={18} /> Signed Up Users
          </button>
          <button 
            onClick={() => setActiveTab('registrations')} 
            className={cn(
              "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap", 
              activeTab === 'registrations' 
                ? "bg-white text-[#6279b8] shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
            )}
          >
            <Users size={18} /> Beta Waitlist
          </button>
          <button 
            onClick={() => setActiveTab('simulations')} 
            className={cn(
              "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap", 
              activeTab === 'simulations' 
                ? "bg-white text-[#6279b8] shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
            )}
          >
            <BarChart3 size={18} /> Usage & Simulation Stats
          </button>
        </div>

        <div>
          {activeTab === 'users' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Total Platform Users</p>
                  <p className="text-3xl font-bold text-slate-900">{dbUsers.length}</p>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Roles Breakdown</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="text-sm font-bold text-slate-700">{dbUsers.filter(u => u.role === 'admin').length} Admins</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      <span className="text-sm font-bold text-slate-700">{dbUsers.filter(u => u.role !== 'admin').length} Users</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Last 24 Hours</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {dbUsers.filter(u => {
                      const date = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(0);
                      return new Date().getTime() - date.getTime() < 24 * 60 * 60 * 1000;
                    }).length}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-black/5 bg-slate-50/50 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Platform Users</h2>
                  <div className="text-sm font-medium text-slate-500">{dbUsers.length} total users</div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">User</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">Role</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">Joined At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbUsers.map((u, i) => (
                        <tr key={u.id || i} className="hover:bg-slate-50/50 transition-colors border-b border-black/5 last:border-0">
                          <td className="px-6 py-5">
                            <div className="font-medium text-slate-800">{u.displayName || u.email || 'Unknown User'}</div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold capitalize", u.role === 'admin' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600")}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-sm text-slate-600">
                            {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'MMM d, yyyy h:mm a') : 'Unknown Date'}
                          </td>
                        </tr>
                      ))}
                      {dbUsers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-slate-500 font-medium">
                            No full users exist in the database yet. 
                            <br/><span className="text-xs mt-2 block opacity-70">(There may be permission issues if rules block read access, or no users have registered a profile yet).</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div className="bg-white rounded-[32px] p-2 shadow-sm border border-black/5">
              <Registrations />
            </div>
          )}

          {activeTab === 'simulations' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SimulationStats simulations={simulations} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SimulationStats({ simulations }: { simulations: any[] }) {
  const avgScore = simulations.length > 0 
    ? (simulations.reduce((acc, sim) => acc + (sim.convictionScore || 0), 0) / simulations.length).toFixed(1)
    : 0;

  const anonymousCount = simulations.filter(s => s.userId === 'anonymous').length;
  const registeredCount = simulations.length - anonymousCount;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Total Simulations</p>
          <p className="text-4xl font-bold text-slate-900">{simulations.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Avg Conviction Score</p>
          <p className="text-4xl font-bold text-[#6279b8]">{avgScore}%</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Registered Users</p>
          <p className="text-4xl font-bold text-slate-900">{registeredCount}</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] border border-black/5 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Anonymous Uses</p>
          <p className="text-4xl font-bold text-slate-900">{anonymousCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800">Recent Simulation History</h2>
          <div className="text-sm font-medium text-slate-500">
            Showing {Math.min(simulations.length, 50)} latest sessions
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">User Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">Evaluator Profile</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">Conviction</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-black/5">Feedback Items</th>
              </tr>
            </thead>
            <tbody>
              {simulations.slice(0, 50).map((sim, i) => (
                <tr key={sim.id || i} className="hover:bg-slate-50/50 transition-colors border-b border-black/5 last:border-0">
                  <td className="px-6 py-5">
                    <div className="text-sm font-medium text-slate-800">
                      {sim.createdAt?.toDate ? format(sim.createdAt.toDate(), 'MMM d, yyyy') : 'Unknown Date'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {sim.createdAt?.toDate ? format(sim.createdAt.toDate(), 'h:mm a') : ''}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {sim.userId === 'anonymous' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                        Anonymous
                      </span>
                    ) : (
                      <span className="font-medium text-slate-800 text-sm">
                        Registered User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className="capitalize font-bold text-sm text-[#6279b8]">
                      {sim.evaluatorType || 'Standard'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn("inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold tracking-wide", 
                      (sim.convictionScore || 0) >= 70 ? "bg-green-100 text-green-700" : 
                      (sim.convictionScore || 0) >= 40 ? "bg-yellow-100 text-yellow-700" : 
                      "bg-red-100 text-red-700"
                    )}>
                      {sim.convictionScore || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-medium text-slate-600">
                      {sim.feedback?.length || 0} suggestion{(sim.feedback?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </td>
                </tr>
              ))}
              {simulations.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <BarChart3 className="text-slate-300 mx-auto" size={48} />
                      <p className="text-slate-500 font-medium">No simulation data available yet.</p>
                      <p className="text-slate-400 text-sm">Simulations will appear here once users start testing.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
