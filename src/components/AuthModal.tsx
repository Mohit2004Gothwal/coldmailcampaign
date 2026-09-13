import React, { useState } from 'react';
import { X, ShieldCheck, Mail, CheckCircle2, User, Key, ArrowRight, Sparkles, Flame, Loader2, Info } from 'lucide-react';
import {
  auth,
  signInWithGoogleSafe,
  signInWithPresetOrEmail,
  syncUserProfile,
} from '../firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  onLogin: (email: string, displayName?: string, uid?: string) => void;
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
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  // Real Google Sign-in with Firebase Auth (gracefully handles popup closures & iframe restrictions)
  const handleFirebaseGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const result = await signInWithGoogleSafe();
      if (result.user) {
        await syncUserProfile(result.user);
        onLogin(
          result.user.email || 'user@example.com',
          result.user.displayName || undefined,
          result.user.uid
        );
        onClose();
      } else if (result.isPopupCancelled) {
        setAuthNotice(
          'Sign-in popup was dismissed. You can try again or use the 1-click verified accounts below.'
        );
      } else if (result.error) {
        setAuthError(result.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.info('Google sign-in status:', msg);
      setAuthNotice('Popup was closed. You can select a test account below.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // Instant test with real college account or preset with Firestore Auth session
  const handlePresetSelect = async (email: string, name: string) => {
    setAuthError(null);
    setAuthNotice(null);
    const { uid } = await signInWithPresetOrEmail(email, name);
    onLogin(email, name, uid);
    onClose();
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmail && customEmail.includes('@')) {
      const trimmed = customEmail.trim();
      setAuthError(null);
      setAuthNotice(null);
      const displayName = trimmed.split('@')[0];
      const { uid } = await signInWithPresetOrEmail(trimmed, displayName);
      onLogin(trimmed, displayName, uid);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 flex items-center justify-center text-white shadow-md">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">Firebase Authentication</h3>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Firestore Active
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Project: spheric-scene-3n96h
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
          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
              <span>{authError}</span>
              <button onClick={() => setAuthError(null)} className="text-rose-400 font-bold ml-2">✕</button>
            </div>
          )}

          {authNotice && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{authNotice}</span>
              </div>
              <button onClick={() => setAuthNotice(null)} className="text-amber-400 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Real Google Sign-in with Firebase */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Sign In via Firebase Auth
            </label>
            <button
              type="button"
              disabled={isLoadingGoogle}
              onClick={handleFirebaseGoogleSignIn}
              className="w-full flex items-center justify-center space-x-2.5 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {isLoadingGoogle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Sign In with Google Account</span>
                </>
              )}
            </button>
          </div>

          {/* Verified Preset Accounts for Direct Testing */}
          <div>
            <label
              className={`block text-[11px] font-bold uppercase tracking-wider mb-2 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Test with Real Email Accounts
            </label>
            <div className="space-y-2">
              {/* College Account specifically highlighted */}
              <button
                type="button"
                onClick={() => handlePresetSelect('iit2022032@iiitl.ac.in', 'Mohit Kumar (IIITL)')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                  currentUserEmail === 'iit2022032@iiitl.ac.in'
                    ? 'border-blue-500 bg-blue-500/10'
                    : isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/70 hover:border-blue-500/50'
                    : 'bg-slate-50 hover:bg-blue-50/60 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                    I
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-1.5">
                      <p className="text-xs font-bold text-blue-400">
                        iit2022032@iiitl.ac.in
                      </p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        Real College ID
                      </span>
                    </div>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Indian Institute of Information Technology Lucknow
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-500 group-hover:translate-x-0.5 transition-transform flex items-center">
                  Test <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </button>

              {/* Personal Gmail Account */}
              <button
                type="button"
                onClick={() => handlePresetSelect('gothwalmohit03@gmail.com', 'Mohit Kumar')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                  currentUserEmail === 'gothwalmohit03@gmail.com'
                    ? 'border-blue-500 bg-blue-500/10'
                    : isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/70 hover:border-blue-500/50'
                    : 'bg-slate-50 hover:bg-blue-50/60 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center font-bold text-xs border border-red-500/30">
                    G
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      gothwalmohit03@gmail.com
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Personal Google Account
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
              Or Enter Any Real Email
            </span>
            <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-2.5">
            <input
              type="email"
              required
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="e.g. iit2022032@iiitl.ac.in"
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                isDark
                  ? 'bg-slate-900 border border-slate-700 text-white focus:border-blue-500'
                  : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all"
            >
              Sign In & Sync to Firebase
            </button>
          </form>

          {/* Firebase Persistence Status Note */}
          <div
            className={`p-3 rounded-xl border flex items-start space-x-2.5 text-xs ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Firebase Cloud Persistence Active:</span>{' '}
              Sent records, sequence templates, and recipient queues are stored securely in Google Cloud Firestore in region <code className="text-amber-400">asia-southeast1</code>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

