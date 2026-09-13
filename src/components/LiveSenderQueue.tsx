import React, { useState } from 'react';
import {
  Play,
  Pause,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Eye,
  RefreshCw,
  ShieldCheck,
  MailCheck,
  X,
  FileText,
  CornerDownRight,
  ExternalLink,
} from 'lucide-react';
import { Campaign, Lead, EmailLogEntry, SequenceStep, SmtpConfig } from '../types';
import { renderTemplate } from '../utils/templateEngine';

interface LiveSenderQueueProps {
  campaign: Campaign;
  leads: Lead[];
  steps: SequenceStep[];
  emailLogs: EmailLogEntry[];
  smtpConfig: SmtpConfig;
  isSimulatedMode: boolean;
  onUpdateLeads: (leads: Lead[]) => void;
  onAddEmailLog: (log: EmailLogEntry) => void;
  onToggleCampaignStatus: () => void;
}

export const LiveSenderQueue: React.FC<LiveSenderQueueProps> = ({
  campaign,
  leads,
  steps,
  emailLogs,
  smtpConfig,
  isSimulatedMode,
  onUpdateLeads,
  onAddEmailLog,
  onToggleCampaignStatus,
}) => {
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLogEntry | null>(null);
  const [inspectLead, setInspectLead] = useState<Lead | null>(null);

  const isRunning = campaign.status === 'running';

  // Calculate current queue stats
  const pendingLeads = leads.filter((l) => l.status === 'pending');
  const inSequenceLeads = leads.filter((l) =>
    ['in_sequence', 'step_1_sent', 'step_2_sent', 'step_3_sent'].includes(l.status)
  );
  const repliedLeads = leads.filter((l) => l.status === 'replied');
  const bouncedLeads = leads.filter((l) => l.status === 'bounced');

  // Single lead email dispatcher
  const dispatchEmailForLead = async (lead: Lead, stepIndex: number): Promise<boolean> => {
    const step = steps[stepIndex];
    if (!step || !step.isActive) return false;

    const renderedSubject = renderTemplate(step.subject, lead);
    const renderedBody = renderTemplate(step.body, lead);

    try {
      const res = await fetch('/api/smtp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpConfig,
          email: {
            to: lead.email,
            subject: renderedSubject,
            body: renderedBody,
            fromName: smtpConfig.fromName || 'Campaign Team',
            fromEmail: smtpConfig.fromEmail || smtpConfig.user || 'outreach@domain.com',
          },
          isSimulated: isSimulatedMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Create log entry
        const logEntry: EmailLogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          leadId: lead.id,
          leadEmail: lead.email,
          leadName: `${lead.firstName} ${lead.lastName}`.trim() || lead.company,
          leadCompany: lead.company,
          stepNumber: step.stepNumber,
          stepType: step.type,
          subject: renderedSubject,
          bodyPreview: renderedBody,
          status: 'delivered',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isSimulated: data.isSimulated ?? isSimulatedMode,
        };

        onAddEmailLog(logEntry);

        // Advance lead status
        const nextStepNum = step.stepNumber;
        const nextStatus =
          nextStepNum >= steps.length
            ? 'completed'
            : (`step_${nextStepNum}_sent` as Lead['status']);

        const updatedLeads = leads.map((l) => {
          if (l.id === lead.id) {
            return {
              ...l,
              currentStep: nextStepNum,
              status: nextStatus,
              lastContactedAt: new Date().toISOString(),
              nextScheduledAt:
                nextStepNum < steps.length
                  ? new Date(Date.now() + (steps[nextStepNum]?.delayDays || 3) * 86400000).toISOString()
                  : undefined,
            };
          }
          return l;
        });

        onUpdateLeads(updatedLeads);
        return true;
      }
    } catch (err) {
      console.error('Failed to dispatch email:', err);
    }
    return false;
  };

  // Dispatch next eligible batch of leads
  const handleSendNextBatch = async () => {
    if (isSendingBatch) return;
    setIsSendingBatch(true);

    // Candidates: Pending leads (need Step 1) or in-sequence leads ready for next step
    const eligibleLeads = leads.filter(
      (l) => l.status === 'pending' || (l.currentStep > 0 && l.currentStep < steps.length && l.status !== 'replied' && l.status !== 'bounced')
    );

    if (eligibleLeads.length === 0) {
      alert('No eligible prospects in queue! All leads have either completed the sequence, replied, or bounced.');
      setIsSendingBatch(false);
      return;
    }

    // Process up to 3 leads in this batch for smooth UI and deliverability pacing
    const batch = eligibleLeads.slice(0, 3);
    for (const lead of batch) {
      const stepIdx = lead.currentStep; // 0 for Step 1, 1 for Step 2, etc.
      await dispatchEmailForLead(lead, stepIdx);
      // Brief aesthetic pause between sends
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setIsSendingBatch(false);
  };

  // Simulate prospect reply (stops all subsequent automated follow-ups!)
  const handleSimulateReply = (lead: Lead) => {
    const replyNotes = [
      'Thanks for reaching out! Let’s hop on a call this Thursday at 2pm.',
      'Interesting timing—we are actually reviewing this exact pain point right now. Send over the deck.',
      'Open to a 5-minute chat next week. What does your schedule look like?',
    ];
    const randomReply = replyNotes[Math.floor(Math.random() * replyNotes.length)];

    const updated = leads.map((l) => {
      if (l.id === lead.id) {
        return {
          ...l,
          status: 'replied' as Lead['status'],
          replyText: randomReply,
        };
      }
      return l;
    });

    onUpdateLeads(updated);

    // Log reply event
    onAddEmailLog({
      id: `reply-${Date.now()}`,
      leadId: lead.id,
      leadEmail: lead.email,
      leadName: `${lead.firstName} ${lead.lastName}`.trim() || lead.company,
      leadCompany: lead.company,
      stepNumber: lead.currentStep,
      stepType: 'followup_1',
      subject: `Re: Follow-up response received`,
      bodyPreview: `PROSPECT REPLY: "${randomReply}"\n\n[Automated sequence halted immediately for this contact]`,
      status: 'replied',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isSimulated: isSimulatedMode,
    });
  };

  // Simulate bounce
  const handleSimulateBounce = (lead: Lead) => {
    const updated = leads.map((l) => {
      if (l.id === lead.id) {
        return {
          ...l,
          status: 'bounced' as Lead['status'],
        };
      }
      return l;
    });

    onUpdateLeads(updated);

    onAddEmailLog({
      id: `bounce-${Date.now()}`,
      leadId: lead.id,
      leadEmail: lead.email,
      leadName: `${lead.firstName} ${lead.lastName}`.trim(),
      leadCompany: lead.company,
      stepNumber: lead.currentStep,
      stepType: 'initial',
      subject: `Delivery Status Notification (Failure)`,
      bodyPreview: `550 5.1.1 The email account that you tried to reach does not exist at ${lead.company}.`,
      status: 'bounced',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isSimulated: isSimulatedMode,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Campaign Runner Control Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-slate-900">Campaign Execution Engine</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  isRunning
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isRunning ? 'Active Sequence Runner' : 'Engine Idle / Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated follow-up sequence runs based on your delay rules. If a prospect replies, their sequence halts automatically.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onToggleCampaignStatus}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause Automation</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start Automation</span>
                </>
              )}
            </button>

            <button
              id="btn-send-batch"
              disabled={isSendingBatch}
              onClick={handleSendNextBatch}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingBatch ? 'Dispatching Batch...' : 'Send Next Batch (3 Leads)'}</span>
            </button>
          </div>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Queue Pending</div>
            <div className="text-lg font-bold text-slate-800">{pendingLeads.length}</div>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/60">
            <div className="text-[11px] font-medium text-blue-600 uppercase">In Sequence</div>
            <div className="text-lg font-bold text-blue-900">{inSequenceLeads.length}</div>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/60">
            <div className="text-[11px] font-medium text-emerald-600 uppercase">Replies Received</div>
            <div className="text-lg font-bold text-emerald-900">{repliedLeads.length}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Total Emails Sent</div>
            <div className="text-lg font-bold text-slate-800">{emailLogs.length}</div>
          </div>
        </div>
      </div>

      {/* Main Execution Split: Active Leads Queue (Left) & Real-Time Dispatched Logs (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Prospect Funnel & Sequence Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Prospect Sequence Status</h3>
                <p className="text-xs text-slate-500">
                  Track each prospect's current sequence stage and simulate recipient behavior.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{leads.length} contacts</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {leads.map((lead) => {
                const nextStepNum = lead.currentStep + 1;
                const nextStep = steps[lead.currentStep];
                const isFinished = lead.status === 'completed' || lead.status === 'replied' || lead.status === 'bounced';

                return (
                  <div key={lead.id} className="p-3.5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {lead.firstName} {lead.lastName}
                          </span>
                          <span className="text-[11px] text-slate-500">({lead.company})</span>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              lead.status === 'replied'
                                ? 'bg-emerald-100 text-emerald-800 font-bold'
                                : lead.status === 'bounced'
                                ? 'bg-red-100 text-red-800'
                                : lead.currentStep > 0
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {lead.status === 'replied'
                              ? 'Replied (Halted)'
                              : lead.status === 'bounced'
                              ? 'Bounced'
                              : lead.currentStep === 0
                              ? 'Pending Step 1'
                              : `Step ${lead.currentStep} Dispatched`}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">{lead.email}</div>

                        {/* If replied, show reply quote */}
                        {lead.replyText && (
                          <div className="mt-1.5 p-2 bg-emerald-50 rounded border border-emerald-100 text-[11px] text-emerald-900 italic">
                            💬 "{lead.replyText}"
                          </div>
                        )}
                      </div>

                      {/* Interactive Sandbox Buttons for this Lead */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {!isFinished && nextStep && (
                          <button
                            onClick={() => dispatchEmailForLead(lead, lead.currentStep)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-xs font-medium border border-slate-200 transition-colors"
                            title="Send the next sequence step immediately for this lead"
                          >
                            Send Step {nextStepNum}
                          </button>
                        )}

                        {lead.status !== 'replied' && lead.status !== 'bounced' && lead.currentStep > 0 && (
                          <button
                            onClick={() => handleSimulateReply(lead)}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold border border-emerald-200 transition-colors"
                            title="Simulate this lead replying to test automated sequence shutoff"
                          >
                            Simulate Reply
                          </button>
                        )}

                        {lead.status === 'pending' && (
                          <button
                            onClick={() => handleSimulateBounce(lead)}
                            className="px-2 py-1 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded text-xs border border-slate-200 transition-colors"
                            title="Simulate invalid email bounce"
                          >
                            Bounce
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Real-Time Dispatched Logs & Rendered Preview Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Dispatched Activity Log</h3>
                <p className="text-xs text-slate-500">Live outbound event stream. Click any entry to inspect email.</p>
              </div>
              <span className="text-xs font-bold text-slate-600">{emailLogs.length} events</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {emailLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No emails dispatched yet. Click "Send Next Batch" or "Start Automation" to begin outreach.
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="p-3 hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-800 group-hover:text-blue-700 truncate max-w-[180px]">
                        {log.leadName} ({log.leadCompany})
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                    </div>

                    <p className="text-xs font-medium text-slate-700 truncate mb-1">{log.subject}</p>

                    <div className="flex items-center justify-between text-[10px]">
                      <span
                        className={`px-1.5 py-0.2 rounded font-medium ${
                          log.status === 'replied'
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : log.status === 'bounced'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.status === 'replied' ? 'Reply Logged' : log.status === 'bounced' ? 'Bounced' : `Step ${log.stepNumber} Sent`}
                      </span>

                      <span className="text-slate-400 flex items-center space-x-1">
                        <Eye className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                        <span>Inspect preview</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rendered Email Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Dispatched Email Record</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-3 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="text-slate-800 font-semibold">{selectedLog.leadName} &lt;{selectedLog.leadEmail}&gt;</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sequence Stage:</span>
                <span className="text-slate-800">Step {selectedLog.stepNumber} ({selectedLog.stepType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dispatched At:</span>
                <span className="text-slate-800">{selectedLog.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Engine Mode:</span>
                <span className="text-slate-800">
                  {selectedLog.isSimulated ? 'Sandbox Test Dispatch' : 'Live Outbound SMTP'}
                </span>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Subject</label>
              <div className="text-xs font-bold text-slate-900 mt-0.5 p-2 bg-slate-100 rounded border border-slate-200">
                {selectedLog.subject}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Message Body</label>
              <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto text-slate-800 mt-0.5">
                {selectedLog.bodyPreview}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
