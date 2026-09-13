import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';

interface GmailPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  isGranted: boolean;
  onToggleGrant: (granted: boolean) => void;
  theme?: 'dark' | 'light';
}

export const GmailPermissionModal: React.FC<GmailPermissionModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  isGranted,
  onToggleGrant,
  theme = 'dark',
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleGrant = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onToggleGrant(true);
      onClose();
    }, 500);
  };

  const handleRevoke = () => {
    onToggleGrant(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div
        className={`border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#0b1329] border-slate-700 text-slate-200'
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Gmail API Authorization</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                OAuth 2.0 send-only scopes for outbound delivery
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Badge */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isGranted
                ? isDark
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : isDark
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              {isGranted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">
                  {isGranted ? 'Permission Granted & Active' : 'Permission Not Yet Granted'}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {isGranted
                    ? `Ready to dispatch outbound messages from ${currentUserEmail}`
                    : `Authorize Cold Mail Campaign Automator to send emails from ${currentUserEmail}`}
                </p>
              </div>
            </div>
          </div>

          {/* Scope Detail */}
          <div
            className={`rounded-xl p-4 space-y-2.5 text-xs border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Requested OAuth 2.0 Scope:
            </span>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div
                className={`p-2 rounded-lg border flex items-center justify-between ${
                  isDark
                    ? 'bg-slate-950/70 border-slate-800 text-cyan-400'
                    : 'bg-white border-slate-300 text-blue-700'
                }`}
              >
                <span>https://www.googleapis.com/auth/gmail.send</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    isDark
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  Send Only
                </span>
              </div>
            </div>
            <p className={`text-[11px] leading-relaxed pt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              We strictly enforce the <strong>gmail.send</strong> scope. The automator does not read or inspect your private inbox emails.
            </p>
          </div>

          {/* Connected User Account */}
          <div
            className={`rounded-xl p-3.5 flex items-center justify-between text-xs border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Authenticated Dispatcher Identity:
              </p>
              <p className="font-bold mt-0.5">{currentUserEmail}</p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                isDark
                  ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              Verified
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            {isGranted ? (
              <>
                <button
                  type="button"
                  onClick={handleRevoke}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/30 border-slate-700'
                      : 'text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-300'
                  }`}
                >
                  Revoke Permission
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleGrant}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
                >
                  {isProcessing ? (
                    <span>Authorizing...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Grant Gmail Permission</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
