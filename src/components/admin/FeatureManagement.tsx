import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DisplayFeaturesManager from './DisplayFeaturesManager';
import SystemFeaturesManager from './SystemFeaturesManager';
import PlanFeatureAssignment from './PlanFeatureAssignment';

interface Tab {
  id: string;
  label: string;
}

export default function FeatureManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const [activeTab, setActiveTab] = useState<string>('display');

  const tabs: Tab[] = [
    { id: 'display', label: 'Display Features' },
    { id: 'system', label: 'System Features' },
    { id: 'assignment', label: 'Plan Assignment' },
  ];

  return (
    <div className={`flex flex-col h-full overflow-hidden ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      {/* Page Header */}
      <div className={`flex-shrink-0 px-4 sm:px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
        <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Feature Management
        </h1>
        <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
          Manage display features, system features, and plan assignments
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`flex-shrink-0 px-4 sm:px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-sidebar' : 'border-neutral-200 bg-white'}`}>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? darkMode
                    ? 'bg-zenible-dark-tab-bg text-zenible-primary border border-zenible-primary'
                    : 'bg-zenible-tab-bg text-zenible-primary border border-zenible-primary'
                  : darkMode
                  ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text hover:bg-zenible-dark-card'
                  : 'text-zinc-600 hover:text-zinc-950 hover:bg-gray-100'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Tab Content */}
        <div className="p-4 sm:p-6">
        {activeTab === 'display' && (
          <div>
            <div className="mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Display Features
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                Manage marketing and UI features shown on pricing pages. These features help users understand what's included in each plan.
              </p>
            </div>
            <DisplayFeaturesManager darkMode={darkMode} />
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <div className="mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                System Features
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                Define backend functionality and technical capabilities. These features control actual system behavior and limits.
              </p>
            </div>
            <SystemFeaturesManager darkMode={darkMode} />
          </div>
        )}

        {activeTab === 'assignment' && (
          <div>
            <div className="mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Plan Feature Assignment
              </h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
                Assign features to subscription plans. Configure display features, system features, and character access for each plan.
              </p>
            </div>
            <PlanFeatureAssignment darkMode={darkMode} />
          </div>
        )}
      </div>

        {/* Help Section */}
        <div className={`mx-4 sm:mx-6 mb-6 p-4 rounded-lg border ${darkMode ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
          <div className="flex items-start gap-3">
            <svg className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className={`text-sm ${darkMode ? 'text-purple-200' : 'text-purple-900'}`}>
              <p className={`font-medium mb-1 ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>Quick Tips:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Display Features:</strong> Marketing features shown to users (e.g., "Priority Support", "API Access")</li>
                <li><strong>System Features:</strong> Technical capabilities that control backend behavior (Boolean, Limit, or List types)</li>
                <li><strong>Plan Assignment:</strong> Bulk configure all features for a specific plan, including character access limits</li>
                <li><strong>Character Access:</strong> Set message/token limits and priority levels per AI character per plan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
