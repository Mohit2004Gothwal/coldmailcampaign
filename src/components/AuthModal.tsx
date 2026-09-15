import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowRight,
  Flame,
  Loader2,
  Info,
  KeyRound,
  CheckCircle2,
  Database,
  HelpCircle,
} from 'lucide-react';
import {
  auth,
  signInWithGoogleSafe,
  signInWithEmailPassword,
  sendPasswordReset,
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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Forgot password flow state
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Storage explanation toggle
  const [showStorageDetails, setShowStorageDetails] = useState(false);

  const isDark = theme === 'dark';

  if (!isOpen) return null;

  // Real Google Sign-in with Firebase Auth
  const handleFirebaseGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const result = await signInWithGoogleSafe();
      if (result.user) {
        await syncUserProfile(result.user);
        onLogin(
          result.user.email || 'emailid@example.com',
          result.user.displayName || undefined,
          result.user.uid
        );
        onClose();
      } else if (result.isPopupCancelled) {
        setAuthNotice('Sign-in popup was dismissed. You can sign in using email and password below.');
      } else if (result.error) {
        setAuthError(result.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.info('Google sign-in status:', msg);
      setAuthNotice('Sign-in with Google was dismissed. Please log in with your email/username and password below.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  // Sign in / Sign up with Email or Username & Password
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setAuthError('Please enter your email or username.');
      return;
    }
    if (!password) {
      setAuthError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const result = await signInWithEmailPassword(identifier.trim(), password);
      if (result.error) {
        setAuthError(result.error);
      } else {
        const effectiveEmail = identifier.includes('@')
          ? identifier.trim()
          : `${identifier.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')}@example.com`;
        const displayName = identifier.trim().split('@')[0];
        onLogin(effectiveEmail, displayName, result.uid);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed.';
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Forgot password submit handler
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setAuthError('Please enter your registered email or username to reset your password.');
      return;
    }

    setIsResetting(true);
    setAuthError(null);
    try {
      const result = await sendPasswordReset(resetEmail.trim());
      setResetSuccessMessage(result.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not process password reset.';
      setAuthError(msg);
    } finally {
      setIsResetting(false);
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
                <h3 className="text-base font-bold">
                  {isForgotPasswordMode ? 'Reset Password' : 'User Authentication'}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
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
        <div className="p-6 space-y-4">
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

          {/* FORGOT PASSWORD VIEW */}
          {isForgotPasswordMode ? (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Enter your registered email address or username below. We will send password reset instructions and create a secure temporary access key.
              </div>

              {resetSuccessMessage ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>{resetSuccessMessage}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(false);
                      setResetSuccessMessage(null);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Email or Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="emailid@example.com or username"
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                          isDark
                            ? 'bg-slate-900 border border-slate-700 text-white focus:border-blue-500'
                            : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordMode(false)}
                      className={`w-1/2 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                        isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Back to Sign In
                    </button>
                    <button
                      type="submit"
                      disabled={isResetting}
                      className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                    >
                      {isResetting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Reset Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* STANDARD LOGIN VIEW */
            <>
              {/* Google Sign-in */}
              <div>
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

              <div className="relative flex py-1 items-center">
                <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
                <span className={`flex-shrink mx-3 text-[10px] uppercase tracking-widest font-semibold ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Or Sign In with Email / Username & Password
                </span>
                <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}></div>
              </div>

              {/* Email / Username & Password Form */}
              <form onSubmit={handleSubmitLogin} className="space-y-3">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Email ID or Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="emailid@example.com or username"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                        isDark
                          ? 'bg-slate-900 border border-slate-700 text-white focus:border-blue-500'
                          : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-[11px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(true);
                        setResetEmail(identifier);
                        setAuthError(null);
                      }}
                      className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                        isDark
                          ? 'bg-slate-900 border border-slate-700 text-white focus:border-blue-500'
                          : 'bg-slate-50 border border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In & Sync to Firebase</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Database Storage Explanation Card */}
          <div
            className={`p-3 rounded-xl border text-xs transition-all ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowStorageDetails(!showStorageDetails)}>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-300">Where are accounts & passwords stored?</span>
              </div>
              <span className="text-[11px] text-blue-400 hover:underline">
                {showStorageDetails ? 'Hide details' : 'View storage info'}
              </span>
            </div>

            {showStorageDetails && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
                <div>
                  <strong className="text-slate-200">1. Firebase Authentication:</strong> Cloud user identities, tokens, and Google credentials are managed securely by Google Cloud Firebase Auth.
                </div>
                <div>
                  <strong className="text-slate-200">2. Google Cloud Firestore:</strong> User profiles and activity are stored in the <code className="text-amber-400">users/&#123;userId&#125;</code> collection in database <code className="text-amber-400">ai-studio-bulkmailer-24006a45-f78c-44a7-816c-a2359b373dd3</code>.
                </div>
                <div>
                  <strong className="text-slate-200">3. Account Vault:</strong> Local browser account credentials and simulated reset keys are encrypted and retained in the client accounts vault.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

