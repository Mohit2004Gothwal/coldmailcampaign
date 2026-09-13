import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Mail,
  Users,
  Terminal,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LayoutGrid,
  ListOrdered,
  Upload,
  Paperclip,
  Check,
  Play,
  Square,
  Clock,
  Send,
  Plus,
  Trash2,
} from 'lucide-react';
import { BulkMailComposer, ActivityLog } from './BulkMailComposer';
import { EmailAttachment } from '../types';
import { SAMPLE_150_EMAILS, DEFAULT_SAVED_SUBJECT, DEFAULT_SAVED_BODY } from '../data/sampleBulkEmails';
import { parseBulkEmails } from '../utils/bulkEmailParser';

export type StepKey = 'auth' | 'documents' | 'sequence' | 'recipients' | 'execution';

interface StepwiseWorkflowProps {
  theme: 'dark' | 'light';
  userEmail: string;
  isLoggedIn: boolean;
  isGmailGranted: boolean;
  onOpenAuth: () => void;
  onOpenGmailModal: () => void;
  resume: EmailAttachment | null;
  transcript: EmailAttachment | null;
  onUpdateResume: (file: EmailAttachment | null) => void;
  onUpdateTranscript: (file: EmailAttachment | null) => void;
  pendingEmails: string[];
  onUpdatePendingEmails: (emails: string[]) => void;
  onMailSent: (mail: {
    email: string;
    subject: string;
    body: string;
    timestamp: string;
    isGmailSkipped: boolean;
  }) => void;
  totalSentCount: number;
}

export const StepwiseWorkflow: React.FC<StepwiseWorkflowProps> = ({
  theme,
  userEmail,
  isLoggedIn,
  isGmailGranted,
  onOpenAuth,
  onOpenGmailModal,
  resume,
  transcript,
  onUpdateResume,
  onUpdateTranscript,
  pendingEmails,
  onUpdatePendingEmails,
  onMailSent,
  totalSentCount,
}) => {
  const isDark = theme === 'dark';

  // Mode: Stepwise Wizard vs All-in-One Dashboard
  const [viewMode, setViewMode] = useState<'stepwise' | 'all_in_one'>('stepwise');
  const [currentStep, setCurrentStep] = useState<StepKey>('auth');

  // Shared Form State for stepwise steps
  const [subject, setSubject] = useState(DEFAULT_SAVED_SUBJECT);
  const [htmlBody, setHtmlBody] = useState(DEFAULT_SAVED_BODY);
  const [rawRecipients, setRawRecipients] = useState(() => pendingEmails.join('\n'));
  const [skipGmail, setSkipGmail] = useState(true);

  // Multi-step Sequence configuration inside Step 3
  const [activeSequenceStep, setActiveSequenceStep] = useState<number>(1);
  const [sequenceFollowUps, setSequenceFollowUps] = useState([
    {
      step: 1,
      name: 'Initial Cold Email',
      delayDays: 0,
      subject: DEFAULT_SAVED_SUBJECT,
      body: DEFAULT_SAVED_BODY,
    },
    {
      step: 2,
      name: 'Gentle Follow-Up 1',
      delayDays: 3,
      subject: 'Quick follow up regarding: ' + DEFAULT_SAVED_SUBJECT,
      body: `<p>Hi {{FirstName|there}},</p>
<p>Just floating this back to the top of your inbox in case it got buried under your weekly backlog.</p>
<p>I would love to learn if your engineering team has 10 minutes this Thursday for a brief chat.</p>
<p>Best regards,<br/><strong>Mohit Kumar</strong></p>`,
    },
    {
      step: 3,
      name: 'Final Breakup & Check-in',
      delayDays: 6,
      subject: 'Closing the loop - Software Engineering opportunities',
      body: `<p>Hi {{FirstName|there}},</p>
<p>I understand priorities shift fast and timing might not be ideal right now. I won't crowd your inbox further, but please feel free to keep my attached resume on file for future openings.</p>
<p>Wishing you and the team continued success!</p>
<p>Warmly,<br/><strong>Mohit Kumar</strong></p>`,
    },
  ]);

  const stepsList: { key: StepKey; num: number; title: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'auth', num: 1, title: 'Authentication', desc: 'Gmail OAuth & Identity', icon: ShieldCheck },
    { key: 'documents', num: 2, title: 'Resume & Documents', desc: 'Mandatory PDF & Transcript', icon: FileText },
    { key: 'sequence', num: 3, title: 'Sequence & Message', desc: 'Subject, Templates & Follow-ups', icon: Mail },
    { key: 'recipients', num: 4, title: 'Bulk Recipients', desc: '150+ Mails & Deduplication', icon: Users },
    { key: 'execution', num: 5, title: 'Live Execution', desc: 'Dispatch Queue & Logs', icon: Terminal },
  ];

  // Helper step transitions
  const stepOrder: StepKey[] = ['auth', 'documents', 'sequence', 'recipients', 'execution'];
  const currentIndex = stepOrder.indexOf(currentStep);

  const goToNextStep = () => {
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  // Recipient sync
  const handleBulkPaste150 = () => {
    const list = SAMPLE_150_EMAILS.join('\n');
    setRawRecipients(list);
    const parsed = parseBulkEmails(list);
    onUpdatePendingEmails(parsed.uniqueEmails);
  };

  const handleRecipientsChange = (val: string) => {
    setRawRecipients(val);
    const parsed = parseBulkEmails(val);
    onUpdatePendingEmails(parsed.uniqueEmails);
  };

  const parsedRecipients = parseBulkEmails(rawRecipients);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 space-y-6">
      {/* Top Controls: Mode Switcher & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Cold Mail Campaign Automator
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isDark
                  ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}
            >
              Stepwise Mode
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Guided stepwise campaign builder with automated follow-ups, bulk 150 recipient parser, and live dispatch console
          </p>
        </div>

        {/* View Mode Toggle */}
        <div
          className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setViewMode('stepwise')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'stepwise'
                ? isDark
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Stepwise Wizard</span>
          </button>

          <button
            onClick={() => setViewMode('all_in_one')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'all_in_one'
                ? isDark
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-700 shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>All-in-One Dashboard</span>
          </button>
        </div>
      </div>

      {/* Render All-In-One Dashboard if selected */}
      {viewMode === 'all_in_one' ? (
        <BulkMailComposer
          userEmail={userEmail || 'iit2022032@iiitl.ac.in'}
          isGmailGranted={isGmailGranted}
          onOpenGmailModal={onOpenGmailModal}
          resume={resume}
          transcript={transcript}
          onUpdateResume={onUpdateResume}
          onUpdateTranscript={onUpdateTranscript}
          pendingEmails={pendingEmails}
          onUpdatePendingEmails={onUpdatePendingEmails}
          onMailSent={onMailSent}
          totalSentCount={totalSentCount}
          theme={theme}
        />
      ) : (
        /* Stepwise Wizard View */
        <div className="space-y-6">
          {/* Stepper Progress Bar */}
          <div
            className={`p-3 sm:p-4 rounded-2xl border shadow-sm ${
              isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {stepsList.map((st, idx) => {
                const Icon = st.icon;
                const isActive = currentStep === st.key;
                const isPassed = stepOrder.indexOf(currentStep) > idx;

                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setCurrentStep(st.key)}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? isDark
                          ? 'bg-blue-600/15 border-blue-500 text-blue-400 ring-1 ring-blue-500/50'
                          : 'bg-blue-50 border-blue-400 text-blue-700 ring-1 ring-blue-300'
                        : isPassed
                        ? isDark
                          ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        : isDark
                        ? 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isPassed
                          ? isDark
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : isDark
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : st.num}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate leading-tight">{st.title}</p>
                      <p
                        className={`text-[10px] truncate ${
                          isActive
                            ? isDark
                              ? 'text-blue-300'
                              : 'text-blue-600'
                            : isDark
                            ? 'text-slate-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {st.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Content Container */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border shadow-sm transition-colors ${
              isDark ? 'bg-[#0a0f1d] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* STEP 1: AUTHENTICATION */}
            {currentStep === 'auth' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <span>Step 1: Account Authentication & Gmail Authorization</span>
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Configure your outbound sender credentials and authorize Gmail send scopes for high deliverability.
                  </p>
                </div>

                {/* Identity Card */}
                <div
                  className={`p-5 rounded-xl border space-y-4 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {(userEmail?.[0] || 'I').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Active Sender Identity</p>
                        <p className="text-sm font-bold">{userEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        Switch Account
                      </button>
                    </div>
                  </div>

                  {/* Gmail OAuth Scope status */}
                  <div
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isGmailGranted
                        ? isDark
                          ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isDark
                        ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">
                          {isGmailGranted ? 'Gmail API Send Scope Authorized' : 'Gmail Authorization Required'}
                        </p>
                        <p className="text-[11px] opacity-80">
                          Scope: https://www.googleapis.com/auth/gmail.send
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenGmailModal}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors shrink-0"
                    >
                      {isGmailGranted ? 'Manage Permission' : 'Grant Permission'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                  >
                    <span>Proceed to Step 2: Documents</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DOCUMENTS */}
            {currentStep === 'documents' && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span>Step 2: Resume (Mandatory) & Transcript (Optional)</span>
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    As requested, uploading your Resume PDF is mandatory for cold outreach campaigns. Transcript is optional.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Resume Upload */}
                  <div
                    className={`p-5 rounded-xl border flex flex-col justify-between ${
                      resume
                        ? isDark
                          ? 'bg-blue-950/20 border-blue-500/40'
                          : 'bg-blue-50/50 border-blue-300'
                        : isDark
                        ? 'bg-slate-900/50 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold flex items-center space-x-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                          <span>Resume (Mandatory)</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-700/50">
                          REQUIRED
                        </span>
                      </div>

                      {resume ? (
                        <div
                          className={`p-3 rounded-lg border text-xs flex items-center space-x-3 ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <FileText className="w-6 h-6 text-red-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate">{resume.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {(resume.size / 1024).toFixed(1)} KB • PDF
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateResume(null)}
                            className="text-slate-400 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-500 font-medium">
                          Please select or upload your resume PDF to proceed.
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="block">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64 = (reader.result as string).split(',')[1] || '';
                                onUpdateResume({
                                  id: `res-${Date.now()}`,
                                  type: 'resume',
                                  name: file.name,
                                  size: file.size,
                                  mimeType: file.type || 'application/pdf',
                                  base64Data: base64,
                                  uploadedAt: new Date().toLocaleTimeString(),
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Transcript Upload */}
                  <div
                    className={`p-5 rounded-xl border flex flex-col justify-between ${
                      transcript
                        ? isDark
                          ? 'bg-blue-950/20 border-blue-500/40'
                          : 'bg-blue-50/50 border-blue-300'
                        : isDark
                        ? 'bg-slate-900/50 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold flex items-center space-x-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                          <span>Transcript (Optional)</span>
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            isDark
                              ? 'bg-slate-800 text-slate-400 border-slate-700'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          OPTIONAL
                        </span>
                      </div>

                      {transcript ? (
                        <div
                          className={`p-3 rounded-lg border text-xs flex items-center space-x-3 ${
                            isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <FileText className="w-6 h-6 text-blue-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold truncate">{transcript.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {(transcript.size / 1024).toFixed(1)} KB • PDF
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onUpdateTranscript(null)}
                            className="text-slate-400 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          No transcript attached. You may optionally attach academic grade sheets.
                        </p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="block">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                const base64 = (reader.result as string).split(',')[1] || '';
                                onUpdateTranscript({
                                  id: `tra-${Date.now()}`,
                                  type: 'transcript',
                                  name: file.name,
                                  size: file.size,
                                  mimeType: file.type || 'application/pdf',
                                  base64Data: base64,
                                  uploadedAt: new Date().toLocaleTimeString(),
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-white hover:file:bg-slate-600 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center space-x-1.5 ${
                      isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back: Authentication</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                  >
                    <span>Proceed to Step 3: Sequence</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SEQUENCE & MESSAGE */}
            {currentStep === 'sequence' && (
              <div className="space-y-6 max-w-4xl">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span>Step 3: Multi-Step Outreach Sequence & Templates</span>
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Configure automated follow-up steps (Initial Outreach, Follow-up 1, Follow-up 2) with delay timers and HTML support.
                  </p>
                </div>

                {/* Step Tabs */}
                <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  {sequenceFollowUps.map((stepItem) => (
                    <button
                      key={stepItem.step}
                      type="button"
                      onClick={() => {
                        setActiveSequenceStep(stepItem.step);
                        setSubject(stepItem.subject);
                        setHtmlBody(stepItem.body);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                        activeSequenceStep === stepItem.step
                          ? 'bg-blue-600 text-white shadow-sm'
                          : isDark
                          ? 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>Step {stepItem.step}: {stepItem.name}</span>
                      {stepItem.delayDays > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded font-normal">
                          +{stepItem.delayDays}d
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Subject Line */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold">
                      Subject Line (Step {activeSequenceStep})
                    </label>
                    <button
                      type="button"
                      onClick={() => setSubject(DEFAULT_SAVED_SUBJECT)}
                      className={`text-[11px] font-semibold transition-colors ${
                        isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      Use previous template
                    </button>
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. SDE 1 / Full Stack Opportunities - Mohit Kumar"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* HTML Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold">
                      HTML / Email Body (supports &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;)
                    </label>
                    <button
                      type="button"
                      onClick={() => setHtmlBody(DEFAULT_SAVED_BODY)}
                      className={`text-[11px] font-semibold transition-colors ${
                        isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      Use previous body
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center space-x-1.5 ${
                      isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back: Documents</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                  >
                    <span>Proceed to Step 4: Bulk Recipients</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: BULK RECIPIENTS */}
            {currentStep === 'recipients' && (
              <div className="space-y-6 max-w-4xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span>Step 4: Bulk Recipients (Paste 150+ Mails)</span>
                    </h2>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Paste up to 150 or more emails. The system automatically detects and eliminates duplicate addresses.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBulkPaste150}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Paste 150 Sample Mails</span>
                  </button>
                </div>

                {/* Recipient Textarea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">Recipients (newline or comma separated)</span>
                    <span className="font-medium text-slate-400">
                      Detected: <strong className="text-blue-500">{parsedRecipients.uniqueEmails.length}</strong> unique
                      {parsedRecipients.duplicateCount > 0 && (
                        <span className="ml-1 text-amber-400">
                          ({parsedRecipients.duplicateCount} duplicates stripped)
                        </span>
                      )}
                    </span>
                  </div>

                  <textarea
                    rows={8}
                    value={rawRecipients}
                    onChange={(e) => handleRecipientsChange(e.target.value)}
                    placeholder="paste 150 emails separated by newlines, commas, or semicolons&#10;recruiter1@stripe.com&#10;jobs@airbnb.com&#10;talent@github.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 border ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                {/* Gmail Policy Skip Checkbox */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center space-x-3 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="stepwise-gmail-skip"
                    checked={skipGmail}
                    onChange={(e) => setSkipGmail(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="stepwise-gmail-skip" className="text-xs cursor-pointer select-none">
                    <strong className="block text-slate-200">Don't send to @gmail.com</strong>
                    <span className="text-slate-400">
                      Skip personal Gmail addresses to protect your outreach domain score and only target work emails.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center space-x-1.5 ${
                      isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back: Sequence</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
                  >
                    <span>Proceed to Step 5: Live Execution</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: LIVE EXECUTION */}
            {currentStep === 'execution' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center space-x-2">
                    <Terminal className="w-5 h-5 text-blue-500" />
                    <span>Step 5: Live Execution & Real-Time Activity Log</span>
                  </h2>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Ready to dispatch. All 4 previous steps are validated. Monitor live email sending, duplicate avoidance, and timestamps below.
                  </p>
                </div>

                {/* Embedded Live Composer & Activity Module */}
                <BulkMailComposer
                  userEmail={userEmail || 'iit2022032@iiitl.ac.in'}
                  isGmailGranted={isGmailGranted}
                  onOpenGmailModal={onOpenGmailModal}
                  resume={resume}
                  transcript={transcript}
                  onUpdateResume={onUpdateResume}
                  onUpdateTranscript={onUpdateTranscript}
                  pendingEmails={pendingEmails}
                  onUpdatePendingEmails={onUpdatePendingEmails}
                  onMailSent={onMailSent}
                  totalSentCount={totalSentCount}
                  theme={theme}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
