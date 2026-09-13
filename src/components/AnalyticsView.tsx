import React from 'react';
import {
  BarChart3,
  TrendingUp,
  MailCheck,
  MessageSquare,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  Award,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { Lead, EmailLogEntry, SequenceStep } from '../types';

interface AnalyticsViewProps {
  leads: Lead[];
  steps: SequenceStep[];
  emailLogs: EmailLogEntry[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ leads, steps, emailLogs }) => {
  const totalLeads = leads.length;
  const contactedLeads = leads.filter((l) => l.currentStep > 0).length;
  const totalSent = emailLogs.filter((l) => l.status !== 'bounced').length;
  const repliedCount = leads.filter((l) => l.status === 'replied').length;
  const bouncedCount = leads.filter((l) => l.status === 'bounced').length;

  // Calculated rates
  const replyRate = contactedLeads > 0 ? Math.round((repliedCount / contactedLeads) * 100) : 0;
  const bounceRate = totalSent > 0 ? Math.round((bouncedCount / totalSent) * 100) : 0;
  const simulatedOpenRate = totalSent > 0 ? Math.min(100, Math.round(58 + repliedCount * 4)) : 0;

  // Step-by-step breakdown
  const stepBreakdown = steps.map((step) => {
    const sentForStep = emailLogs.filter((l) => l.stepNumber === step.stepNumber && l.status !== 'bounced').length;
    // Step replies attributed
    const repliesAtStep = leads.filter((l) => l.currentStep === step.stepNumber && l.status === 'replied').length;
    const stepReplyRate = sentForStep > 0 ? Math.round((repliesAtStep / sentForStep) * 100) : 0;

    return {
      stepNumber: step.stepNumber,
      title: step.stepNumber === 1 ? 'Step 1: Initial Pitch' : `Step ${step.stepNumber}: Follow-Up #${step.stepNumber - 1}`,
      delayDays: step.delayDays,
      sentCount: sentForStep,
      repliedCount: repliesAtStep,
      replyRate: stepReplyRate,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacted */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Prospects Contacted</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {contactedLeads} <span className="text-xs font-normal text-slate-400">/ {totalLeads}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0}% of list contacted
          </div>
        </div>

        {/* Reply Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Reply Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700">{replyRate}%</div>
          <div className="mt-2 text-xs text-emerald-600 font-medium flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{repliedCount} qualified responses received</span>
          </div>
        </div>

        {/* Estimated Open Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Open Rate</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MailCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalSent > 0 ? `${simulatedOpenRate}%` : '—'}</div>
          <div className="mt-2 text-xs text-slate-500">Industry B2B cold benchmark: ~25-35%</div>
        </div>

        {/* Bounce Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">Bounce Rate</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{bounceRate}%</div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Target is &lt; 2% for domain health</span>
          </div>
        </div>
      </div>

      {/* Sequence Conversion Funnel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Sequence Conversion Funnel</h3>
            <p className="text-xs text-slate-500">
              See how each automated follow-up step drives additional prospect replies over time.
            </p>
          </div>
          <div className="flex items-center space-x-1 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>Over 65% of cold email meetings come from follow-ups</span>
          </div>
        </div>

        <div className="space-y-4">
          {stepBreakdown.map((item, idx) => {
            const maxSent = Math.max(1, ...stepBreakdown.map((s) => s.sentCount));
            const percentage = Math.round((item.sentCount / maxSent) * 100);

            return (
              <div key={item.stepNumber} className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center">
                      {item.stepNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({item.stepNumber === 1 ? 'Initial pitch' : `+${item.delayDays} days delay`})
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-slate-600">
                      Dispatched: <strong className="text-slate-900">{item.sentCount}</strong>
                    </span>
                    <span className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold">
                      {item.repliedCount} Replies ({item.replyRate}%)
                    </span>
                  </div>
                </div>

                {/* Funnel Visual Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(6, percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deliverability & Warm-up Health Best Practices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h4 className="font-semibold text-slate-900 text-sm">Inbox Placement & Domain Guard</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Cold outreach requires strict deliverability hygiene to avoid Google and Microsoft promotional/spam tabs.
          </p>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>SPF, DKIM, and DMARC:</strong> Ensure your sending domain records are properly authenticated.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Spintax Variations:</strong> Use <code>{'{Hi|Hey|Hello}'}</code> to avoid sending identical hashes to identical MX servers.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Warm-up Cadence:</strong> Keep volume under 40-50 cold emails per sending mailbox per day.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <h4 className="font-semibold text-slate-900 text-sm">Automated Sequence Rules</h4>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            How our automated sequence engine governs subsequent follow-up dispatches.
          </p>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <span>
                <strong>Instant Stop on Reply:</strong> When a recipient responds, the sequence stops immediately.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <span>
                <strong>Delay Window:</strong> Step 2 sends after 3 days; Step 3 sends after 4 days of inactivity.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <span>
                <strong>Break-up Finale:</strong> Step 4 respectfully closes the loop without annoying prospects.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
