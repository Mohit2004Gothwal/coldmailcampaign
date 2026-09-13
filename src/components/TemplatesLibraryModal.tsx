import React, { useState } from 'react';
import { BookOpen, Check, ArrowRight, Layers, FileText } from 'lucide-react';
import { CampaignTemplate, SequenceStep } from '../types';
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates';

interface TemplatesLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: CampaignTemplate) => void;
}

export const TemplatesLibraryModal: React.FC<TemplatesLibraryModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);

  if (!isOpen) return null;

  const selectedTemplate = DEFAULT_TEMPLATES.find((t) => t.id === selectedTemplateId) || DEFAULT_TEMPLATES[0];

  const handleApply = () => {
    onApplyTemplate(selectedTemplate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Cold Outreach Campaign Formula Library</h3>
              <p className="text-xs text-slate-500">
                Battle-tested multi-step sequences optimized for deliverability and response rates.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
            ✕
          </button>
        </div>

        {/* Content Split: Left = Template Picker, Right = Sequence Inspection */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden flex-1">
          {/* Left: Template List (5 cols) */}
          <div className="md:col-span-5 space-y-2 overflow-y-auto pr-1">
            {DEFAULT_TEMPLATES.map((tmpl) => {
              const isSelected = tmpl.id === selectedTemplate.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900 mb-1">{tmpl.title}</div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{tmpl.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="capitalize">{tmpl.category.replace('_', ' ')}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{tmpl.steps.length} Steps</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Sequence Preview (7 cols) */}
          <div className="md:col-span-7 bg-slate-50/70 border border-slate-200 rounded-xl p-4 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <h4 className="text-xs font-bold text-slate-900">{selectedTemplate.title}</h4>
                <p className="text-[11px] text-slate-500">{selectedTemplate.description}</p>
              </div>

              <div className="space-y-3">
                {selectedTemplate.steps.map((step, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">
                        {idx === 0 ? 'Step 1: Initial Pitch' : `Step ${idx + 1}: Follow-Up #${idx}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {idx === 0 ? 'Instant send' : `+${step.delayDays}d if no reply`}
                      </span>
                    </div>
                    <div className="font-medium text-slate-900 text-[11px] mb-1 font-mono">
                      Sub: {step.subject}
                    </div>
                    <p className="text-slate-600 whitespace-pre-wrap font-sans text-[11px] leading-relaxed line-clamp-4">
                      {step.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={handleApply}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Load This Template ({selectedTemplate.steps.length} Steps)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 pt-3 mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
