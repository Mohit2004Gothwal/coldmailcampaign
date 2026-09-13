import React from 'react';
import { Send, Sparkles, BookOpen, Settings, Play, Pause, ShieldCheck, MailCheck } from 'lucide-react';
import { Campaign, SmtpConfig } from '../types';

interface HeaderProps {
  campaign: Campaign;
  smtpConfig: SmtpConfig;
  isSimulatedMode: boolean;
  onOpenAiModal: () => void;
  onOpenTemplates: () => void;
  onOpenSettings: () => void;
  onToggleCampaignStatus: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  campaign,
  smtpConfig,
  isSimulatedMode,
  onOpenAiModal,
  onOpenTemplates,
  onOpenSettings,
  onToggleCampaignStatus,
}) => {
  const isRunning = campaign.status === 'running';

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Branding & Campaign Info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Send className="w-5 h-5 -rotate-12" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base tracking-tight text-white">Cold Mail Campaign Automator</h1>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                  isRunning
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                    : campaign.status === 'paused'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isRunning ? 'Running' : campaign.status === 'paused' ? 'Paused' : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-sm">
              {campaign.name} • {campaign.steps.length} Sequence Steps
            </p>
          </div>
        </div>

        {/* Mode Pill & Quick Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dispatch Mode Indicator */}
          <button
            onClick={onOpenSettings}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSimulatedMode
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/60'
                : smtpConfig.isConfigured
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60'
                : 'bg-amber-950/60 text-amber-300 border-amber-700/50 hover:bg-amber-900/60'
            }`}
            title="Click to configure SMTP & sending mode in Settings"
          >
            {isSimulatedMode ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sandbox Mode (Safe Test)</span>
              </>
            ) : smtpConfig.isConfigured ? (
              <>
                <MailCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live SMTP Connected</span>
              </>
            ) : (
              <>
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Configure SMTP</span>
              </>
            )}
          </button>

          {/* AI Generator Button */}
          <button
            id="btn-ai-assistant"
            onClick={onOpenAiModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow-blue-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Sequence Builder</span>
            <span className="md:hidden">AI</span>
          </button>

          {/* Templates Button */}
          <button
            id="btn-templates-library"
            onClick={onOpenTemplates}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Templates</span>
          </button>

          {/* Settings Button */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Settings & SMTP Configuration"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Primary Campaign Launch / Pause */}
          <button
            id="btn-toggle-campaign"
            onClick={onToggleCampaignStatus}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Sequence</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Sequence</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
