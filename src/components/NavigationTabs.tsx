import React from 'react';
import { GitCommit, Users, Radio, BarChart3 } from 'lucide-react';

export type ActiveTab = 'sequence' | 'prospects' | 'execution' | 'analytics';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  leadCount: number;
  inSequenceCount: number;
  emailLogCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab,
  leadCount,
  inSequenceCount,
  emailLogCount,
}) => {
  const tabs = [
    {
      id: 'sequence' as ActiveTab,
      label: 'Sequence & Templates',
      icon: GitCommit,
      badge: null,
    },
    {
      id: 'prospects' as ActiveTab,
      label: 'Prospects & Leads',
      icon: Users,
      badge: leadCount,
    },
    {
      id: 'execution' as ActiveTab,
      label: 'Queue & Live Logs',
      icon: Radio,
      badge: inSequenceCount > 0 ? `${inSequenceCount} active` : emailLogCount > 0 ? `${emailLogCount} sent` : null,
      badgeHighlight: inSequenceCount > 0,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Performance & Funnel',
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 py-2.5 px-3.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span
                    className={`ml-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      tab.badgeHighlight
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : isActive
                        ? 'bg-blue-200/70 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
