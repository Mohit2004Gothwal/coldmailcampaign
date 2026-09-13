import React, { useState } from 'react';
import { Settings, ShieldCheck, Mail, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Clock } from 'lucide-react';
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
}) => {
  const [formSmtp, setFormSmtp] = useState<SmtpConfig>({ ...smtpConfig });
  const [formSchedule, setFormSchedule] = useState<CampaignSchedule>({ ...schedule });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

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
          pass: formSmtp.pass,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: 'SMTP connection verified successfully! Credentials are valid.' });
        setFormSmtp((prev) => ({ ...prev, isConfigured: true }));
      } else {
        setTestResult({ success: false, message: data.error || 'Connection failed. Check host, port, or app password.' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      setTestResult({ success: false, message: 'Verification error: ' + message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onUpdateSmtpConfig(formSmtp);
    onUpdateSchedule(formSchedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Outreach Engine & Delivery Settings</h3>
              <p className="text-xs text-slate-500">
                Configure sandbox test mode, SMTP credentials, and delivery cadence.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-5">
          {/* Dispatch Mode Selector */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Email Dispatch Execution Mode
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => onToggleSimulatedMode(true)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSimulatedMode
                    ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs text-indigo-900 mb-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Sandbox Simulation</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Safe testing environment. Renders real personalized emails and simulates prospect replies without sending actual mail.
                </p>
              </div>

              <div
                onClick={() => onToggleSimulatedMode(false)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  !isSimulatedMode
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs text-emerald-900 mb-1">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span>Live SMTP Dispatch</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Sends actual cold emails via your configured SMTP mailbox (Gmail, SendGrid, Postmark, AWS SES, etc.).
                </p>
              </div>
            </div>
          </div>

          {/* SMTP Credentials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                SMTP Mailbox Configuration
              </h4>
              <span className="text-[11px] text-slate-400">Required for live sending</span>
            </div>

            <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-700">SMTP Host</label>
                  <input
                    type="text"
                    value={formSmtp.host}
                    onChange={(e) => setFormSmtp({ ...formSmtp, host: e.target.value })}
                    placeholder="e.g. smtp.gmail.com or smtp.sendgrid.net"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Port</label>
                  <input
                    type="number"
                    value={formSmtp.port}
                    onChange={(e) => setFormSmtp({ ...formSmtp, port: Number(e.target.value) })}
                    placeholder="587"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Username / Email</label>
                  <input
                    type="text"
                    value={formSmtp.user}
                    onChange={(e) => setFormSmtp({ ...formSmtp, user: e.target.value })}
                    placeholder="e.g. alex@yourcompany.com"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Password / App Key</label>
                  <input
                    type="password"
                    value={formSmtp.pass}
                    onChange={(e) => setFormSmtp({ ...formSmtp, pass: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Sender Display Name</label>
                  <input
                    type="text"
                    value={formSmtp.fromName}
                    onChange={(e) => setFormSmtp({ ...formSmtp, fromName: e.target.value })}
                    placeholder="e.g. Sarah from HyperFlow"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">From Email Address</label>
                  <input
                    type="email"
                    value={formSmtp.fromEmail}
                    onChange={(e) => setFormSmtp({ ...formSmtp, fromEmail: e.target.value })}
                    placeholder="e.g. sarah@hyperflow.io"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1 font-mono"
                  />
                </div>
              </div>

              {/* Test Button & Result */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={isTesting || !formSmtp.host || !formSmtp.user || !formSmtp.pass}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing SMTP Connection...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      <span>Verify SMTP Credentials</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <span
                    className={`text-xs font-medium flex items-center space-x-1 ${
                      testResult.success ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    <span>{testResult.message}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Cadence & Limits */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Deliverability Pacing & Warm-Up Guard
            </h4>
            <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-medium text-slate-700">Daily Sending Cap</label>
                <input
                  type="number"
                  value={formSchedule.dailyLimit}
                  onChange={(e) => setFormSchedule({ ...formSchedule, dailyLimit: Number(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 mt-1 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">Recommended: &lt; 50/day per mailbox</p>
              </div>

              <div>
                <label className="font-medium text-slate-700">Delay Between Emails (seconds)</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="number"
                    value={formSchedule.minDelaySeconds}
                    onChange={(e) => setFormSchedule({ ...formSchedule, minDelaySeconds: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    value={formSchedule.maxDelaySeconds}
                    onChange={(e) => setFormSchedule({ ...formSchedule, maxDelaySeconds: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Randomized delay avoids robotic spam filters</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
