import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  ExternalLink,
  HelpCircle,
  Send,
  Zap,
} from 'lucide-react';
import { SmtpConfig, CampaignSchedule } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  smtpConfig: SmtpConfig;
  onUpdateSmtpConfig: (config: SmtpConfig) => void;
  isSimulatedMode: boolean;
  onToggleSimulatedMode: (isSimulated: boolean) => void;
  schedule: CampaignSchedule;
  onUpdateSchedule: (schedule: CampaignSchedule) => void;
  theme?: 'dark' | 'light';
  currentUserEmail?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  smtpConfig,
  onUpdateSmtpConfig,
  isSimulatedMode,
  onToggleSimulatedMode,
  schedule,
  onUpdateSchedule,
  theme = 'dark',
  currentUserEmail = '',
}) => {
  const [formSmtp, setFormSmtp] = useState<SmtpConfig>(() => ({
    ...smtpConfig,
    user: smtpConfig.user || currentUserEmail,
    fromEmail: smtpConfig.fromEmail || smtpConfig.user || currentUserEmail,
  }));
  const [formSchedule, setFormSchedule] = useState<CampaignSchedule>({ ...schedule });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleTestSmtp = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/smtp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: formSmtp.host,
          port: formSmtp.port,
          secure: formSmtp.secure,
          user: formSmtp.user,
          pass: formSmtp.pass.replace(/\s+/g, ''),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: 'Connection verified! Mailbox is ready to send live emails.',
        });
        setFormSmtp((prev) => ({ ...prev, isConfigured: true }));
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Check host, port, or app password.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setTestResult({ success: false, message: 'Verification error: ' + message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    const cleanedConfig: SmtpConfig = {
      ...formSmtp,
      pass: formSmtp.pass.replace(/\s+/g, ''),
      isConfigured: Boolean(formSmtp.host && formSmtp.user && formSmtp.pass),
    };
    onUpdateSmtpConfig(cleanedConfig);
    onUpdateSchedule(formSchedule);
    onClose();
  };

  const applyPreset = (type: 'gmail' | 'outlook' | 'brevo') => {
    setTestResult(null);
    if (type === 'gmail') {
      setFormSmtp((prev) => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        user: prev.user || currentUserEmail || '',
        fromEmail: prev.fromEmail || prev.user || currentUserEmail || '',
      }));
    } else if (type === 'outlook') {
      setFormSmtp((prev) => ({
        ...prev,
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
      }));
    } else if (type === 'brevo') {
      setFormSmtp((prev) => ({
        ...prev,
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl max-w-xl w-full p-6 shadow-2xl border max-h-[92vh] flex flex-col ${
          isDark
            ? 'bg-[#0b1120] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Delivery & Outbound Mailbox Settings</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Configure Live SMTP dispatch or Sandbox test mode.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg text-sm font-bold transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-5">
          {/* Dispatch Mode Selector */}
          <div
            className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-blue-400">
              Email Dispatch Execution Mode
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Sandbox Option */}
              <div
                onClick={() => onToggleSimulatedMode(true)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSimulatedMode
                    ? isDark
                      ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500 text-indigo-200'
                      : 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-500 text-indigo-900'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Sandbox Simulation</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Safe preview mode. Generates real personalized previews and activity logs without delivering actual emails.
                </p>
              </div>

              {/* Live SMTP Option */}
              <div
                onClick={() => onToggleSimulatedMode(false)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  !isSimulatedMode
                    ? isDark
                      ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500 text-emerald-200'
                      : 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-500 text-emerald-900'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs mb-1">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Live SMTP Dispatch</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sends actual cold emails to real recipient inboxes using your configured Gmail or custom SMTP server.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1-Click SMTP Presets
              </span>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Auto-fills host & recommended ports
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('gmail')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                  formSmtp.host === 'smtp.gmail.com'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-red-400" />
                <span>Google / Gmail</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('outlook')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                  formSmtp.host === 'smtp.office365.com'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Outlook / 365</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('brevo')}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                  formSmtp.host === 'smtp-relay.brevo.com'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-400'
                    : isDark
                    ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Brevo (Sendinblue)</span>
              </button>
            </div>
          </div>

          {/* Gmail App Password Helper Banner */}
          {formSmtp.host.includes('gmail') && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                isDark ? 'bg-blue-950/30 border-blue-800/60 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Using Gmail? Google requires an App Password</span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                Google disables direct login with standard account passwords. To send real emails:
              </p>
              <ol className="list-decimal list-inside text-[11px] space-y-1 opacity-90 pl-1">
                <li>Turn on <strong>2-Step Verification</strong> on your Google Account.</li>
                <li>
                  Go to{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold hover:text-blue-300 inline-flex items-center space-x-1"
                  >
                    <span>Google App Passwords</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                  </a>
                </li>
                <li>Create an app named <em>Cold Mail</em> and copy the generated <strong>16-character code</strong>.</li>
                <li>Paste that 16-character code into the Password field below.</li>
              </ol>
            </div>
          )}

          {/* SMTP Credentials Form */}
          <div
            className={`p-4 rounded-xl border space-y-3.5 ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold block mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={formSmtp.host}
                  onChange={(e) => setFormSmtp({ ...formSmtp, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className={`w-full text-xs p-2.5 rounded-lg border font-mono ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Port</label>
                <input
                  type="number"
                  value={formSmtp.port}
                  onChange={(e) =>
                    setFormSmtp({
                      ...formSmtp,
                      port: Number(e.target.value),
                      secure: Number(e.target.value) === 465,
                    })
                  }
                  placeholder="465"
                  className={`w-full text-xs p-2.5 rounded-lg border font-mono ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Sender Email / Username</label>
                <input
                  type="text"
                  value={formSmtp.user}
                  onChange={(e) =>
                    setFormSmtp({
                      ...formSmtp,
                      user: e.target.value,
                      fromEmail: formSmtp.fromEmail || e.target.value,
                    })
                  }
                  placeholder="e.g. mohit@gmail.com"
                  className={`w-full text-xs p-2.5 rounded-lg border font-mono ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {formSmtp.host.includes('gmail') ? '16-Char App Password' : 'Password / API Key'}
                </label>
                <input
                  type="password"
                  value={formSmtp.pass}
                  onChange={(e) => setFormSmtp({ ...formSmtp, pass: e.target.value })}
                  placeholder="••••••••••••••••"
                  className={`w-full text-xs p-2.5 rounded-lg border font-mono ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Sender Display Name</label>
                <input
                  type="text"
                  value={formSmtp.fromName}
                  onChange={(e) => setFormSmtp({ ...formSmtp, fromName: e.target.value })}
                  placeholder="Mohit Kumar"
                  className={`w-full text-xs p-2.5 rounded-lg border ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">From Header Email</label>
                <input
                  type="email"
                  value={formSmtp.fromEmail}
                  onChange={(e) => setFormSmtp({ ...formSmtp, fromEmail: e.target.value })}
                  placeholder="mohit@gmail.com"
                  className={`w-full text-xs p-2.5 rounded-lg border font-mono ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div className={`pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={isTesting || !formSmtp.host || !formSmtp.user || !formSmtp.pass}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-40 shrink-0 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span>Verifying SMTP...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    <span>Test SMTP Connection</span>
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`text-xs p-2 rounded-lg flex items-start space-x-1.5 ${
                    testResult.success
                      ? isDark
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : isDark
                      ? 'bg-red-950/40 text-red-300 border border-red-800/50'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{testResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t pt-4 mt-4 flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-md transition-all"
          >
            Save Delivery Settings
          </button>
        </div>
      </div>
    </div>
  );
};
