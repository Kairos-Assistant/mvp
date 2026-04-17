import React, { useState } from "react";
import { CompanyProfile, Stage } from "../types";
import { v4 as uuidv4 } from "uuid";
import { Save, X, Info, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { saveRegistration } from "../lib/firebase";

interface ProfileFormProps {
  profile: CompanyProfile | null;
  onSave: (profile: CompanyProfile) => void;
  onCancel: () => void;
}

export default function ProfileForm({ profile, onSave, onCancel }: ProfileFormProps) {
  const [formData, setFormData] = useState<Partial<CompanyProfile>>(
    profile || {
      id: uuidv4(),
      name: "",
      email: "",
      oneLiner: "",
      targetSegment: "",
      businessModel: "",
      stage: "idea",
      tractionNotes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  const [saved, setSaved] = useState(false);

  const submitToGoogleForm = async (email: string) => {
    if (!email) return;
    
    // Fallback to Firestore
    try {
      await saveRegistration(email);
    } catch (e) {
      console.error("Firestore save failed:", e);
    }
    
    // The Google Form URL provided: https://forms.gle/5kAHuXj8EUooQigF8
    // Full submission URL derived from the form:
    const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScTmmQkcvpjcP_eFD4F4o8d4-IlTGm3glyw_2OC21Hxqwl4ng/formResponse";
    
    // IMPORTANT: You need the correct entry ID for the "Email" field.
    // To find it: 
    // 1. Open your form in a browser.
    // 2. Right-click the "Email" input and select "Inspect".
    // 3. Look for the "name" attribute, it will look like "entry.123456789".
    const ENTRY_ID = "entry.1045781291"; // Update this with your actual entry ID
    
    const formData = new FormData();
    formData.append(ENTRY_ID, email);
    
    try {
      await fetch(FORM_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });
      console.log("Email submitted to Google Form");
    } catch (error) {
      console.error("Error submitting to Google Form:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullProfile = {
      ...formData,
      updatedAt: new Date().toISOString(),
    } as CompanyProfile;
    
    onSave(fullProfile);
    if (formData.email) {
      submitToGoogleForm(formData.email);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {profile ? "Edit Company Profile" : "Create Company Profile"}
          </h1>
          <p className="text-slate-600 font-medium">
            No need to create an account for this MVP. <span className="text-slate-500 font-normal">(Future versions will require one)</span>
          </p>
        </div>
        <button 
          onClick={onCancel}
          className="p-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Email Address
            </label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. founder@kairos.ai"
              className="w-full p-4 bg-white/40 border border-black/5 rounded-lg focus:ring-2 focus:ring-[#6279b8] outline-none transition-all"
            />
            <p className="text-xs text-slate-500">
              We'll use this to save your progress and send you updates.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Company Name
            </label>
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Kairos"
              className="w-full p-4 bg-white/40 border border-black/5 rounded-lg focus:ring-2 focus:ring-[#6279b8] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
                One-Liner
              </label>
              <div className="group relative">
                <Info size={16} className="text-slate-400 cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  What you do + who for + why it matters.
                </div>
              </div>
            </div>
            <textarea
              required
              name="oneLiner"
              value={formData.oneLiner}
              onChange={handleChange}
              placeholder="e.g. We build AI-powered simulators for founders to stress-test their business logic."
              rows={3}
              className="w-full p-4 bg-white/40 border border-black/5 rounded-lg focus:ring-2 focus:ring-[#6279b8] outline-none transition-all resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Target Customer Segment
              </label>
              <input
                required
                name="targetSegment"
                value={formData.targetSegment}
                onChange={handleChange}
                placeholder="e.g. Early-stage tech founders"
                className="w-full p-4 bg-white/40 border border-black/5 rounded-lg focus:ring-2 focus:ring-[#6279b8] outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Stage
              </label>
              <select
                required
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="w-full p-4 bg-white/40 border border-black/5 rounded-lg focus:ring-2 focus:ring-[#6279b8] outline-none transition-all appearance-none"
              >
                <option value="idea">Idea</option>
                <option value="MVP">MVP</option>
                <option value="traction">Traction</option>
                <option value="revenue">Revenue</option>
                <option value="scale">Scale</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Business Model
            </label>
            <input
              required
              name="businessModel"
              value={formData.businessModel}
              onChange={handleChange}
              placeholder="e.g. B2B SaaS subscription"
              className="w-full p-4 bg-white/40 border border-black/5 rounded-lg focus:ring-2 focus:ring-[#6279b8] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Traction Snapshot
            </label>
            <textarea
              required
              name="tractionNotes"
              value={formData.tractionNotes}
              onChange={handleChange}
              placeholder="e.g. 500 waitlist signups, 10 LOIs from accelerators."
              rows={4}
              className="w-full p-4 bg-white/40 border border-black/5 rounded-lg focus:ring-2 focus:ring-[#6279b8] outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-6">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 p-4 bg-[#6279b8] text-white font-bold rounded-lg hover:bg-[#5266a0] transition-all shadow-lg shadow-[#6279b8]/20"
          >
            {saved ? <Check size={20} /> : <Save size={20} />}
            <span>{saved ? "Saved" : "Save Profile"}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-8 p-4 border border-black/10 font-bold rounded-lg hover:bg-black/5 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
