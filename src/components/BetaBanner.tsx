import React, { useState } from "react";
import { X, Mail, Check } from "lucide-react";
import { motion } from "motion/react";
import { StorageService } from "../services/storageService";

interface BetaBannerProps {
  onClose: () => void;
}

export default function BetaBanner({ onClose }: BetaBannerProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      StorageService.setUserEmail(email);
      setSubmitted(true);
      // In a real app, we'd send this to a backend or the Google Form
      // For this MVP, we just store it locally as requested.
    }
  };

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white/60 backdrop-blur-md border border-black/5 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg mb-1 text-slate-800">Join the beta</h3>
            <p className="text-sm text-slate-600 font-medium">
              You're one of the first to try Kairos. Drop your email and we'll let you know when new features land.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="flex items-center gap-3 p-4 bg-green-50/50 text-green-600 rounded-xl font-bold border border-green-100">
            <Check size={20} />
            <span>Thanks! We'll be in touch.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                required
                type="email"
                placeholder="founder@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/40 border border-black/5 rounded-xl outline-none focus:ring-2 focus:ring-[#6279b8] transition-all text-sm font-medium"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-[#6279b8] text-white font-bold rounded-xl hover:bg-[#5266a0] transition-all shadow-lg shadow-[#6279b8]/20"
            >
              Keep me updated
            </button>
          </form>
        )}
      </div>
      
      {/* Google Form Iframe (Hidden but present as requested) */}
      <iframe 
        src="https://forms.gle/CneHcBWG5H9iyLji8" 
        className="hidden"
        title="Beta Signup"
      />
    </motion.div>
  );
}
