import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Tag,
  Wand2,
  ChevronDown,
  Info,
  RefreshCw,
} from 'lucide-react';
import { SequenceStep, Lead } from '../types';
import { renderTemplate, analyzeSpamAndDeliverability } from '../utils/templateEngine';

interface CampaignSequenceEditorProps {
  steps: SequenceStep[];
  onUpdateSteps: (steps: SequenceStep[]) => void;
  leads: Lead[];
  onOpenAiModal: () => void;
}

const AVAILABLE_VARIABLES = [
  { tag: '{{firstName}}', label: 'First Name', example: 'Sarah' },
  { tag: '{{lastName}}', label: 'Last Name', example: 'Jenkins' },
  { tag: '{{company}}', label: 'Company', example: 'HyperFlow' },
  { tag: '{{jobTitle}}', label: 'Job Title', example: 'VP of Growth' },
  { tag: '{{industry}}', label: 'Industry', example: 'B2B SaaS' },
  { tag: '{{city}}', label: 'City', example: 'San Francisco' },
  { tag: '{{customIcebreaker}}', label: 'AI Icebreaker', example: 'Loved your keynote on developer velocity...' },
  { tag: '{{painPoint}}', label: 'Pain Point', example: 'trial conversion dropoff' },
];

export const CampaignSequenceEditor: React.FC<CampaignSequenceEditorProps> = ({
  steps,
  onUpdateSteps,
  leads,
  onOpenAiModal,
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string>(steps[0]?.id || '');
  const [previewLeadId, setPreviewLeadId] = useState<string>(leads[0]?.id || '');
  const [isPolishing, setIsPolishing] = useState<boolean>(false);
  const [aiSubjectModalOpen, setAiSubjectModalOpen] = useState<boolean>(false);
  const [subjectSuggestions, setSubjectSuggestions] = useState<
    Array<{ subject: string; estimatedOpenRate: string; whyItWorks: string }>
  >([]);
  const [loadingSubjectAi, setLoadingSubjectAi] = useState<boolean>(false);

  const activeStepIndex = steps.findIndex((s) => s.id === selectedStepId);
  const currentStep = steps[activeStepIndex] || steps[0];
  const previewLead = leads.find((l) => l.id === previewLeadId) || leads[0] || ({} as Lead);

  const spamAnalysis = currentStep
    ? analyzeSpamAndDeliverability(currentStep.subject, currentStep.body)
    : { score: 100, rating: 'excellent', flags: [], wordCount: 0, readingTimeSeconds: 0, personalizedVariablesCount: 0, suggestions: [] };

  const handleUpdateCurrentStep = (updatedFields: Partial<SequenceStep>) => {
    const newSteps = steps.map((step) => {
      if (step.id === currentStep.id) {
        return { ...step, ...updatedFields };
      }
      return step;
    });
    onUpdateSteps(newSteps);
  };

  const handleInsertVariable = (tag: string) => {
    if (!currentStep) return;
    const newBody = currentStep.body + (currentStep.body.endsWith(' ') || currentStep.body.endsWith('\n') ? '' : ' ') + tag;
    handleUpdateCurrentStep({ body: newBody });
  };

  const handleInsertSpintax = () => {
    if (!currentStep) return;
    const spintaxSample = '{Hi|Hey|Hello} ';
    handleUpdateCurrentStep({ body: spintaxSample + currentStep.body });
  };

  const handleAddFollowupStep = () => {
    const nextNumber = steps.length + 1;
    const lastDelay = steps.length > 0 ? steps[steps.length - 1].delayDays + 3 : 3;
    const newStep: SequenceStep = {
      id: `step-${Date.now()}`,
      stepNumber: nextNumber,
      type: nextNumber === 4 ? 'breakup' : `followup_${nextNumber - 1}` as SequenceStep['type'],
      delayDays: 3,
      subject: nextNumber === 4 ? 'Permission to close file? ({{company}})' : `Re: ${steps[0]?.subject || 'Quick question'}`,
      body: nextNumber === 4
        ? `Hi {{firstName}},\n\nSince I haven't heard back, I'm assuming {{company}} has this covered for now.\n\nI'll stop reaching out. Feel free to connect in the future if priorities shift.\n\nWishing you and {{company}} the best!`
        : `Hey {{firstName}},\n\nWanted to quickly follow up on my previous note regarding {{company}}'s outbound workflow.\n\nAre you free for a brief 4-minute glance at our teardown this Thursday?`,
      condition: 'if_no_reply',
      isActive: true,
    };
    const updated = [...steps, newStep];
    onUpdateSteps(updated);
    setSelectedStepId(newStep.id);
  };

  const handleDeleteStep = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (steps.length <= 1) {
      alert('A campaign sequence must have at least 1 step.');
      return;
    }
    const updated = steps
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    onUpdateSteps(updated);
    if (selectedStepId === id) {
      setSelectedStepId(updated[0]?.id || '');
    }
  };

  const handlePolishEmail = async (goal: 'shorten' | 'conversational' | 'stronger_cta' | 'fix_spam') => {
    if (!currentStep || isPolishing) return;
    setIsPolishing(true);
    try {
      const res = await fetch('/api/ai/polish-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentStep.body, goal }),
      });
      const data = await res.json();
      if (data.polishedText) {
        handleUpdateCurrentStep({ body: data.polishedText });
      }
    } catch (err) {
      console.error('Failed to polish email:', err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleGenerateSubjectAi = async () => {
    setLoadingSubjectAi(true);
    setAiSubjectModalOpen(true);
    try {
      const res = await fetch('/api/ai/optimize-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetAudience: previewLead.jobTitle || 'B2B leaders',
          valueProposition: currentStep.body.slice(0, 150),
          currentSubject: currentStep.subject,
        }),
      });
      const data = await res.json();
      setSubjectSuggestions(data.subjectLines || []);
    } catch (err) {
      console.error('Failed to optimize subject line:', err);
    } finally {
      setLoadingSubjectAi(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Sequence Flow Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Sequence Architecture & Cadence</h2>
            <p className="text-xs text-slate-500">
              Automated multi-step outreach. Follow-ups send automatically only if no reply is detected from the prospect.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAiModal}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Regenerate Sequence with AI</span>
            </button>
            <button
              id="btn-add-step"
              onClick={handleAddFollowupStep}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Follow-up Step</span>
            </button>
          </div>
        </div>

        {/* Steps Timeline Horizontal Strip */}
        <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto pb-2">
          {steps.map((step, idx) => {
            const isSelected = step.id === currentStep?.id;
            return (
              <React.Fragment key={step.id}>
                <div
                  onClick={() => setSelectedStepId(step.id)}
                  className={`flex-shrink-0 cursor-pointer rounded-xl border p-3 min-w-[200px] sm:min-w-[220px] transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {idx === 0 ? 'Step 1: Initial Pitch' : `Step ${idx + 1}: Follow-Up #${idx}`}
                    </span>
                    {steps.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteStep(step.id, e)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded transition-colors"
                        title="Delete Step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-800 truncate mb-2">
                    {step.subject || 'No subject line'}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{idx === 0 ? 'Immediate send' : `+${step.delayDays}d if no reply`}</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        step.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="flex flex-col items-center justify-center flex-shrink-0 text-slate-400 px-1">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Wait {steps[idx + 1].delayDays}d
                    </span>
                    <span className="w-6 h-0.5 bg-slate-200 mt-1"></span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Editor: Left = Step Form, Right = Deliverability & Live Contact Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Step Content Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {activeStepIndex === 0
                    ? 'Step 1 — Initial Outreach Cold Email'
                    : `Step ${activeStepIndex + 1} — Automated Follow-Up #${activeStepIndex}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Craft your message using dynamic personalized tags and spintax variations.
                </p>
              </div>

              {/* Delay Selector (only for follow-up steps) */}
              {activeStepIndex > 0 && (
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <label className="text-xs text-slate-600 font-medium">Wait</label>
                  <select
                    value={currentStep.delayDays}
                    onChange={(e) => handleUpdateCurrentStep({ delayDays: Number(e.target.value) })}
                    className="text-xs font-semibold bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={4}>4 days</option>
                    <option value={5}>5 days</option>
                    <option value={7}>7 days</option>
                  </select>
                  <span className="text-xs text-slate-500">if no reply</span>
                </div>
              )}
            </div>

            {/* Subject Line */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1">
                  <span>Subject Line</span>
                  <span className="text-slate-400 font-normal">(Supports Spintax & Tags)</span>
                </label>
                <button
                  onClick={handleGenerateSubjectAi}
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>AI Subject Ideas</span>
                </button>
              </div>
              <input
                id="input-step-subject"
                type="text"
                value={currentStep.subject}
                onChange={(e) => handleUpdateCurrentStep({ subject: e.target.value })}
                placeholder="e.g. {Quick question for {{company}}|Scaling {{company}}'s outbound}"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
              />
            </div>

            {/* Merge Tag Chips */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600 flex items-center space-x-1">
                  <Tag className="w-3 h-3 text-slate-400" />
                  <span>Click to insert personalization variable:</span>
                </span>
                <button
                  onClick={handleInsertSpintax}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100"
                  title="Spintax selects random greetings so every email isn't identical"
                >
                  + Add Spintax {'{Hi|Hey|Hello}'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    onClick={() => handleInsertVariable(v.tag)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md border border-slate-200 transition-colors font-mono"
                    title={`Example: ${v.example}`}
                  >
                    {v.tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Body */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">Email Message Body</label>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400">
                    {spamAnalysis.wordCount} words (~{spamAnalysis.readingTimeSeconds}s read)
                  </span>
                </div>
              </div>
              <textarea
                id="textarea-step-body"
                rows={9}
                value={currentStep.body}
                onChange={(e) => handleUpdateCurrentStep({ body: e.target.value })}
                placeholder="Write your email pitch with variables like {{firstName}} and {{company}}..."
                className="w-full text-sm p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono leading-relaxed"
              />
            </div>

            {/* Quick AI Polish Actions */}
            <div className="border-t border-slate-100 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>AI Polish Assistant:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    disabled={isPolishing}
                    onClick={() => handlePolishEmail('shorten')}
                    className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                  >
                    {isPolishing ? 'Polishing...' : 'Shorten (<90 words)'}
                  </button>
                  <button
                    disabled={isPolishing}
                    onClick={() => handlePolishEmail('conversational')}
                    className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                  >
                    Sound More Human
                  </button>
                  <button
                    disabled={isPolishing}
                    onClick={() => handlePolishEmail('stronger_cta')}
                    className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                  >
                    Low-Friction CTA
                  </button>
                  <button
                    disabled={isPolishing}
                    onClick={() => handlePolishEmail('fix_spam')}
                    className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
                  >
                    Fix Spam Triggers
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Deliverability & Live Prospect Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Deliverability & Spam Analysis Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    spamAnalysis.score >= 90
                      ? 'bg-emerald-100 text-emerald-800'
                      : spamAnalysis.score >= 75
                      ? 'bg-blue-100 text-blue-800'
                      : spamAnalysis.score >= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {spamAnalysis.score}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Deliverability Health Score</h4>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {spamAnalysis.rating.replace('_', ' ')} inbox rating
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {spamAnalysis.personalizedVariablesCount} tags detected
              </span>
            </div>

            {/* Spam score flags or congratulations */}
            {spamAnalysis.flags.length > 0 ? (
              <div className="space-y-1.5 mb-2.5">
                {spamAnalysis.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-1.5 text-xs bg-amber-50/70 border border-amber-200/70 text-amber-900 p-2 rounded-lg"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{flag.word}: </span>
                      <span>{flag.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-lg mb-2.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Zero spam trigger words detected! Subject and copy look safe for primary inbox placement.</span>
              </div>
            )}

            {/* Deliverability suggestions */}
            {spamAnalysis.suggestions.length > 0 && (
              <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-700 flex items-center space-x-1">
                  <Info className="w-3 h-3 text-slate-500" />
                  <span>Outreach Tip:</span>
                </div>
                {spamAnalysis.suggestions.map((sug, idx) => (
                  <p key={idx}>• {sug}</p>
                ))}
              </div>
            )}
          </div>

          {/* Live Contact Preview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900">Live Recipient Preview</h4>
              </div>

              {/* Recipient Switcher Dropdown */}
              {leads.length > 0 && (
                <div className="flex items-center space-x-1">
                  <label className="text-[11px] text-slate-500">Preview as:</label>
                  <select
                    value={previewLeadId}
                    onChange={(e) => setPreviewLeadId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 font-medium focus:outline-hidden"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.firstName} {l.lastName} ({l.company})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Mock Email Client Frame */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 space-y-1 text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">To:</span>
                  <span className="text-slate-800 font-mono">
                    {previewLead.firstName ? `${previewLead.firstName} ${previewLead.lastName} <${previewLead.email}>` : 'recipient@example.com'}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="font-medium text-slate-500">Subject:</span>
                  <span className="text-slate-900 font-semibold truncate ml-2 text-right">
                    {renderTemplate(currentStep.subject, previewLead)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-white min-h-[160px] text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed selection:bg-blue-100">
                {renderTemplate(currentStep.body, previewLead)}
              </div>

              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Personalized with {previewLead.company || 'Company'} data</span>
                <span className="text-slate-500">Status: {previewLead.status || 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Subject Line Modal */}
      {aiSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">High-Converting Subject Line Generator</h3>
              </div>
              <button
                onClick={() => setAiSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {loadingSubjectAi ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-3">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-xs">Analyzing audience and crafting curiosity-driven subject lines...</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {subjectSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      handleUpdateCurrentStep({ subject: item.subject });
                      setAiSubjectModalOpen(false);
                    }}
                    className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-700">
                        {item.subject}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {item.estimatedOpenRate} Open Rate
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.whyItWorks}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setAiSubjectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
