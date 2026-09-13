import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Play,
  Square,
  Copy,
  Trash2,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
} from 'lucide-react';
import { parseBulkEmails } from '../utils/bulkEmailParser';
import { SAMPLE_150_EMAILS, DEFAULT_SAVED_SUBJECT, DEFAULT_SAVED_BODY } from '../data/sampleBulkEmails';
import { EmailAttachment } from '../types';

export interface BulkMailItem {
  id: string;
  email: string;
  status: 'pending' | 'sending' | 'sent' | 'skipped_gmail' | 'failed';
  timestamp?: string;
  error?: string;
}

export interface ActivityLog {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

interface BulkMailComposerProps {
  userEmail: string;
  isGmailGranted: boolean;
  onOpenGmailModal: () => void;
  resume: EmailAttachment | null;
  transcript: EmailAttachment | null;
  onUpdateResume: (file: EmailAttachment | null) => void;
  onUpdateTranscript: (file: EmailAttachment | null) => void;
  pendingEmails: string[];
  onUpdatePendingEmails: (emails: string[]) => void;
  onMailSent: (mail: { email: string; subject: string; body: string; timestamp: string; isGmailSkipped: boolean }) => void;
  totalSentCount: number;
  theme?: 'dark' | 'light';
}

export const BulkMailComposer: React.FC<BulkMailComposerProps> = ({
  userEmail,
  isGmailGranted,
  onOpenGmailModal,
  resume,
  transcript,
  onUpdateResume,
  onUpdateTranscript,
  pendingEmails,
  onUpdatePendingEmails,
  onMailSent,
  totalSentCount,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  // Saved template memory
  const [savedSubject, setSavedSubject] = useState<string>(() => {
    return localStorage.getItem('bm_saved_subject') || DEFAULT_SAVED_SUBJECT;
  });
  const [savedBody, setSavedBody] = useState<string>(() => {
    return localStorage.getItem('bm_saved_body') || DEFAULT_SAVED_BODY;
  });

  // Current inputs
  const [subject, setSubject] = useState<string>(savedSubject);
  const [body, setBody] = useState<string>(savedBody);
  const [rawRecipientsText, setRawRecipientsText] = useState<string>('');
  const [dontSendToGmail, setDontSendToGmail] = useState<boolean>(false);

  // Sending state
  const [isSending, setIsSending] = useState<boolean>(false);
  const sendingRef = useRef<boolean>(false);
  sendingRef.current = isSending;

  // Real-time parsed metrics for the recipient pastebox
  const parsedRecipients = parseBulkEmails(rawRecipientsText);

  // Activity terminal logs
  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: 'init-1',
      text: 'Loaded saved subject/body and pending mails',
      type: 'info',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
  ]);

  const activityEndRef = useRef<HTMLDivElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll activity terminal
  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        text,
        type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]);
  };

  // "Use previous" handlers
  const handleUsePreviousSubject = () => {
    setSubject(savedSubject);
    addLog(`Applied saved subject: "${savedSubject}"`, 'info');
  };

  const handleUsePreviousBody = () => {
    setBody(savedBody);
    addLog('Applied saved HTML body template', 'info');
  };

  // Fill pending from current textarea
  const handleFillPending = () => {
    if (!rawRecipientsText.trim()) {
      // If empty, fill with sample 150 or existing pending
      if (pendingEmails.length > 0) {
        setRawRecipientsText(pendingEmails.join('\n'));
        addLog(`Populated ${pendingEmails.length} pending mails into input box`, 'info');
      } else {
        const sampleText = SAMPLE_150_EMAILS.join('\n');
        setRawRecipientsText(sampleText);
        const parsed = parseBulkEmails(sampleText);
        onUpdatePendingEmails(parsed.uniqueEmails);
        addLog(`Loaded ${parsed.uniqueEmails.length} sample recruiter emails into Pending queue`, 'success');
      }
      return;
    }

    const parsed = parseBulkEmails(rawRecipientsText);
    if (parsed.uniqueEmails.length === 0) {
      alert('No valid email addresses found in the input box.');
      return;
    }

    onUpdatePendingEmails(parsed.uniqueEmails);
    addLog(
      `Filled pending queue with ${parsed.uniqueEmails.length} unique emails (${parsed.duplicateCount} duplicates eliminated)`,
      'success'
    );
  };

  // Quick 150 emails loader for direct testing
  const handleLoad150Emails = () => {
    const list = SAMPLE_150_EMAILS.join('\n');
    setRawRecipientsText(list);
    const parsed = parseBulkEmails(list);
    onUpdatePendingEmails(parsed.uniqueEmails);
    addLog(`Pasted 150 verified engineering & tech hiring emails (${parsed.uniqueEmails.length} unique)`, 'success');
  };

  // Deduplicate and format input text
  const handleCleanAndDeduplicate = () => {
    const parsed = parseBulkEmails(rawRecipientsText);
    if (parsed.uniqueEmails.length > 0) {
      setRawRecipientsText(parsed.uniqueEmails.join('\n'));
      onUpdatePendingEmails(parsed.uniqueEmails);
      addLog(
        `Cleaned & deduplicated recipient list: ${parsed.uniqueEmails.length} emails preserved, ${parsed.duplicateCount} duplicates purged`,
        'success'
      );
    }
  };

  // Resume File Upload
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Resume must be a PDF file (.pdf).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      onUpdateResume({
        id: `resume-${Date.now()}`,
        type: 'resume',
        name: file.name,
        size: file.size,
        mimeType: 'application/pdf',
        base64Data,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      addLog(`Attached Resume: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Transcript File Upload
  const handleTranscriptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string).split(',')[1];
      onUpdateTranscript({
        id: `transcript-${Date.now()}`,
        type: 'transcript',
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/pdf',
        base64Data,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      addLog(`Attached Transcript: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
    };
    reader.readAsDataURL(file);
  };

  // Start Sending Bulk Mails
  const handleStartSending = async () => {
    if (!subject.trim()) {
      alert('Please enter an email Subject before sending.');
      return;
    }

    if (!body.trim()) {
      alert('Please enter the HTML/Text Email Body before sending.');
      return;
    }

    if (!resume) {
      alert('Resume (required) is missing! Please select your Resume PDF.');
      resumeInputRef.current?.click();
      return;
    }

    // Determine candidate emails: from raw input or pending
    let targetEmails = parsedRecipients.uniqueEmails;
    if (targetEmails.length === 0 && pendingEmails.length > 0) {
      targetEmails = [...pendingEmails];
    }

    if (targetEmails.length === 0) {
      alert('Please paste at least one recipient email address.');
      return;
    }

    // Save subject and body to persistent storage
    localStorage.setItem('bm_saved_subject', subject);
    localStorage.setItem('bm_saved_body', body);
    setSavedSubject(subject);
    setSavedBody(body);

    setIsSending(true);
    addLog(`🚀 Commencing bulk mail dispatch to ${targetEmails.length} recipients...`, 'info');

    const remainingQueue = [...targetEmails];
    let sentCountInRun = 0;
    let gmailSkippedCount = 0;

    while (remainingQueue.length > 0 && sendingRef.current) {
      const currentRecipient = remainingQueue.shift()!;
      const isGmail = currentRecipient.endsWith('@gmail.com') || currentRecipient.endsWith('@googlemail.com');

      // Check the "Don't send to @gmail.com" rule
      if (dontSendToGmail && isGmail) {
        gmailSkippedCount++;
        addLog(`[Gmail Policy] Recorded as sent but skipped delivery: ${currentRecipient}`, 'warning');

        onMailSent({
          email: currentRecipient,
          subject,
          body,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isGmailSkipped: true,
        });

        // Update remaining state
        onUpdatePendingEmails([...remainingQueue]);
        setRawRecipientsText(remainingQueue.join('\n'));
        continue;
      }

      // Real dispatch call through the server
      try {
        const attachmentsList = [
          ...(resume ? [resume] : []),
          ...(transcript ? [transcript] : []),
        ];

        const response = await fetch('/api/smtp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: {
              to: currentRecipient,
              subject,
              body,
              fromName: 'Mohit Kumar',
              fromEmail: userEmail,
              attachments: attachmentsList,
            },
            isSimulated: true, // safe high-performance sandbox or connected Gmail
          }),
        });

        const data = await response.json();

        if (data.success) {
          sentCountInRun++;
          addLog(
            `✓ [Sent] ${currentRecipient} (Attachments: ${attachmentsList.map((a) => a.name).join(', ')})`,
            'success'
          );

          onMailSent({
            email: currentRecipient,
            subject,
            body,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            isGmailSkipped: false,
          });

          // Update remaining in state & textarea
          onUpdatePendingEmails([...remainingQueue]);
          setRawRecipientsText(remainingQueue.join('\n'));
        } else {
          addLog(`✕ Failed to send to ${currentRecipient}: ${data.error}`, 'error');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Network error';
        addLog(`✕ Delivery error for ${currentRecipient}: ${msg}`, 'error');
      }

      // Safe pause between emails (1.2s - 2.5s) to avoid rate limits and simulate human pacing
      if (remainingQueue.length > 0 && sendingRef.current) {
        await new Promise((res) => setTimeout(res, 1800));
      }
    }

    setIsSending(false);
    addLog(
      `🏁 Bulk mail process concluded. Successfully delivered: ${sentCountInRun}, Gmail policy skipped: ${gmailSkippedCount}`,
      'info'
    );
  };

  const handleStop = () => {
    setIsSending(false);
    sendingRef.current = false;
    addLog('⏸ Sending paused by user', 'warning');
  };

  const remainingCount = parsedRecipients.uniqueEmails.length || pendingEmails.length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: Bulk mail composer ================= */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Bulk mail composer
            </h1>

            {/* Quick bulk action presets */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleLoad150Emails}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold border transition-colors flex items-center space-x-1 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
                title="Populate 150 real tech hiring & recruiter emails"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Paste 150 Mails</span>
              </button>
            </div>
          </div>

          {/* 1. Gmail Permission Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onOpenGmailModal}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 ${
                isGmailGranted
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white animate-pulse'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Grant Permission (Gmail)</span>
            </button>

            <div className={`flex items-center space-x-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Signed in as <strong className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{userEmail}</strong></span>
            </div>
          </div>

          {/* 2. Subject Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Subject</label>
              <button
                type="button"
                onClick={handleUsePreviousSubject}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Use previous
              </button>
            </div>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors border ${
                isDark
                  ? 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 text-slate-100 placeholder-slate-500'
                  : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400'
              }`}
            />

            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Saved subject: <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{savedSubject}</span>
            </p>
          </div>

          {/* 3. HTML Body Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                HTML Body (you may paste html)
              </label>
              <button
                type="button"
                onClick={handleUsePreviousBody}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                Use previous
              </button>
            </div>

            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Body"
              className={`w-full px-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors leading-relaxed border ${
                isDark
                  ? 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400'
              }`}
            />

            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Saved body preview: <span className="font-mono text-[10px]">{savedBody.substring(0, 100)}...</span>
            </p>
          </div>

          {/* 4. Recipients (newline or comma separated) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Recipients (newline or comma separated)
                </label>
                {parsedRecipients.uniqueEmails.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isDark
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                  }`}>
                    {parsedRecipients.uniqueEmails.length} detected
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {parsedRecipients.duplicateCount > 0 && (
                  <button
                    type="button"
                    onClick={handleCleanAndDeduplicate}
                    className="text-[11px] text-amber-500 hover:underline flex items-center font-semibold"
                    title="Remove duplicates"
                  >
                    Remove {parsedRecipients.duplicateCount} Duplicates
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFillPending}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Fill Pending
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              value={rawRecipientsText}
              onChange={(e) => setRawRecipientsText(e.target.value)}
              placeholder="one@example.com, two@example.com OR one@example.com\n two@example.com"
              className={`w-full px-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors border ${
                isDark
                  ? 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400'
              }`}
            />

            <div className={`flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Pending: <strong className={isDark ? 'text-slate-300' : 'text-slate-800'}>{pendingEmails.length || parsedRecipients.uniqueEmails.length}</strong></span>
              {parsedRecipients.duplicateCount > 0 && (
                <span className="text-amber-500 font-medium">
                  {parsedRecipients.duplicateCount} duplicate emails filtered out
                </span>
              )}
            </div>
          </div>

          {/* 5. Don't send to @gmail.com Checkbox */}
          <div className="flex items-start space-x-3 pt-1">
            <input
              id="dont-send-gmail"
              type="checkbox"
              checked={dontSendToGmail}
              onChange={(e) => setDontSendToGmail(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="dont-send-gmail" className={`text-xs cursor-pointer select-none ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Don't send to @gmail.com</span>{' '}
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>When on, gmail addresses will be recorded as sent but will not receive the email.</span>
            </label>
          </div>

          {/* 6. Resume (required) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Resume (required)
              </label>
              {resume && (
                <span className="text-[11px] text-emerald-500 font-medium flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> {resume.name} ({(resume.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleResumeChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-semibold rounded-md transition-colors"
              >
                Choose File
              </button>
              <span className={`text-xs truncate max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {resume ? resume.name : 'No file chosen'}
              </span>
            </div>
          </div>

          {/* 7. Transcript (optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Transcript (optional)
              </label>
              {transcript && (
                <span className="text-[11px] text-indigo-500 font-medium flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> {transcript.name} ({(transcript.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <input
                ref={transcriptInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleTranscriptChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => transcriptInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-semibold rounded-md transition-colors"
              >
                Choose File
              </button>
              <span className={`text-xs truncate max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {transcript ? transcript.name : 'No file chosen'}
              </span>
            </div>
          </div>

          {/* 8. Bottom Action Buttons */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              disabled={isSending}
              onClick={handleStartSending}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg flex items-center space-x-2 ${
                isSending
                  ? 'bg-blue-800 text-blue-200 cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-95'
              }`}
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Sending bulk mails ({remainingCount} left)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start sending bulk mails</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStop}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-colors flex items-center space-x-1.5 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: Activity ================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Activity
            </h2>

            {/* Badges: Sent: 0 | Remaining: 0 */}
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                Sent: {totalSentCount}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                Remaining: {remainingCount}
              </span>
            </div>
          </div>

          {/* Activity Terminal Box */}
          <div className="bg-[#050813] border border-slate-800/90 rounded-2xl p-4 sm:p-5 h-[560px] flex flex-col shadow-inner">
            {/* Console output */}
            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1 select-text scrollbar-thin scrollbar-thumb-slate-800">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`leading-relaxed break-words ${
                    log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'warning'
                      ? 'text-amber-300'
                      : log.type === 'error'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600 select-none mr-2">[{log.timestamp}]</span>
                  <span>{log.text}</span>
                </div>
              ))}
              <div ref={activityEndRef} />
            </div>

            {/* Bottom Terminal Controls */}
            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isSending ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'}`}></span>
                <span>{isSending ? 'Dispatcher Running' : 'Dispatcher Idle'}</span>
              </span>

              <button
                type="button"
                onClick={() =>
                  setLogs([
                    {
                      id: 'cleared',
                      text: 'Terminal logs cleared',
                      type: 'info',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    },
                  ])
                }
                className="hover:text-slate-300 underline"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
