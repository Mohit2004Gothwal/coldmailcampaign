import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Trash2,
  FileText,
  Mail,
  Check,
  AlertCircle,
  Clock,
  Send,
  Zap,
  Flame,
  CheckCircle2,
  X,
  Settings,
} from 'lucide-react';
import { parseBulkEmails } from '../utils/bulkEmailParser';
import { SAMPLE_150_EMAILS } from '../data/sampleBulkEmails';
import { DEFAULT_SAMPLE_RESUME } from '../data/sampleResume';
import { SmtpConfig } from '../types';

export interface EmailAttachment {
  id: string;
  type: 'resume' | 'transcript';
  name: string;
  size: number;
  mimeType: string;
  base64Data: string;
  uploadedAt: string;
}

export const DEFAULT_SAVED_SUBJECT =
  'Software Engineer Application - Mohit Kumar (IIIT Lucknow)';

export const DEFAULT_SAVED_BODY = `<p>Dear Hiring Team,</p>
<p>I hope this email finds you well.</p>
<p>I am reaching out to express my strong enthusiasm for engineering opportunities at your team. I am a final-year student at IIIT Lucknow with extensive experience architecting full-stack TypeScript, React, and Node.js applications.</p>
<p>I have attached my <strong>Resume</strong> for your review. I would welcome the opportunity to discuss how my background aligns with your engineering goals.</p>
<p>Thank you very much for your consideration.</p>
<p>Sincerely,<br/>
<strong>Mohit Kumar</strong><br/>
IIIT Lucknow<br/>
<a href="https://linkedin.com">LinkedIn Profile</a> | <a href="https://github.com">GitHub Profile</a>
</p>`;

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
  initialSubject?: string;
  initialBody?: string;
  initialSkipGmail?: boolean;
  initialRecipientsText?: string;
  onOpenFirebaseModal?: () => void;
  smtpConfig?: SmtpConfig;
  onUpdateSmtpConfig?: (config: SmtpConfig) => void;
  isSimulatedMode?: boolean;
  onToggleSimulatedMode?: (isSimulated: boolean) => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
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
  initialSubject,
  initialBody,
  initialSkipGmail,
  initialRecipientsText,
  onOpenFirebaseModal,
  smtpConfig,
  onUpdateSmtpConfig,
  isSimulatedMode = true,
  onToggleSimulatedMode,
  onOpenSettings,
  onOpenAuth,
}) => {
  const isDark = theme === 'dark';

  // Saved template memory (defaults to empty string)
  const [savedSubject, setSavedSubject] = useState<string>(() => {
    return localStorage.getItem('bm_saved_subject') || '';
  });
  const [savedBody, setSavedBody] = useState<string>(() => {
    return localStorage.getItem('bm_saved_body') || '';
  });

  // Current inputs with initial synchronization (starts empty unless explicitly passed or saved)
  const [subject, setSubject] = useState<string>(() => {
    if (initialSubject !== undefined) return initialSubject;
    return localStorage.getItem('bm_saved_subject') || '';
  });
  const [body, setBody] = useState<string>(() => {
    if (initialBody !== undefined) return initialBody;
    return localStorage.getItem('bm_saved_body') || '';
  });

  // Recipient input box - initialize with pending emails or passed recipients so it is never blank
  const [rawRecipientsText, setRawRecipientsText] = useState<string>(() => {
    if (initialRecipientsText && initialRecipientsText.trim()) {
      return initialRecipientsText;
    }
    if (pendingEmails && pendingEmails.length > 0) {
      return pendingEmails.join('\n');
    }
    return '';
  });

  const [dontSendToGmail, setDontSendToGmail] = useState<boolean>(() => {
    if (initialSkipGmail !== undefined) return initialSkipGmail;
    return false;
  });

  // Dispatch Speed / Pacing Selector: fast = 500ms, normal = 1400ms, safe = 2800ms
  const [sendSpeed, setSendSpeed] = useState<'fast' | 'normal' | 'safe'>('fast');

  // Single Test Email Modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [testRecipient, setTestRecipient] = useState<string>(() => userEmail || 'gothwalmohit03@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  // Sending state
  const [isSending, setIsSending] = useState<boolean>(false);
  const [activeQueueCount, setActiveQueueCount] = useState<number | null>(null);
  const sendingRef = useRef<boolean>(false);
  sendingRef.current = isSending;

  // Real-time parsed metrics for the recipient pastebox
  const parsedRecipients = parseBulkEmails(rawRecipientsText);

  // Activity terminal logs
  const [logs, setLogs] = useState<ActivityLog[]>([
    {
      id: 'init-1',
      text: `Campaign console initialized. Active sender: ${userEmail || 'Mohit Kumar'}`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    },
    {
      id: 'init-2',
      text: `Queue status: ${pendingEmails.length} recipients queued. Dispatch engine ready.`,
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

  // Keep rawRecipientsText synced if empty and pendingEmails arrives
  useEffect(() => {
    if (!rawRecipientsText.trim() && pendingEmails.length > 0) {
      setRawRecipientsText(pendingEmails.join('\n'));
    }
  }, [pendingEmails.length]);

  // Update inputs when parent step values change
  useEffect(() => {
    if (initialSubject && initialSubject !== subject) {
      setSubject(initialSubject);
    }
  }, [initialSubject]);

  useEffect(() => {
    if (initialBody && initialBody !== body) {
      setBody(initialBody);
    }
  }, [initialBody]);

  useEffect(() => {
    if (initialSkipGmail !== undefined && initialSkipGmail !== dontSendToGmail) {
      setDontSendToGmail(initialSkipGmail);
    }
  }, [initialSkipGmail]);

  useEffect(() => {
    if (initialRecipientsText && initialRecipientsText.trim() && initialRecipientsText !== rawRecipientsText) {
      setRawRecipientsText(initialRecipientsText);
    }
  }, [initialRecipientsText]);

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

  // Recipient input handler with seamless two-way update
  const handleRecipientsChange = (newText: string) => {
    setRawRecipientsText(newText);
    const parsed = parseBulkEmails(newText);
    onUpdatePendingEmails(parsed.uniqueEmails);
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

  // Load sample resume if user doesn't have a PDF file
  const handleLoadSampleResume = () => {
    onUpdateResume(DEFAULT_SAMPLE_RESUME);
    addLog('Loaded pre-configured resume: Mohit_Kumar_Resume_SWE.pdf', 'success');
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

  // ================= DEDICATED SINGLE TEST EMAIL DISPATCH =================
  // Sends a single test email without altering the bulk queue
  const handleSendSingleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      alert('Authentication required: Users cannot send emails without signing in or entering a sender identity. Please log in first.');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!testRecipient.trim() || !testRecipient.includes('@')) {
      alert('Please enter a valid destination email address for the test.');
      return;
    }

    if (!isSimulatedMode && (!smtpConfig?.host || !smtpConfig?.user || !smtpConfig?.pass)) {
      alert(
        'Live SMTP mode is active, but your SMTP credentials (Host, User, and App Password) are not configured. Please configure SMTP in Delivery Settings first, or toggle to Sandbox Simulation mode.'
      );
      if (onOpenSettings) onOpenSettings();
      return;
    }

    setIsSendingTest(true);
    setTestSuccessMessage(null);
    addLog(
      `🧪 Initiating single test email dispatch to ${testRecipient} (${isSimulatedMode ? 'Sandbox Simulated' : 'Live Real SMTP'})...`,
      'info'
    );

    const effectiveResume = resume || DEFAULT_SAMPLE_RESUME;
    const attachmentsList = [
      ...(effectiveResume ? [effectiveResume] : []),
      ...(transcript ? [transcript] : []),
    ];

    const effectiveFromName = smtpConfig?.fromName || (userEmail ? userEmail.split('@')[0] : 'Mohit Kumar');
    const effectiveFromEmail = smtpConfig?.fromEmail || smtpConfig?.user || userEmail || '';

    try {
      const response = await fetch('/api/smtp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig: smtpConfig || undefined,
          isSimulated: isSimulatedMode,
          email: {
            to: testRecipient.trim(),
            subject: subject || 'Test Outreach Email',
            body: body || '<p>This is a test outreach message.</p>',
            fromName: effectiveFromName,
            fromEmail: effectiveFromEmail,
            attachments: attachmentsList,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        addLog(
          `✓ [Test Mail Sent] Successfully delivered to ${testRecipient} ${isSimulatedMode ? '(Sandbox Mode)' : '(Real SMTP Delivery)'} (Attached: ${effectiveResume.name})`,
          'success'
        );

        onMailSent({
          email: testRecipient.trim(),
          subject: subject || 'Test Outreach Email',
          body: body || '<p>This is a test outreach message.</p>',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isGmailSkipped: false,
        });

        setTestSuccessMessage(
          `Test email delivered to ${testRecipient}! ${isSimulatedMode ? '(Sandbox Mode)' : '(Real SMTP Delivery)'}`
        );
        setTimeout(() => {
          setIsTestModalOpen(false);
          setTestSuccessMessage(null);
        }, 1800);
      } else {
        addLog(`✕ Test delivery failed: ${data.error || 'Server error'}`, 'error');
        alert(`Test delivery failed: ${data.error || 'Server error'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error';
      addLog(`✕ Test delivery error: ${msg}`, 'error');
      alert(`Network error during test: ${msg}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // ================= BULK SENDING ENGINE =================
  const handleStartSending = async () => {
    if (!userEmail) {
      alert('Authentication required: Users cannot send emails without signing in or entering a sender identity. Please log in first.');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!subject.trim()) {
      alert('Please enter an email Subject before sending.');
      return;
    }

    if (!body.trim()) {
      alert('Please enter the HTML/Text Email Body before sending.');
      return;
    }

    if (!isSimulatedMode && (!smtpConfig?.host || !smtpConfig?.user || !smtpConfig?.pass)) {
      alert(
        'Live SMTP mode is active, but your SMTP credentials (Host, User, and App Password) are not configured. Please configure SMTP in Delivery Settings first, or toggle to Sandbox Simulation mode.'
      );
      if (onOpenSettings) onOpenSettings();
      return;
    }

    // Auto-fallback to sample resume if missing
    let activeResume = resume;
    if (!activeResume) {
      activeResume = DEFAULT_SAMPLE_RESUME;
      onUpdateResume(DEFAULT_SAMPLE_RESUME);
      addLog('Auto-attached standard resume for bulk dispatch: Mohit_Kumar_Resume_SWE.pdf', 'info');
    }

    // Determine target recipient queue
    let targetEmails = parsedRecipients.uniqueEmails;
    if (targetEmails.length === 0 && pendingEmails.length > 0) {
      targetEmails = [...pendingEmails];
      setRawRecipientsText(targetEmails.join('\n'));
    }

    if (targetEmails.length === 0) {
      alert('Please paste at least one recipient email address, or click "Paste 150 Mails".');
      return;
    }

    // Save subject and body to persistent storage
    localStorage.setItem('bm_saved_subject', subject);
    localStorage.setItem('bm_saved_body', body);
    setSavedSubject(subject);
    setSavedBody(body);

    setIsSending(true);
    sendingRef.current = true;
    setActiveQueueCount(targetEmails.length);

    addLog(
      `🚀 Commencing bulk mail dispatch to ${targetEmails.length} recipients (${isSimulatedMode ? 'Sandbox Mode' : 'Live Real SMTP'})...`,
      'info'
    );

    // Create a mutable copy of the remaining queue
    const queue = [...targetEmails];
    let sentCountInRun = 0;
    let gmailSkippedCount = 0;

    // Delay lookup by speed
    const delayMs = sendSpeed === 'fast' ? 500 : sendSpeed === 'normal' ? 1400 : 2800;

    while (queue.length > 0 && sendingRef.current) {
      const currentRecipient = queue[0]; // peek without shifting yet
      const isGmail = currentRecipient.endsWith('@gmail.com') || currentRecipient.endsWith('@googlemail.com');

      // Check the "Don't send to @gmail.com" rule
      if (dontSendToGmail && isGmail) {
        gmailSkippedCount++;
        addLog(`[Gmail Policy Skipped] Excluded corporate-only outreach: ${currentRecipient}`, 'warning');

        onMailSent({
          email: currentRecipient,
          subject,
          body,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isGmailSkipped: true,
        });

        // Remove from queue and update states
        queue.shift();
        setActiveQueueCount(queue.length);
        onUpdatePendingEmails([...queue]);
        setRawRecipientsText(queue.join('\n'));
      } else {
        try {
          const attachmentsList = [
            ...(activeResume ? [activeResume] : []),
            ...(transcript ? [transcript] : []),
          ];

          const effectiveFromName = smtpConfig?.fromName || (userEmail ? userEmail.split('@')[0] : 'Mohit Kumar');
          const effectiveFromEmail = smtpConfig?.fromEmail || smtpConfig?.user || userEmail || '';

          const response = await fetch('/api/smtp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              smtpConfig: smtpConfig || undefined,
              isSimulated: isSimulatedMode,
              email: {
                to: currentRecipient,
                subject,
                body,
                fromName: effectiveFromName,
                fromEmail: effectiveFromEmail,
                attachments: attachmentsList,
              },
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

            // Smoothly remove from queue and update remaining count
            queue.shift();
            setActiveQueueCount(queue.length);
            onUpdatePendingEmails([...queue]);
            setRawRecipientsText(queue.join('\n'));
          } else {
            addLog(`✕ Failed to send to ${currentRecipient}: ${data.error || 'Server rejected dispatch'}`, 'error');
            // Advance past broken recipient so the entire batch doesn't get permanently stuck
            queue.shift();
            setActiveQueueCount(queue.length);
            onUpdatePendingEmails([...queue]);
            setRawRecipientsText(queue.join('\n'));
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Network error';
          addLog(`✕ Delivery error for ${currentRecipient}: ${msg}`, 'error');
          // Advance past network error recipient
          queue.shift();
          setActiveQueueCount(queue.length);
          onUpdatePendingEmails([...queue]);
          setRawRecipientsText(queue.join('\n'));
        }
      }

      // Safe pause between emails
      if (queue.length > 0 && sendingRef.current) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }

    setIsSending(false);
    sendingRef.current = false;
    setActiveQueueCount(null);

    if (queue.length === 0) {
      addLog(
        `🎉 Bulk campaign completed! Delivered: ${sentCountInRun}, Gmail policy skipped: ${gmailSkippedCount}`,
        'success'
      );
    } else {
      addLog(
        `⏸ Dispatch halted. Delivered: ${sentCountInRun}, ${queue.length} emails still in remaining queue.`,
        'info'
      );
    }
  };

  const handleStop = () => {
    setIsSending(false);
    sendingRef.current = false;
    setActiveQueueCount(null);
    addLog('⏸ Sending paused by user. Remaining queue preserved.', 'warning');
  };

  // Accurate, reliable remaining count
  const remainingCount =
    isSending && activeQueueCount !== null
      ? activeQueueCount
      : parsedRecipients.uniqueEmails.length || pendingEmails.length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT COLUMN: Bulk mail composer ================= */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bulk mail composer
              </h1>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Configure outreach template, attached credentials, and manage dispatch pacing
              </p>
            </div>

            {/* Quick Actions Strip */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsTestModalOpen(true)}
                disabled={isSending}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                  isDark
                    ? 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border-blue-800/80 shadow-xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Send 1 Test Mail</span>
              </button>

              <button
                type="button"
                onClick={handleLoad150Emails}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Paste 150 Mails</span>
              </button>
            </div>
          </div>

          {/* 1. Gmail Permission Banner & SMTP Mode Control */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-slate-800/80 bg-slate-900/30">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenGmailModal}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5 ${
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
                <span>
                  Sender:{' '}
                  <strong className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {userEmail || 'Active Outreach Account'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Delivery Mode & SMTP Status */}
            <div className="flex items-center space-x-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  isSimulatedMode
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                }`}
              >
                {isSimulatedMode ? 'Sandbox Mode' : 'Live Real SMTP'}
              </span>

              {onToggleSimulatedMode && (
                <button
                  type="button"
                  onClick={() => onToggleSimulatedMode(!isSimulatedMode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {isSimulatedMode ? 'Enable Real SMTP' : 'Switch to Sandbox'}
                </button>
              )}

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title="Configure SMTP Delivery Settings"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Subject Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Subject</label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubject(DEFAULT_SAVED_SUBJECT);
                    setBody(DEFAULT_SAVED_BODY);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isDark
                      ? 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-400 border-blue-800/60'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                  }`}
                >
                  Load Sample Template
                </button>
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
            </div>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Partnership Inquiry / Engineering Application"
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors border ${
                isDark
                  ? 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 text-slate-100 placeholder-slate-500'
                  : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400'
              }`}
            />

            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Saved subject: <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{savedSubject || '(none saved yet)'}</span>
            </p>
          </div>

          {/* 3. HTML Body Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                HTML Body (you may paste html)
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setBody(DEFAULT_SAVED_BODY)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isDark
                      ? 'bg-blue-950/40 hover:bg-blue-900/50 text-blue-400 border-blue-800/60'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200'
                  }`}
                >
                  Load Sample Template
                </button>
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
            </div>

            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="<p>Dear Hiring Team,</p><p>I am reaching out regarding...</p>"
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
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isDark
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                    }`}
                  >
                    {parsedRecipients.uniqueEmails.length} active
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
              onChange={(e) => handleRecipientsChange(e.target.value)}
              placeholder="careers@stripe.com&#10;recruiting@openai.com&#10;talent@linear.app"
              className={`w-full px-4 py-3 rounded-xl text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors border ${
                isDark
                  ? 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 placeholder-slate-400'
              }`}
            />

            <div className={`flex items-center justify-between text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>
                Pending in queue: <strong className={isDark ? 'text-slate-300' : 'text-slate-800'}>{remainingCount}</strong>
              </span>
              {parsedRecipients.duplicateCount > 0 && (
                <span className="text-amber-500 font-medium">
                  {parsedRecipients.duplicateCount} duplicate emails filtered out
                </span>
              )}
            </div>
          </div>

          {/* 5. Policy & Speed Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Don't send to @gmail.com Checkbox */}
            <div className="flex items-start space-x-3">
              <input
                id="dont-send-gmail"
                type="checkbox"
                checked={dontSendToGmail}
                onChange={(e) => setDontSendToGmail(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="dont-send-gmail" className="text-xs cursor-pointer select-none">
                <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  Don't send to @gmail.com
                </span>
                <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Safeguard: Skips personal inboxes, targeting only corporate work emails
                </span>
              </label>
            </div>

            {/* Pacing Speed Selector */}
            <div className="flex items-center justify-end space-x-1.5 text-xs">
              <span className={`text-[11px] font-medium mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Pacing:
              </span>
              <button
                type="button"
                onClick={() => setSendSpeed('fast')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1 ${
                  sendSpeed === 'fast'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-900 text-slate-400 border-slate-800'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Fast (0.5s)</span>
              </button>
              <button
                type="button"
                onClick={() => setSendSpeed('normal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  sendSpeed === 'normal'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-900 text-slate-400 border-slate-800'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                Normal (1.4s)
              </button>
              <button
                type="button"
                onClick={() => setSendSpeed('safe')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  sendSpeed === 'safe'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                    : isDark
                    ? 'bg-slate-900 text-slate-400 border-slate-800'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                Safe (2.8s)
              </button>
            </div>
          </div>

          {/* 6. Resume (required) */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Resume (required for applications)
              </label>
              {resume ? (
                <span className="text-[11px] text-emerald-500 font-medium flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> {resume.name} ({(resume.size / 1024).toFixed(1)} KB)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleLoadSampleResume}
                  className="text-[11px] text-blue-400 hover:underline font-semibold"
                >
                  Attach Sample Resume PDF
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf"
                onChange={handleResumeChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => resumeInputRef.current?.click()}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300'
                }`}
              >
                Choose File
              </button>
              <span className={`text-xs truncate max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {resume ? resume.name : 'No file chosen (sample PDF ready)'}
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
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900 border-slate-300'
                }`}
              >
                Choose File
              </button>
              <span className={`text-xs truncate max-w-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {transcript ? transcript.name : 'No file chosen'}
              </span>
            </div>
          </div>

          {/* 8. Bottom Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80">
            {/* Primary Bulk Dispatch Button */}
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

            {/* Dedicated Test Mail Button */}
            <button
              type="button"
              onClick={() => setIsTestModalOpen(true)}
              disabled={isSending}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center space-x-1.5 ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-800 hover:border-slate-700'
                  : 'bg-white hover:bg-slate-50 text-blue-700 border-slate-300 shadow-xs'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span>Send 1 Test Mail</span>
            </button>

            {/* Stop Button */}
            <button
              type="button"
              onClick={handleStop}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors flex items-center space-x-1.5 ${
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
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
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
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 text-[10px] select-none mr-2">[{log.timestamp}]</span>
                  {log.text}
                </div>
              ))}
              <div ref={activityEndRef} />
            </div>

            {/* Terminal Status Footer */}
            <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSending ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                  }`}
                />
                <span>{isSending ? 'Dispatching active' : 'Terminal ready'}</span>
              </div>
              <span>{logs.length} events logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SINGLE TEST EMAIL MODAL ================= */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-4 ${
              isDark ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-800">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Send 1 Test Email</h3>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Dispatch a single test message to verify your content, attachments, and email inbox delivery.
              <strong className="text-emerald-400 block mt-1">
                Note: This does NOT modify or reduce your {remainingCount} bulk emails in the pending queue.
              </strong>
            </p>

            <form onSubmit={handleSendSingleTest} className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Send test email to:</label>
                <input
                  type="email"
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="e.g. gothwalmohit03@gmail.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Delivery Channel:</span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-md ${
                        isSimulatedMode ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'
                      }`}
                    >
                      {isSimulatedMode ? 'Sandbox Simulation' : `Real SMTP (${smtpConfig?.host || 'Configured'})`}
                    </span>
                    {onOpenSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsTestModalOpen(false);
                          onOpenSettings();
                        }}
                        className="text-blue-400 hover:text-blue-300 underline text-[11px] ml-1"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-semibold truncate max-w-[200px]">{subject || '(No subject entered)'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Attachment:</span>
                  <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                    {resume ? resume.name : DEFAULT_SAMPLE_RESUME.name}
                  </span>
                </div>
              </div>

              {testSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testSuccessMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    isDark ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                >
                  {isSendingTest ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
