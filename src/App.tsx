import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { NavigationTabs, ActiveTab } from './components/NavigationTabs';
import { CampaignSequenceEditor } from './components/CampaignSequenceEditor';
import { LeadManager } from './components/LeadManager';
import { LiveSenderQueue } from './components/LiveSenderQueue';
import { AnalyticsView } from './components/AnalyticsView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { TemplatesLibraryModal } from './components/TemplatesLibraryModal';
import { SettingsModal } from './components/SettingsModal';
import { Campaign, Lead, EmailLogEntry, SequenceStep, SmtpConfig, CampaignSchedule, CampaignTemplate } from './types';
import { DEFAULT_TEMPLATES } from './data/defaultTemplates';
import { DEFAULT_LEADS } from './data/defaultLeads';
import { renderTemplate } from './utils/templateEngine';

export default function App() {
  // Initialize campaign steps from first template
  const initialSteps: SequenceStep[] = DEFAULT_TEMPLATES[0].steps.map((s, idx) => ({
    id: `step-init-${idx + 1}`,
    stepNumber: s.stepNumber,
    type: idx === 0 ? 'initial' : idx === DEFAULT_TEMPLATES[0].steps.length - 1 ? 'breakup' : (`followup_${idx}` as SequenceStep['type']),
    delayDays: s.delayDays,
    subject: s.subject,
    body: s.body,
    condition: 'if_no_reply',
    isActive: true,
  }));

  const [campaign, setCampaign] = useState<Campaign>({
    id: 'camp-default',
    name: 'B2B Outbound Growth Sequence',
    description: '4-step personalized email sequence with automated follow-ups and AI icebreakers',
    status: 'draft',
    steps: initialSteps,
    schedule: {
      dailyLimit: 40,
      minDelaySeconds: 45,
      maxDelaySeconds: 90,
      timezone: 'America/New_York',
      activeHoursStart: '09:00',
      activeHoursEnd: '17:00',
      sendOnWeekends: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [leads, setLeads] = useState<Lead[]>(DEFAULT_LEADS);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('sequence');

  // Sending configuration
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(true);
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    fromName: 'Sarah Jenkins',
    fromEmail: 'sarah@hyperflow.io',
    isConfigured: false,
  });

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Toggle Campaign status: Draft / Running / Paused
  const handleToggleCampaignStatus = () => {
    setCampaign((prev) => {
      const nextStatus = prev.status === 'running' ? 'paused' : 'running';
      return { ...prev, status: nextStatus };
    });
  };

  const handleUpdateSteps = (newSteps: SequenceStep[]) => {
    setCampaign((prev) => ({
      ...prev,
      steps: newSteps,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleApplyTemplate = (template: CampaignTemplate) => {
    const formattedSteps: SequenceStep[] = template.steps.map((s, idx) => ({
      id: `step-tmpl-${Date.now()}-${idx + 1}`,
      stepNumber: s.stepNumber,
      type: idx === 0 ? 'initial' : idx === template.steps.length - 1 ? 'breakup' : (`followup_${idx}` as SequenceStep['type']),
      delayDays: s.delayDays,
      subject: s.subject,
      body: s.body,
      condition: 'if_no_reply',
      isActive: true,
    }));

    setCampaign((prev) => ({
      ...prev,
      name: template.title,
      description: template.description,
      steps: formattedSteps,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleApplyGeneratedSequence = (steps: SequenceStep[], campaignName?: string) => {
    setCampaign((prev) => ({
      ...prev,
      name: campaignName || prev.name,
      steps,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleAddEmailLog = (log: EmailLogEntry) => {
    setEmailLogs((prev) => [log, ...prev]);
  };

  // Automated Sequence Runner:
  // When campaign.status === 'running', periodically picks the next eligible prospect
  // and sends their next sequence step according to cadence rules.
  useEffect(() => {
    if (campaign.status !== 'running') return;

    const timer = setInterval(async () => {
      // Find candidate
      const eligibleLead = leads.find(
        (l) =>
          l.status === 'pending' ||
          (l.currentStep > 0 &&
            l.currentStep < campaign.steps.length &&
            l.status !== 'replied' &&
            l.status !== 'bounced')
      );

      if (!eligibleLead) {
        // All completed or stopped
        setCampaign((prev) => ({ ...prev, status: 'completed' }));
        return;
      }

      const stepIndex = eligibleLead.currentStep;
      const step = campaign.steps[stepIndex];
      if (!step || !step.isActive) return;

      const renderedSubject = renderTemplate(step.subject, eligibleLead);
      const renderedBody = renderTemplate(step.body, eligibleLead);

      try {
        const res = await fetch('/api/smtp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtpConfig,
            email: {
              to: eligibleLead.email,
              subject: renderedSubject,
              body: renderedBody,
              fromName: smtpConfig.fromName || 'Campaign Team',
              fromEmail: smtpConfig.fromEmail || 'outreach@domain.com',
            },
            isSimulated: isSimulatedMode,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const nextStepNum = step.stepNumber;
          const nextStatus =
            nextStepNum >= campaign.steps.length
              ? 'completed'
              : (`step_${nextStepNum}_sent` as Lead['status']);

          // Add log entry
          const logEntry: EmailLogEntry = {
            id: `auto-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            leadId: eligibleLead.id,
            leadEmail: eligibleLead.email,
            leadName: `${eligibleLead.firstName} ${eligibleLead.lastName}`.trim() || eligibleLead.company,
            leadCompany: eligibleLead.company,
            stepNumber: step.stepNumber,
            stepType: step.type,
            subject: renderedSubject,
            bodyPreview: renderedBody,
            status: 'delivered',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            isSimulated: data.isSimulated ?? isSimulatedMode,
          };
          setEmailLogs((prev) => [logEntry, ...prev]);

          // Update lead
          setLeads((prev) =>
            prev.map((l) =>
              l.id === eligibleLead.id
                ? {
                    ...l,
                    currentStep: nextStepNum,
                    status: nextStatus,
                    lastContactedAt: new Date().toISOString(),
                  }
                : l
            )
          );
        }
      } catch (err) {
        console.error('Sequence automated worker error:', err);
      }
    }, 4500); // Trigger every 4.5s in active run mode for responsive demo experience

    return () => clearInterval(timer);
  }, [campaign.status, campaign.steps, leads, smtpConfig, isSimulatedMode]);

  const inSequenceCount = leads.filter((l) =>
    ['in_sequence', 'step_1_sent', 'step_2_sent', 'step_3_sent'].includes(l.status)
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-200">
      {/* Top Application Header */}
      <Header
        campaign={campaign}
        smtpConfig={smtpConfig}
        isSimulatedMode={isSimulatedMode}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onToggleCampaignStatus={handleToggleCampaignStatus}
      />

      {/* Primary Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        leadCount={leads.length}
        inSequenceCount={inSequenceCount}
        emailLogCount={emailLogs.length}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {activeTab === 'sequence' && (
          <CampaignSequenceEditor
            steps={campaign.steps}
            onUpdateSteps={handleUpdateSteps}
            leads={leads}
            onOpenAiModal={() => setIsAiModalOpen(true)}
          />
        )}

        {activeTab === 'prospects' && (
          <LeadManager leads={leads} onUpdateLeads={setLeads} />
        )}

        {activeTab === 'execution' && (
          <LiveSenderQueue
            campaign={campaign}
            leads={leads}
            steps={campaign.steps}
            emailLogs={emailLogs}
            smtpConfig={smtpConfig}
            isSimulatedMode={isSimulatedMode}
            onUpdateLeads={setLeads}
            onAddEmailLog={handleAddEmailLog}
            onToggleCampaignStatus={handleToggleCampaignStatus}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView leads={leads} steps={campaign.steps} emailLogs={emailLogs} />
        )}
      </main>

      {/* Global Modals */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedSequence={handleApplyGeneratedSequence}
      />

      <TemplatesLibraryModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        smtpConfig={smtpConfig}
        onUpdateSmtpConfig={setSmtpConfig}
        isSimulatedMode={isSimulatedMode}
        onToggleSimulatedMode={setIsSimulatedMode}
        schedule={campaign.schedule}
        onUpdateSchedule={(schedule: CampaignSchedule) =>
          setCampaign((prev) => ({ ...prev, schedule }))
        }
      />
    </div>
  );
}
