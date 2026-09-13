import React, { useState } from 'react';
import { Sparkles, RefreshCw, Check, ArrowRight, Wand2, HelpCircle } from 'lucide-react';
import { SequenceStep } from '../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedSequence: (steps: SequenceStep[], campaignName?: string) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedSequence,
}) => {
  const [productDescription, setProductDescription] = useState(
    'AI-powered workflow automation software that slashes manual CRM data entry by 80%'
  );
  const [targetAudience, setTargetAudience] = useState('VPs of Sales, Heads of Revenue Operations, Growth Directors');
  const [valueProposition, setValueProposition] = useState(
    'Save SDRs 12 hours a week and increase outbound meeting booking rates by 35%'
  );
  const [tone, setTone] = useState('direct, conversational, peer-to-peer');
  const [stepCount, setStepCount] = useState<number>(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    campaignName?: string;
    steps: Array<{
      stepNumber: number;
      type: string;
      delayDays: number;
      subject: string;
      body: string;
      rationale?: string;
    }>;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedResult(null);
    try {
      const res = await fetch('/api/ai/generate-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription,
          targetAudience,
          valueProposition,
          tone,
          stepCount,
        }),
      });

      const data = await res.json();
      if (data.steps) {
        setGeneratedResult(data);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Failed to generate sequence:', err);
      alert('Failed to connect to AI sequence generator.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedResult || !generatedResult.steps) return;

    const formattedSteps: SequenceStep[] = generatedResult.steps.map((s, idx) => ({
      id: `ai-step-${Date.now()}-${idx}`,
      stepNumber: s.stepNumber || idx + 1,
      type: idx === 0 ? 'initial' : idx === generatedResult.steps.length - 1 ? 'breakup' : (`followup_${idx}` as SequenceStep['type']),
      delayDays: s.delayDays !== undefined ? s.delayDays : idx === 0 ? 0 : 3,
      subject: s.subject,
      body: s.body,
      condition: 'if_no_reply',
      isActive: true,
    }));

    onApplyGeneratedSequence(formattedSteps, generatedResult.campaignName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI Cold Outreach Sequence Architect</h3>
              <p className="text-xs text-slate-500">
                Powered by Gemini 3.8-Flash. Generates conversion-tuned multi-step email cadences.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Body Area */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {!generatedResult ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">What are you offering?</label>
                <textarea
                  rows={2}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="e.g. B2B customer onboarding tool that automates product tours"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Who is your ideal prospect?</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. Chief Product Officers, VP Engineering at mid-market SaaS"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Core Value Proposition & Quantified ROI</label>
                <input
                  type="text"
                  value={valueProposition}
                  onChange={(e) => setValueProposition(e.target.value)}
                  placeholder="e.g. Cut churn by 28% without writing any custom onboarding code"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Tone & Personality</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 mt-1 bg-white"
                  >
                    <option value="direct, conversational, peer-to-peer">Direct, Peer-to-Peer (Recommended)</option>
                    <option value="consultative and insight-driven">Consultative & Data-Driven</option>
                    <option value="brief and punchy under 60 words">Ultra-Brief (&lt; 60 words)</option>
                    <option value="polite and respectful">Polite & Thoughtful</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Sequence Depth</label>
                  <select
                    value={stepCount}
                    onChange={(e) => setStepCount(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 mt-1 bg-white"
                  >
                    <option value={3}>3 Steps (Initial + Follow-up + Breakup)</option>
                    <option value={4}>4 Steps (Initial + Follow-up 1 + Case Study + Breakup)</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-900">Sequence Generated: </span>
                  <span className="text-xs text-blue-800">{generatedResult.campaignName || 'B2B Outbound Campaign'}</span>
                </div>
                <button
                  onClick={() => setGeneratedResult(null)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Adjust Inputs
                </button>
              </div>

              <div className="space-y-3">
                {generatedResult.steps.map((step, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">
                        {idx === 0 ? 'Step 1: Initial Cold Pitch' : `Step ${idx + 1}: Follow-Up #${idx}`}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium bg-slate-200 px-2 py-0.5 rounded-full">
                        {idx === 0 ? 'Send immediately' : `Wait ${step.delayDays} days`}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 mb-1.5 font-mono text-[11px]">
                      Subject: {step.subject}
                    </div>
                    <div className="text-slate-700 whitespace-pre-wrap font-sans text-xs bg-white p-2.5 rounded-md border border-slate-200/80 leading-relaxed">
                      {step.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
          >
            Cancel
          </button>

          {!generatedResult ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Sequence...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Generate Sequence</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApply}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Sequence to Campaign</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
