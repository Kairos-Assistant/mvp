import { LayoutDashboard, Play, History, Briefcase, Settings, Moon, Sun, LogOut, X, Shield } from "lucide-react";
import { CompanyProfile } from "../types";
import { cn } from "../lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: string;
  onNavigate: (screen: any) => void;
  currentProfile: CompanyProfile | null;
  onProfileSwitch: () => void;
  onOpenSettings: () => void;
  onLogoClick: () => void;
  isAdmin?: boolean;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  currentScreen, 
  onNavigate, 
  currentProfile, 
  onProfileSwitch,
  onOpenSettings,
  onLogoClick,
  isAdmin = false
}: SidebarProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "setup", label: "Simulate", icon: Play },
    { id: "history", label: "History", icon: History },
    { id: "profile", label: "Company Profile", icon: Briefcase },
  ];

  if (!currentProfile && currentScreen !== "welcome") return null;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-[#E3DBD5] border-r border-black/5 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-12">
            <button 
              onClick={onLogoClick}
              className="font-display font-bold text-2xl tracking-tighter text-[#6279b8] hover:opacity-80 transition-opacity"
            >
              KAIROS
            </button>
            <button onClick={onClose} className="md:hidden p-2">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {currentProfile && navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                  currentScreen === item.id || (item.id === 'setup' && currentScreen === 'simulation')
                    ? "bg-[#6279b8] text-white shadow-lg shadow-[#6279b8]/20"
                    : "text-slate-600 hover:bg-black/5"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-black/5 space-y-4">
            {currentProfile && (
              <div className="bg-black/5 p-4 rounded-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Active Company</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm truncate mr-2">{currentProfile.name}</span>
                  <button 
                    onClick={onProfileSwitch}
                    className="p-1.5 text-slate-500 hover:text-[#6279b8] transition-colors"
                    title="Switch Company"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-2">
              <button 
                onClick={onOpenSettings}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
