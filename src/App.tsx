/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { CompanyProfile, SimulationSession, FocusMode, EvaluatorType, Difficulty, RoundLength } from "./types";
import { StorageService } from "./services/storageService";
import WelcomeScreen from "./components/WelcomeScreen";
import ProfileForm from "./components/ProfileForm";
import SimulationSetup from "./components/SimulationSetup";
import SimulationScreen from "./components/SimulationScreen";
import ResultsScreen from "./components/ResultsScreen";
import Dashboard from "./components/Dashboard";
import History from "./components/History";
import Sidebar from "./components/Sidebar";
import BetaBanner from "./components/BetaBanner";
import LandingPage from "./components/LandingPage";
import AdminDashboard from "./components/AdminDashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X, Settings, RotateCcw, LogIn, LogOut, User as UserIcon, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "./lib/utils";
import { auth, loginWithGoogle, logout, testConnection, saveSimulation } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

type Screen = "landing" | "welcome" | "profile" | "setup" | "simulation" | "results" | "dashboard" | "history" | "admin";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing");
  const [profiles, setProfiles] = useState<CompanyProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<CompanyProfile | null>(null);
  const [currentSession, setCurrentSession] = useState<SimulationSession | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBetaBanner, setShowBetaBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Test connection on boot
    testConnection();

    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      // @ts-ignore
      const rawAdminEmails = import.meta.env?.ADMIN_EMAILS;
      const adminEmails = rawAdminEmails.split(',').map((e: string) => e.trim());
      
      // Check if admin
      if (currentUser?.email && adminEmails.includes(currentUser.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    const loadedProfiles = StorageService.getProfiles();
    setProfiles(loadedProfiles);
    
    const currentId = StorageService.getCurrentProfileId();
    if (window.location.pathname === "/admin" || window.location.pathname === "/admin/") {
      setCurrentScreen("admin");
      if (currentId) {
        const profile = loadedProfiles.find(p => p.id === currentId);
        if (profile) setCurrentProfile(profile);
      }
    } else if (currentId) {
      const profile = loadedProfiles.find(p => p.id === currentId);
      if (profile) {
        setCurrentProfile(profile);
        // Always start at landing page as requested
        setCurrentScreen("landing");
      }
    }

    return () => unsubscribe();
  }, []);

  const handleResetAll = () => {
    StorageService.clearAll();
    window.location.reload();
  };

  const handleProfileSelect = (profile: CompanyProfile) => {
    setCurrentProfile(profile);
    StorageService.setCurrentProfileId(profile.id);
    setCurrentScreen("dashboard");
  };

  const handleNewProfile = () => {
    setCurrentProfile(null);
    setCurrentScreen("profile");
  };

  const handleProfileSave = (profile: CompanyProfile) => {
    StorageService.saveProfile(profile);
    setProfiles(StorageService.getProfiles());
    setCurrentProfile(profile);
    StorageService.setCurrentProfileId(profile.id);
    setCurrentScreen("dashboard");
  };

  const [simConfig, setSimConfig] = useState<{
    evaluator: EvaluatorType;
    focus: FocusMode;
    difficulty: Difficulty;
    roundLength: RoundLength;
  } | null>(null);

  const handleStartSimulation = (config: {
    evaluator: EvaluatorType;
    focus: FocusMode;
    difficulty: Difficulty;
    roundLength: RoundLength;
  }) => {
    setSimConfig(config);
    setCurrentScreen("simulation");
  };

  const handleSimulationEnd = (session: SimulationSession) => {
    StorageService.saveSession(session);
    setCurrentSession(session);
    setCurrentScreen("results");
    
    // Save to Firebase (even if not logged in)
    saveSimulation(user?.uid || null, {
      id: session.id,
      convictionScore: session.scores.convictionScore,
      feedback: session.scores.fixNext.map(f => f.item),
      transcript: session.transcript,
      evaluatorType: session.evaluatorType,
      roundLength: session.roundLength
    });

    // Show beta banner after first simulation
    const sessions = StorageService.getSessions();
    if (sessions.length === 1 && !StorageService.getUserEmail()) {
      setShowBetaBanner(true);
    }
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    setIsSidebarOpen(false);
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowSettings(false);
      setCurrentScreen("landing");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen text-slate-900 transition-colors duration-300">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-black/5 bg-[#E3DBD5]">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2">
              <Menu size={24} />
            </button>
            <button 
              onClick={() => setCurrentScreen("landing")}
              className="font-display font-bold text-xl tracking-tight text-[#6279b8] hover:opacity-80 transition-opacity"
            >
              KAIROS
            </button>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500">
            <Settings size={20} />
          </button>
        </header>

        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            currentScreen={currentScreen}
            onNavigate={navigateTo}
            currentProfile={currentProfile}
            onProfileSwitch={() => setCurrentScreen("welcome")}
            onOpenSettings={() => setShowSettings(true)}
            onLogoClick={() => setCurrentScreen("landing")}
            isAdmin={isAdmin}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScreen}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {currentScreen === "landing" && (
                  <LandingPage onStart={() => setCurrentScreen("welcome")} />
                )}
                {currentScreen === "welcome" && (
                  <WelcomeScreen 
                    profiles={profiles} 
                    onSelect={handleProfileSelect} 
                    onNew={handleNewProfile} 
                  />
                )}
                {currentScreen === "profile" && (
                  <ProfileForm 
                    profile={currentProfile} 
                    onSave={handleProfileSave} 
                    onCancel={() => setCurrentScreen(currentProfile ? "dashboard" : "welcome")} 
                  />
                )}
                {currentScreen === "dashboard" && currentProfile && (
                  <Dashboard 
                    profile={currentProfile} 
                    onStartSim={() => setCurrentScreen("setup")} 
                  />
                )}
                {currentScreen === "setup" && currentProfile && (
                  <SimulationSetup 
                    profile={currentProfile} 
                    onStart={handleStartSimulation} 
                    onCancel={() => setCurrentScreen("dashboard")}
                  />
                )}
                {currentScreen === "simulation" && currentProfile && simConfig && (
                  <SimulationScreen 
                    profile={currentProfile} 
                    config={simConfig}
                    onEnd={handleSimulationEnd}
                    onCancel={() => setCurrentScreen("dashboard")}
                  />
                )}
                {currentScreen === "results" && currentSession && (
                  <ResultsScreen 
                    session={currentSession} 
                    onDone={() => setCurrentScreen("dashboard")} 
                  />
                )}
                {currentScreen === "history" && currentProfile && (
                  <History 
                    profile={currentProfile} 
                    onViewSession={(session) => {
                      setCurrentSession(session);
                      setCurrentScreen("results");
                    }}
                  />
                )}
                {currentScreen === "admin" && (
                  <AdminDashboard />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Beta Banner */}
            <AnimatePresence>
              {showBetaBanner && (
                <BetaBanner onClose={() => setShowBetaBanner(false)} />
              )}
            </AnimatePresence>

            {/* Settings Modal */}
            <AnimatePresence>
              {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSettings(false)}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[#E3DBD5] rounded-[32px] p-8 shadow-2xl border border-black/5"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800">Settings</h2>
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="p-2 text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Auth Section */}
                      <div className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-black/5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Account</h3>
                        {isAuthLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-6 h-6 border-2 border-[#6279b8] border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : user ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt={user.displayName || ""} className="w-10 h-10 rounded-full border border-black/5" />
                              ) : (
                                <div className="w-10 h-10 bg-[#6279b8]/10 rounded-full flex items-center justify-center text-[#6279b8]">
                                  <UserIcon size={20} />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-800 truncate">{user.displayName || "User"}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                              </div>
                              {isAdmin && (
                                <div className="p-1.5 bg-[#6279b8]/10 text-[#6279b8] rounded-lg" title="Admin">
                                  <ShieldCheck size={16} />
                                </div>
                              )}
                            </div>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center justify-center gap-2 p-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
                            >
                              <LogOut size={18} />
                              Sign Out
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleLogin}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-[#6279b8] text-white rounded-xl hover:bg-[#5268a7] transition-all font-bold text-sm shadow-lg shadow-[#6279b8]/20"
                          >
                            <LogIn size={18} />
                            Sign in with Google
                          </button>
                        )}
                      </div>

                      {/* Admin Section */}
                      {isAdmin && (
                        <div className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-black/5">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Administration</h3>
                          <button
                            onClick={() => {
                              setCurrentScreen("admin");
                              setShowSettings(false);
                            }}
                            className="w-full flex items-center justify-between p-4 bg-white/60 text-slate-700 rounded-xl hover:bg-white/80 transition-all font-bold text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <ShieldCheck size={18} className="text-[#6279b8]" />
                              <span>View Registrations</span>
                            </div>
                          </button>
                        </div>
                      )}

                      <div className="bg-white/40 backdrop-blur-sm p-6 rounded-2xl border border-black/5">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Danger Zone</h3>
                        <button
                          onClick={() => setShowResetConfirm(true)}
                          className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" />
                            <div className="text-left">
                              <p className="font-bold text-sm">Reset Everything</p>
                              <p className="text-[10px] opacity-70">Delete all profiles and history</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-black/5 text-center">
                      <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Kairos v1.0.0 • 2026</p>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Custom Reset Confirmation Modal */}
            <AnimatePresence>
              {showResetConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowResetConfirm(false)}
                    className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl text-center"
                  >
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Are you sure?</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                      This will permanently delete all your company profiles and simulation history. This action cannot be undone.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleResetAll}
                        className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                      >
                        Yes, Reset Everything
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
