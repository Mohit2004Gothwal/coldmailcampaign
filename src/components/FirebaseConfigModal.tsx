import React, { useState } from 'react';
import {
  X,
  Flame,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Database,
  Shield,
  Layers,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { db, testConnection } from '../firebase';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  isFirebaseUser?: boolean;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  isFirebaseUser = false,
}) => {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'project' | 'rules'>('project');
  const [copiedRules, setCopiedRules] = useState(false);

  // Custom configuration state stored in localStorage
  const [customProjectId, setCustomProjectId] = useState<string>(() => {
    return localStorage.getItem('bm_firebase_project_id') || 'coldmail-compagin-v1';
  });
  const [customDatabaseId, setCustomDatabaseId] = useState<string>(() => {
    return localStorage.getItem('bm_firebase_database_id') || '(default)';
  });
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('bm_firebase_api_key') || '';
  });
  const [customAuthDomain, setCustomAuthDomain] = useState<string>(() => {
    return localStorage.getItem('bm_firebase_auth_domain') || 'coldmail-compagin-v1.firebaseapp.com';
  });

  const [activeMode, setActiveMode] = useState<'custom' | 'provisioned'>(() => {
    return (localStorage.getItem('bm_firebase_mode') as 'custom' | 'provisioned') || 'provisioned';
  });

  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    success?: boolean;
    message?: string;
  }>({ testing: false });

  if (!isOpen) return null;

  const handleCopyRules = () => {
    const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /sent_mails/{mailId} {
        allow read, write: if isOwner(userId);
      }

      match /settings/{settingId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}`;
    navigator.clipboard.writeText(rulesText);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const handleSaveConfig = () => {
    localStorage.setItem('bm_firebase_project_id', customProjectId);
    localStorage.setItem('bm_firebase_database_id', customDatabaseId);
    localStorage.setItem('bm_firebase_api_key', customApiKey);
    localStorage.setItem('bm_firebase_auth_domain', customAuthDomain);
    localStorage.setItem('bm_firebase_mode', activeMode);
    setTestStatus({
      testing: false,
      success: true,
      message: `Settings saved for project "${customProjectId}".`,
    });
  };

  const handleRunPingTest = async () => {
    setTestStatus({ testing: true });
    try {
      const ok = await testConnection();
      if (ok) {
        setTestStatus({
          testing: false,
          success: true,
          message: 'Firestore connection responsive and active!',
        });
      } else {
        setTestStatus({
          testing: false,
          success: false,
          message: 'Could not connect to Firestore. Verify network and project permissions.',
        });
      }
    } catch (e: any) {
      setTestStatus({
        testing: false,
        success: false,
        message: e?.message || 'Connection ping failed.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base">Firestore Database Settings</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  coldmail-compagin-v1
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Configure database synchronization, audit collections, and project rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border-b px-6 pt-3 space-x-6 text-xs font-semibold ${
            isDark ? 'border-slate-800 bg-[#070b16]' : 'border-slate-200 bg-slate-100/60'
          }`}
        >
          <button
            onClick={() => setActiveTab('project')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'project'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Target Database & Project</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Firestore Security Rules</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'project' && (
            <div className="space-y-5">
              {/* Target Project Link Card */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-blue-950/30 border-blue-800/60 text-blue-200'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Target Project</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                      coldmail-compagin-v1
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-80">
                    Direct access to Google Firebase Console for database documents, rules, and indexes.
                  </p>
                </div>

                <a
                  href="https://console.firebase.google.com/project/coldmail-compagin-v1/firestore"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto shrink-0"
                >
                  <span>Open Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Database Backend Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setActiveMode('custom')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeMode === 'custom'
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs">User Project: coldmail-compagin-v1</strong>
                      {activeMode === 'custom' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Direct cloud synchronization to your personal project coldmail-compagin-v1
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveMode('provisioned')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      activeMode === 'provisioned'
                        ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs">Built-In Provisioned Instance</strong>
                      {activeMode === 'provisioned' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Database: ai-studio-bulkmailer on spheric-scene-3n96h
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Settings */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Project ID</label>
                    <input
                      type="text"
                      value={customProjectId}
                      onChange={(e) => setCustomProjectId(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Firestore Database ID</label>
                    <input
                      type="text"
                      value={customDatabaseId}
                      onChange={(e) => setCustomDatabaseId(e.target.value)}
                      placeholder="(default)"
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={customAuthDomain}
                    onChange={(e) => setCustomAuthDomain(e.target.value)}
                    placeholder="coldmail-compagin-v1.firebaseapp.com"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">
                    Web API Key (Optional / from Firebase Console Project Settings)
                  </label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Optional Web API Key"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found in Firebase Console → Project Settings → General → Your apps → SDK setup/configuration.
                  </p>
                </div>
              </div>

              {/* Test Status Banner */}
              {testStatus.message && (
                <div
                  className={`p-3 rounded-xl border flex items-center space-x-2 text-xs ${
                    testStatus.success
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {testStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{testStatus.message}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300">
                    Security Rules for coldmail-compagin-v1
                  </span>
                  <button
                    onClick={handleCopyRules}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1 transition-colors"
                  >
                    {copiedRules ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
                  </button>
                </div>

                <pre className="p-3 rounded-lg bg-black/60 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);

      match /sent_mails/{mailId} {
        allow read, write: if isOwner(userId);
      }

      match /settings/{settingId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}`}
                </pre>
              </div>

              <div className="text-xs space-y-1.5 text-slate-400">
                <p>
                  <strong>How to deploy to coldmail-compagin-v1:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                  <li>
                    Open Firebase Console:{' '}
                    <a
                      href="https://console.firebase.google.com/project/coldmail-compagin-v1/firestore/rules"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      console.firebase.google.com/project/coldmail-compagin-v1/firestore/rules
                    </a>
                  </li>
                  <li>Click <strong>Rules</strong> tab at the top.</li>
                  <li>Paste the rules above and click <strong>Publish</strong>.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={handleRunPingTest}
            disabled={testStatus.testing}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center space-x-1.5 ${
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus.testing ? 'animate-spin' : ''}`} />
            <span>Test Connection Ping</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isDark ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
