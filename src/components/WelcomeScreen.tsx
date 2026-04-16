import React, { useState } from "react";
import { CompanyProfile } from "../types";
import { StorageService } from "../services/storageService";
import { Plus, ChevronRight, Briefcase, Trash2, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WelcomeScreenProps {
  profiles: CompanyProfile[];
  onSelect: (profile: CompanyProfile) => void;
  onNew: () => void;
}

export default function WelcomeScreen({ profiles, onSelect, onNew }: WelcomeScreenProps) {
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setProfileToDelete(id);
  };

  const confirmDelete = () => {
    if (profileToDelete) {
      StorageService.deleteProfile(profileToDelete);
      setProfileToDelete(null);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-24">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-[#6279b8]"
        >
          KAIROS
        </motion.h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
          The investor-readiness simulator for founders. <br />
          Identify your blind spots and articulate your vision before you seek funding.
        </p>
      </div>

      <div className="grid gap-6">
        {profiles.length > 0 && (
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Continue with</h2>
            <div className="grid gap-3">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => onSelect(profile)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSelect(profile); }}
                  className="flex items-center justify-between p-6 bg-white/40 backdrop-blur-sm border border-black/5 rounded-xl hover:border-[#6279b8] transition-all group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/40 flex items-center justify-center text-[#6279b8]">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{profile.name}</h3>
                      <p className="text-sm text-slate-600 line-clamp-1">{profile.oneLiner}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => handleDelete(e, profile.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors z-10"
                      aria-label="Delete profile"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight className="text-slate-400 group-hover:text-[#6279b8] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onNew}
          className="flex items-center justify-center gap-3 p-8 border-2 border-dashed border-black/10 rounded-xl hover:border-[#6279b8] hover:bg-white/20 transition-all text-slate-500 hover:text-[#6279b8]"
        >
          <Plus size={24} />
          <span className="font-bold text-lg">Start with a new company</span>
        </button>
      </div>

      <div className="mt-24 text-center text-sm text-slate-500 font-medium">
        <p>No account required for this MVP. All data is stored locally on your device.</p>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {profileToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProfileToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Delete Profile?</h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  This will permanently delete this profile and all its session history. This action cannot be undone.
                </p>
                
                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={confirmDelete}
                    className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Yes, Delete Everything
                  </button>
                  <button
                    onClick={() => setProfileToDelete(null)}
                    className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
