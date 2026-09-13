import React, { useState } from 'react';
import { Mail, Search, Trash2, Plus, Play, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { SAMPLE_150_EMAILS } from '../data/sampleBulkEmails';
import { parseBulkEmails } from '../utils/bulkEmailParser';

interface PendingMailsViewProps {
  pendingEmails: string[];
  onUpdatePendingEmails: (emails: string[]) => void;
  onNavigateHome: () => void;
  theme?: 'dark' | 'light';
}

export const PendingMailsView: React.FC<PendingMailsViewProps> = ({
  pendingEmails,
  onUpdatePendingEmails,
  onNavigateHome,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [newEmailInput, setNewEmailInput] = useState('');

  const filtered = pendingEmails.filter((e) =>
    e.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveOne = (emailToRemove: string) => {
    onUpdatePendingEmails(pendingEmails.filter((e) => e !== emailToRemove));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all pending emails?')) {
      onUpdatePendingEmails([]);
    }
  };

  const handleAddEmails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim()) return;

    const parsed = parseBulkEmails(newEmailInput);
    if (parsed.uniqueEmails.length === 0) {
      alert('No valid emails detected in input.');
      return;
    }

    const merged = Array.from(new Set([...pendingEmails, ...parsed.uniqueEmails]));
    onUpdatePendingEmails(merged);
    setNewEmailInput('');
  };

  const handleLoadSample150 = () => {
    const parsed = parseBulkEmails(SAMPLE_150_EMAILS.join('\n'));
    onUpdatePendingEmails(parsed.uniqueEmails);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* Top Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Pending Mails ({pendingEmails.length})
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Recipients queued and awaiting outbound bulk delivery
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleLoadSample150}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1.5 ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-blue-600 border-blue-200 shadow-xs'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load 150 Sample Mails</span>
          </button>

          {pendingEmails.length > 0 && (
            <button
              onClick={handleClearAll}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-rose-400 border-slate-800'
                  : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          <button
            onClick={onNavigateHome}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center space-x-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch in Workflow</span>
          </button>
        </div>
      </div>

      {/* Add More Emails Bar */}
      <div
        className={`border rounded-xl p-4 shadow-xs ${
          isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <form onSubmit={handleAddEmails} className="space-y-3">
          <label className="text-xs font-semibold block">
            Add or Paste Additional Emails (comma, newline, or semicolon separated)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              placeholder="e.g. recruit@stripe.com, jobs@anthropic.com"
              className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center justify-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Queue</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Table */}
      <div
        className={`border rounded-xl overflow-hidden shadow-xs ${
          isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div
          className={`p-4 border-b flex items-center justify-between gap-3 ${
            isDark ? 'border-slate-800' : 'border-slate-200 bg-slate-50/50'
          }`}
        >
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter pending recipient list..."
              className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Showing <strong>{filtered.length}</strong> of {pendingEmails.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold">No pending emails in queue</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Paste a bulk batch of up to 150+ emails or click "Load 150 Sample Mails".
            </p>
            <button
              onClick={handleLoadSample150}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Load 150 Sample Mails
            </button>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead
                className={`sticky top-0 backdrop-blur-xs border-b text-[10px] uppercase tracking-wider font-semibold ${
                  isDark
                    ? 'bg-slate-950/90 border-slate-800 text-slate-400'
                    : 'bg-slate-50/95 border-slate-200 text-slate-600'
                }`}
              >
                <tr>
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">Recipient Address</th>
                  <th className="px-5 py-3">Domain Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-slate-800/80' : 'divide-slate-200'
                }`}
              >
                {filtered.map((email, idx) => {
                  const isGmail = email.endsWith('@gmail.com') || email.endsWith('@googlemail.com');
                  return (
                    <tr
                      key={`${email}-${idx}`}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className={`px-5 py-3 font-mono text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {idx + 1}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        {email}
                      </td>
                      <td className="px-5 py-3">
                        {isGmail ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-800/40 text-[10px] font-medium">
                            @gmail.com
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-950/40 text-blue-300 border border-blue-800/40 text-[10px] font-medium">
                            Corporate / Work
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Queued
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleRemoveOne(email)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
