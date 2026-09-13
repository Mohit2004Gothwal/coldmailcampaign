import React, { useState } from 'react';
import { X, ShieldCheck, Mail, CheckCircle2, User, Key, ArrowRight, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  onLogin: (email: string, displayName?: string) => void;
  theme?: 'dark' | 'light';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  onLogin,
  theme = 'dark',
}) => {
  const [customEmail, setCustomEmail] = useState('');
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleGoogleSignIn = (email: string, name: string) => {
    onLogin(email, name);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmail && customEmail.includes('@')) {
      onLogin(customEmail, customEmail.split('@')[0]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#0b1329] border-slate-700/80 text-slate-200'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800' : 'border-slate-100 bg-slate-50/50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-sm shadow-md">
              CM
            </div>
            <div>
              <h3 className="text-base font-bold">Account Authentication</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Sign in to authorize your Gmail dispatcher & save sent history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Quick 1-Click Login Options */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-2.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Choose Account
            </label>
            <div className="space-y-2.5">
              {/* College Account from screenshot */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn('iit2022032@iiitl.ac.in', 'Mohit Kumar (IIITL)')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/70 hover:border-blue-500/50'
                    : 'bg-slate-50 hover:bg-blue-50/60 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                    I
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold group-hover:text-blue-600 transition-colors">
                      iit2022032@iiitl.ac.in
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Indian Institute of Information Technology
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-500 group-hover:translate-x-0.5 transition-transform flex items-center">
                  Select <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </button>

              {/* Personal Google Account */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn('gothwalmohit03@gmail.com', 'Mohit Kumar')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/70 hover:border-blue-500/50'
                    : 'bg-slate-50 hover:bg-blue-50/60 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center font-bold text-xs border border-red-500/30">
                    G
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold group-hover:text-blue-600 transition-colors">
                      gothwalmohit03@gmail.com
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Google / Gmail Account
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-500 group-hover:translate-x-0.5 transition-transform flex items-center">
                  Select <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
            <span className={`flex-shrink mx-3 text-[11px] uppercase tracking-widest font-semibold ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Or Custom Sender Email
            </span>
            <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="name@university.edu or name@company.com"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  isDark
                    ? 'bg-slate-900 border border-slate-700 text-white focus:border-blue-500'
                    : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
            >
              Sign In with this Email
            </button>
          </form>

          {/* Note */}
          <div
            className={`p-3 rounded-xl border flex items-start space-x-2.5 text-xs ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Authentication secures your campaign logs, prevents duplicate recipients across runs, and links to your authorized Gmail send-only credentials.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
