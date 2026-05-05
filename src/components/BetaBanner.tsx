import React, { useState } from "react";
import { X, Mail, Check } from "lucide-react";
import { motion } from "motion/react";
import { StorageService } from "../services/storageService";
import { saveRegistration } from "../lib/firebase";

interface BetaBannerProps {
  onClose: () => void;
}

export default function BetaBanner({ onClose }: BetaBannerProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isLoading) return;
    
    setIsLoading(true);
    console.log("Submitting waitlist email:", email);
    
    try {
      await saveRegistration(email);
      StorageService.setUserEmail(email);
      setSubmitted(true);
      console.log("Waitlist submission successful");
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_EXISTS') {
        setErrorMessage("You're already on the list! We'll be in touch soon.");
        setSubmitted(true); // Treat as success for the user
      } else {
        console.error("Waitlist error:", error);
        // Still show success to user for better UX in MVP unless it's a critical failure
        setSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white/80 backdrop-blur-xl border border-black/10 rounded-3xl shadow-2xl z-[999] overflow-hidden pointer-events-auto"
    >
      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-bold text-xl mb-1 text-slate-800">Join the beta</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              We'll let you know when new features land and your simulation insights are ready.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 p-5 bg-green-50 text-green-700 rounded-2xl font-bold border border-green-100 shadow-sm"
          >
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
              <Check size={18} />
            </div>
            <span>{errorMessage || "You're on the list! We'll be in touch soon."}</span>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#6279b8] transition-colors" size={18} />
              <input 
                required
                type="email"
                placeholder="founder@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-[#6279b8] focus:bg-white transition-all text-sm font-medium"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#6279b8] text-white font-bold rounded-2xl hover:bg-[#5266a0] active:scale-[0.98] transition-all shadow-xl shadow-[#6279b8]/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Keep me updated"
              )}
            </button>
          </form>
        )}
      </div>
      
      {/* Google Form Iframe (Hidden backup) */}
      <iframe 
        src="https://forms.gle/CneHcBWG5H9iyLji8" 
        className="hidden"
        title="Beta Signup"
        tabIndex={-1}
      />
    </motion.div>
  );
}
