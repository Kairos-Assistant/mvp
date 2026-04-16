import { CompanyProfile, SimulationSession } from "../types";
import { v4 as uuidv4 } from "uuid";

const KEYS = {
  PROFILES: "kairos_profiles",
  SESSIONS: "kairos_sessions",
  CURRENT_PROFILE_ID: "kairos_current_profile_id",
  USER_EMAIL: "kairos_user_email",
};

export const StorageService = {
  getProfiles: (): CompanyProfile[] => {
    const data = localStorage.getItem(KEYS.PROFILES);
    return data ? JSON.parse(data) : [];
  },

  saveProfile: (profile: CompanyProfile) => {
    const profiles = StorageService.getProfiles();
    const index = profiles.findIndex((p) => p.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
  },

  deleteProfile: (id: string) => {
    const profiles = StorageService.getProfiles().filter((p) => p.id !== id);
    localStorage.setItem(KEYS.PROFILES, JSON.stringify(profiles));
    
    // Also delete sessions for this profile
    const sessions = StorageService.getSessions().filter((s) => s.companyProfileId !== id);
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getSessions: (): SimulationSession[] => {
    const data = localStorage.getItem(KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  saveSession: (session: SimulationSession) => {
    const sessions = StorageService.getSessions();
    sessions.push(session);
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  getCurrentProfileId: (): string | null => {
    return localStorage.getItem(KEYS.CURRENT_PROFILE_ID);
  },

  setCurrentProfileId: (id: string | null) => {
    if (id) {
      localStorage.setItem(KEYS.CURRENT_PROFILE_ID, id);
    } else {
      localStorage.removeItem(KEYS.CURRENT_PROFILE_ID);
    }
  },

  getUserEmail: (): string | null => {
    return localStorage.getItem(KEYS.USER_EMAIL);
  },

  setUserEmail: (email: string) => {
    localStorage.setItem(KEYS.USER_EMAIL, email);
  },

  clearAll: () => {
    localStorage.clear();
  },
};
