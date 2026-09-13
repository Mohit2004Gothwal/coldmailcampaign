import React from 'react';
import { Mail, CheckCircle2, User, LogOut, LogIn, Sparkles, Sun, Moon, Layers, Flame } from 'lucide-react';

export type BulkTab = 'workflow' | 'sent' | 'pending';

interface BulkMailerHeaderProps {
  activeTab: BulkTab;
  onSelectTab: (tab: BulkTab) => void;
  userEmail: string;
  isLoggedIn: boolean;
  sentCount: number;
  pendingCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  firebaseConnected?: boolean;
  isFirebaseUser?: boolean;
  onOpenFirebaseConfig?: () => void;
  onOpenSettings?: () => void;
  isLiveDelivery?: boolean;
  isSmtpConfigured?: boolean;
}

export const BulkMailerHeader: React.FC<BulkMailerHeaderProps> = ({
  activeTab,
  onSelectTab,
  userEmail,
  isLoggedIn,
  sentCount,
  pendingCount,
  theme,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  firebaseConnected = true,
  isFirebaseUser = false,
  onOpenFirebaseConfig,
  onOpenSettings,
  isLiveDelivery = false,
  isSmtpConfigured = false,
}) => {
  const initial = (userEmail?.[0] || 'I').toUpperCase();
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-colors border-b ${
        isDark
          ? 'bg-[#070b16]/95 border-slate-800/80 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Previous Title: Cold Mail Campaign Automator + Navigation */}
        <div className="flex items-center space-x-6 sm:space-x-8">
          {/* Brand Logo & Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onSelectTab('workflow')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-sm shadow-md shadow-blue-500/20 tracking-tight shrink-0 group-hover:scale-105 transition-transform">
              CM
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight">
                  Cold Mail Campaign Automator
                </span>
                <span
                  className={`hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isDark
                      ? 'bg-blue-950/70 text-blue-300 border border-blue-800/60'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  Stepwise Engine
                </span>
                {/* Firebase Status Badge */}
                <button
                  type="button"
                  onClick={onOpenFirebaseConfig || onOpenAuth}
                  title="Firestore Database Settings (coldmail-compagin-v1) - Click to manage project and rules"
                  className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer transition-colors ${
                    isFirebaseUser
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                >
                  <Flame className={`w-3 h-3 ${isFirebaseUser ? 'fill-emerald-400 text-emerald-400' : 'fill-amber-400 text-amber-400'}`} />
                  <span>coldmail-compagin-v1</span>
                </button>
              </div>
              <p
                className={`text-[11px] font-medium tracking-tight ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                send smarter • avoid duplicates • multi-step outreach
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onSelectTab('workflow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'workflow'
                  ? isDark
                    ? 'bg-slate-800/90 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Stepwise Workflow</span>
            </button>

            <button
              onClick={() => onSelectTab('sent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'sent'
                  ? isDark
                    ? 'bg-slate-800/90 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Sent Mails</span>
              {sentCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isDark
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {sentCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'pending'
                  ? isDark
                    ? 'bg-slate-800/90 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>Pending Mails</span>
              {pendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isDark
                      ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right: Dark/Light Mode Toggle + Authentication */}
        <div className="flex items-center space-x-2.5">
          {/* Firestore Database Settings Button */}
          {onOpenFirebaseConfig && (
            <button
              type="button"
              onClick={onOpenFirebaseConfig}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700/80 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-amber-700 border-slate-300 shadow-xs'
              }`}
              title="Firestore Project & Database Settings (coldmail-compagin-v1)"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="hidden sm:inline">Database</span>
            </button>
          )}

          {/* Theme Toggle Button (Dark / Light) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border transition-all ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700/80 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-xs'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Authentication Section */}
          {isLoggedIn ? (
            <div className="flex items-center space-x-2.5">
              <div
                onClick={onOpenAuth}
                className="hidden sm:flex flex-col items-end cursor-pointer group"
                title="Click to view authentication status or switch account"
              >
                <span
                  className={`text-xs font-semibold group-hover:text-blue-500 transition-colors ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  {userEmail}
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  authenticated
                </span>
              </div>

              {/* Circle Avatar with Initial */}
              <button
                onClick={onOpenAuth}
                title="Account Settings & Gmail OAuth"
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-sm border border-blue-400/40 hover:scale-105 transition-transform"
              >
                {initial}
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-900'
                }`}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
