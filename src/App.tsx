import React, { useState, useEffect } from 'react';
import { BulkMailerHeader, BulkTab } from './components/BulkMailerHeader';
import { StepwiseWorkflow } from './components/StepwiseWorkflow';
import { SentMailsView, SentMailRecord } from './components/SentMailsView';
import { PendingMailsView } from './components/PendingMailsView';
import { AuthModal } from './components/AuthModal';
import { GmailPermissionModal } from './components/GmailPermissionModal';
import { SAMPLE_150_EMAILS } from './data/sampleBulkEmails';
import { EmailAttachment } from './types';

const DEFAULT_SAMPLE_RESUME: EmailAttachment = {
  id: 'sample-resume-init',
  type: 'resume',
  name: 'Alex_Chen_Software_Engineer_Resume.pdf',
  size: 245760,
  mimeType: 'application/pdf',
  base64Data:
    'JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFsgNSAwIFIgXQo+PgplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDQgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA2IDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA3IDAgUgo+Pgo+Pgo+PgplbmRvYmoKNiAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMjQgVGYKNzIgNzIwIFRECihoZWxsbyB3b3JsZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago3IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgNCAwIFIKPj4KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDE2MSAwMDAwMCBuIAowMDAwMDAwMTczIDAwMDAwIG4gCjAwMDAwMDAxMTYgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAyMjUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA4Ci9Sb290IDMgMCBSCj4+CnN0YXJ0eHJlZgoyODIKJSVFT0YK',
  uploadedAt: 'Default verified',
};

export default function App() {
  // Theme state: dark vs light mode
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('bm_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('bm_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Navigation (Workflow, Sent Mails, Pending Mails)
  const [activeTab, setActiveTab] = useState<BulkTab>('workflow');

  // Authentication State
  // Preserving user email and account credentials
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('bm_user_email') || 'iit2022032@iiitl.ac.in';
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [isGmailGranted, setIsGmailGranted] = useState<boolean>(true);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState<boolean>(false);

  // Documents & Attachments (Resume is mandatory, Transcript is optional)
  const [resume, setResume] = useState<EmailAttachment | null>(DEFAULT_SAMPLE_RESUME);
  const [transcript, setTranscript] = useState<EmailAttachment | null>(null);

  // Pending queue: Pre-loaded or saved in localStorage
  const [pendingEmails, setPendingEmails] = useState<string[]>(() => {
    const saved = localStorage.getItem('bm_pending_emails');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default with sample emails
    return SAMPLE_150_EMAILS.slice(0, 150);
  });

  // Sent emails records
  const [sentMails, setSentMails] = useState<SentMailRecord[]>(() => {
    const saved = localStorage.getItem('bm_sent_mails');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('bm_user_email', userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('bm_pending_emails', JSON.stringify(pendingEmails));
  }, [pendingEmails]);

  useEffect(() => {
    localStorage.setItem('bm_sent_mails', JSON.stringify(sentMails));
  }, [sentMails]);

  // Auth Handlers
  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setIsAuthModalOpen(true);
  };

  // Mail Sent Handler
  const handleMailSent = (mail: {
    email: string;
    subject: string;
    body: string;
    timestamp: string;
    isGmailSkipped: boolean;
  }) => {
    const newRecord: SentMailRecord = {
      id: `sent-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      email: mail.email,
      subject: mail.subject,
      body: mail.body,
      timestamp: mail.timestamp,
      isGmailSkipped: mail.isGmailSkipped,
      resumeName: resume?.name,
      transcriptName: transcript?.name,
    };
    setSentMails((prev) => [newRecord, ...prev]);
  };

  const handleClearSentMails = () => {
    if (confirm('Are you sure you want to clear all sent email logs?')) {
      setSentMails([]);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white ${
        isDark ? 'bg-[#070b16] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Application Header with Brand, Step Navigation, Theme Switcher & Auth */}
      <BulkMailerHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userEmail={userEmail}
        isLoggedIn={isLoggedIn}
        sentCount={sentMails.length}
        pendingCount={pendingEmails.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'workflow' && (
          <StepwiseWorkflow
            theme={theme}
            userEmail={userEmail || 'iit2022032@iiitl.ac.in'}
            isLoggedIn={isLoggedIn}
            isGmailGranted={isGmailGranted}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenGmailModal={() => setIsGmailModalOpen(true)}
            resume={resume}
            transcript={transcript}
            onUpdateResume={setResume}
            onUpdateTranscript={setTranscript}
            pendingEmails={pendingEmails}
            onUpdatePendingEmails={setPendingEmails}
            onMailSent={handleMailSent}
            totalSentCount={sentMails.length}
          />
        )}

        {activeTab === 'sent' && (
          <SentMailsView
            theme={theme}
            sentMails={sentMails}
            onClearSentMails={handleClearSentMails}
            onNavigateHome={() => setActiveTab('workflow')}
          />
        )}

        {activeTab === 'pending' && (
          <PendingMailsView
            theme={theme}
            pendingEmails={pendingEmails}
            onUpdatePendingEmails={setPendingEmails}
            onNavigateHome={() => setActiveTab('workflow')}
          />
        )}
      </main>

      {/* Authentication Modal with Account Switching (University + Personal accounts) */}
      <AuthModal
        theme={theme}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUserEmail={userEmail}
        onLogin={handleLogin}
      />

      {/* Gmail Permission Modal */}
      <GmailPermissionModal
        theme={theme}
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        currentUserEmail={userEmail || 'iit2022032@iiitl.ac.in'}
        isGranted={isGmailGranted}
        onToggleGrant={setIsGmailGranted}
      />
    </div>
  );
}
