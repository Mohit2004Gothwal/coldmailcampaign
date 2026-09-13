import React, { useState } from 'react';
import { Mail, Search, CheckCircle2, AlertCircle, FileText, Trash2, ExternalLink, Calendar, Paperclip } from 'lucide-react';

export interface SentMailRecord {
  id: string;
  email: string;
  subject: string;
  body: string;
  timestamp: string;
  isGmailSkipped: boolean;
  resumeName?: string;
  transcriptName?: string;
}

interface SentMailsViewProps {
  sentMails: SentMailRecord[];
  onClearSentMails: () => void;
  onNavigateHome: () => void;
  theme?: 'dark' | 'light';
}

export const SentMailsView: React.FC<SentMailsViewProps> = ({
  sentMails,
  onClearSentMails,
  onNavigateHome,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMail, setSelectedMail] = useState<SentMailRecord | null>(null);

  const filtered = sentMails.filter(
    (m) =>
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* Top Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Sent Mails</h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Historical log of all processed outbound emails and deliverability events
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {sentMails.length > 0 && (
            <button
              onClick={onClearSentMails}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center space-x-1.5 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 border-slate-800'
                  : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <button
            onClick={onNavigateHome}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
          >
            Compose New
          </button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div
        className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sent recipient or subject line..."
            className={`w-full pl-9 pr-3.5 py-2 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Delivered:</span>
            <strong>{sentMails.filter((m) => !m.isGmailSkipped).length}</strong>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Gmail Policy Skipped:</span>
            <strong>{sentMails.filter((m) => m.isGmailSkipped).length}</strong>
          </div>
        </div>
      </div>

      {/* Sent Table */}
      <div
        className={`border rounded-xl overflow-hidden shadow-xs ${
          isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
            <p className="text-sm font-semibold">No sent emails found</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Emails dispatched through the campaign builder will be recorded here automatically.
            </p>
            <button
              onClick={onNavigateHome}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Go to Workflow
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  className={`border-b text-[10px] uppercase tracking-wider font-semibold ${
                    isDark
                      ? 'bg-slate-950/80 border-slate-800 text-slate-400'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <th className="px-5 py-3">Recipient Email</th>
                  <th className="px-5 py-3">Subject Line</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Attachments</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-slate-800/80' : 'divide-slate-200'
                }`}
              >
                {filtered.map((mail) => (
                  <tr
                    key={mail.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium">
                      {mail.email}
                    </td>
                    <td className={`px-5 py-3.5 max-w-md truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {mail.subject}
                    </td>
                    <td className="px-5 py-3.5">
                      {mail.isGmailSkipped ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/50 text-amber-300 border border-amber-700/50">
                          Gmail Policy (Skipped)
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/50 text-emerald-300 border border-emerald-700/50">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Sent</span>
                        </span>
                      )}
                    </td>
                    <td className={`px-5 py-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="flex items-center space-x-1 text-[11px]">
                        <Paperclip className="w-3 h-3" />
                        <span>Resume.pdf</span>
                        {mail.transcriptName && <span>+ Transcript</span>}
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {mail.timestamp}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedMail(mail)}
                        className="text-blue-500 hover:text-blue-600 font-semibold text-[11px] underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            className={`border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl ${
              isDark ? 'bg-[#0b1329] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`px-6 py-4 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div>
                <h3 className="text-base font-bold">Sent Email Details</h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Dispatched to {selectedMail.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedMail(null)}
                className="text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div
                className={`p-4 rounded-xl space-y-2 text-xs border ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Recipient:</span>
                  <span className="font-semibold">{selectedMail.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Timestamp:</span>
                  <span>{selectedMail.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Subject:</span>
                  <span className="font-semibold">{selectedMail.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status:</span>
                  <span className="text-emerald-500 font-semibold">
                    {selectedMail.isGmailSkipped ? 'Recorded (Gmail Policy Skip)' : 'Delivered'}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Email Body Content
                </label>
                <div
                  className={`p-4 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto border ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  {selectedMail.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
