import React, { useState, useEffect, useRef } from 'react';
import { BulkMailerHeader, BulkTab } from './components/BulkMailerHeader';
import { StepwiseWorkflow } from './components/StepwiseWorkflow';
import { SentMailsView, SentMailRecord } from './components/SentMailsView';
import { PendingMailsView } from './components/PendingMailsView';
import { AuthModal } from './components/AuthModal';
import { GmailPermissionModal } from './components/GmailPermissionModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { SAMPLE_150_EMAILS } from './data/sampleBulkEmails';
import { DEFAULT_SAMPLE_RESUME } from './data/sampleResume';
import { EmailAttachment, SmtpConfig, CampaignSchedule } from './types';
import {
  auth,
  db,
  testConnection,
  onAuthStateChanged,
  syncUserProfile,
  saveSentMailToFirestore,
  clearAllSentMailsFromFirestore,
  saveCampaignSettingToFirestore,
  signOut,
} from './firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';

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
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('bm_user_email') || '';
  });
  const [userId, setUserId] = useState<string>(() => {
    const saved = localStorage.getItem('bm_user_id');
    if (saved) return saved;
    const initialEmail = localStorage.getItem('bm_user_email') || '';
    return initialEmail ? `usr_${initialEmail.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('bm_user_email'));
  });
  const [isGmailGranted, setIsGmailGranted] = useState<boolean>(true);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // Delivery & SMTP Configuration State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('bm_is_simulated');
    return saved !== null ? saved === 'true' : true;
  });
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(() => {
    const saved = localStorage.getItem('bm_smtp_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      fromName: 'Cold Mail Outreach',
      fromEmail: '',
    };
  });
  const [schedule, setSchedule] = useState<CampaignSchedule>(() => {
    const saved = localStorage.getItem('bm_schedule');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      dailyLimit: 150,
      minDelaySeconds: 1,
      maxDelaySeconds: 4,
      sendWindowStart: '09:00',
      sendWindowEnd: '18:00',
      timezone: 'UTC',
    };
  });

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState<boolean>(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);

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

  // Firebase connection and Auth subscription
  useEffect(() => {
    testConnection().then((connected) => {
      setFirebaseConnected(connected);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setUserEmail(user.email || 'user@example.com');
        setUserId(user.uid);
        setIsLoggedIn(true);
        syncUserProfile(user).catch((err) => {
          console.warn('User profile sync note:', err);
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync state to local storage & Firestore settings
  useEffect(() => {
    localStorage.setItem('bm_user_email', userEmail);
    localStorage.setItem('bm_user_id', userId);
  }, [userEmail, userId]);

  useEffect(() => {
    localStorage.setItem('bm_pending_emails', JSON.stringify(pendingEmails));
    // Persist to Firestore settings strictly when user is authenticated with Firebase
    if (firebaseUser && userId && firebaseUser.uid === userId) {
      saveCampaignSettingToFirestore(userId, {
        subject: 'Inquiry / Application',
        body: 'Default outreach template',
        pendingEmails: pendingEmails.slice(0, 300),
        dontSendToGmail: true,
      }).catch((err) => console.log('Firestore settings auto-save note:', err.message));
    }
  }, [pendingEmails, userId, firebaseUser]);

  useEffect(() => {
    localStorage.setItem('bm_sent_mails', JSON.stringify(sentMails));
  }, [sentMails]);

  // Persist Delivery & SMTP Settings
  useEffect(() => {
    localStorage.setItem('bm_is_simulated', String(isSimulatedMode));
  }, [isSimulatedMode]);

  useEffect(() => {
    localStorage.setItem('bm_smtp_config', JSON.stringify(smtpConfig));
  }, [smtpConfig]);

  useEffect(() => {
    localStorage.setItem('bm_schedule', JSON.stringify(schedule));
  }, [schedule]);

  // Firestore Real-time Listener for sent emails
  useEffect(() => {
    // Only attach onSnapshot listeners if auth is ready and user is authenticated
    if (!firebaseUser || !userId || firebaseUser.uid !== userId) return;

    try {
      const sentColRef = collection(db, 'users', userId, 'sent_mails');
      const unsubscribeSent = onSnapshot(
        sentColRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreRecords: SentMailRecord[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              firestoreRecords.push({
                id: docSnap.id,
                email: d.email,
                subject: d.subject,
                body: d.body,
                timestamp: d.timestamp,
                isGmailSkipped: !!d.isGmailSkipped,
                resumeName: d.resumeName,
                transcriptName: d.transcriptName,
              });
            });
            // Merge with local records, removing duplicates by id
            setSentMails((prev) => {
              const map = new Map<string, SentMailRecord>();
              [...firestoreRecords, ...prev].forEach((m) => {
                if (!map.has(m.id)) map.set(m.id, m);
              });
              return Array.from(map.values());
            });
          }
        },
        (error) => {
          console.warn('Firestore sent_mails snapshot note:', error.message);
        }
      );

      return () => unsubscribeSent();
    } catch (e) {
      console.warn('Firestore listener setup note:', e);
    }
  }, [firebaseUser, userId]);

  // Auth Handlers
  const handleLogin = (email: string, displayName?: string, uid?: string) => {
    setUserEmail(email);
    const newUid = uid || auth.currentUser?.uid || `usr_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    setUserId(newUid);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout note:', e);
    }
    setFirebaseUser(null);
    setIsLoggedIn(false);
    setUserEmail('');
    setUserId('');
    localStorage.removeItem('bm_user_email');
    localStorage.removeItem('bm_user_id');
    setIsAuthModalOpen(false);
  };

  // Mail Sent Handler: Stores locally AND pushes to Firestore
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

    // Save to Firestore audit collection if user is authenticated with Firebase
    if (userId && firebaseUser && firebaseUser.uid === userId) {
      saveSentMailToFirestore(userId, {
        id: newRecord.id,
        email: newRecord.email,
        subject: newRecord.subject,
        body: newRecord.body,
        timestamp: newRecord.timestamp,
        isGmailSkipped: newRecord.isGmailSkipped,
        resumeName: newRecord.resumeName,
        transcriptName: newRecord.transcriptName,
      }).catch((err) => {
        console.warn('Could not write sent mail to Firestore:', err.message);
      });
    }
  };

  const handleClearSentMails = () => {
    if (confirm('Are you sure you want to clear all sent email logs?')) {
      setSentMails([]);
      if (userId && firebaseUser && firebaseUser.uid === userId) {
        clearAllSentMailsFromFirestore(userId).catch((err) => {
          console.warn('Could not clear Firestore logs:', err.message);
        });
      }
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
        firebaseConnected={firebaseConnected}
        isFirebaseUser={!!firebaseUser}
        onOpenFirebaseConfig={() => setIsFirebaseModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isLiveDelivery={!isSimulatedMode}
        isSmtpConfigured={Boolean(smtpConfig.host && smtpConfig.user && smtpConfig.pass)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'workflow' && (
          <StepwiseWorkflow
            theme={theme}
            userEmail={userEmail}
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
            smtpConfig={smtpConfig}
            onUpdateSmtpConfig={setSmtpConfig}
            isSimulatedMode={isSimulatedMode}
            onToggleSimulatedMode={setIsSimulatedMode}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
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
        currentUserEmail={userEmail}
        isGranted={isGmailGranted}
        onToggleGrant={setIsGmailGranted}
      />

      {/* Firebase & Firestore Database Configuration Modal */}
      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        theme={theme}
        userEmail={userEmail}
      />

      {/* SMTP and Delivery Channel Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        smtpConfig={smtpConfig}
        onUpdateSmtpConfig={setSmtpConfig}
        isSimulatedMode={isSimulatedMode}
        onToggleSimulatedMode={setIsSimulatedMode}
        schedule={schedule}
        onUpdateSchedule={setSchedule}
        theme={theme}
        currentUserEmail={userEmail}
      />
    </div>
  );
}

