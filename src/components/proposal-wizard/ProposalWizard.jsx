import React, { useState } from 'react';
import ZenibleSidebar from '../zenible-dashboard/ZenibleSidebar';
import PlatformSelector from './PlatformSelector';
import JobPostSection from './JobPostSection';
import ProposalInput from './ProposalInput';
import AIFeedbackSection from './AIFeedbackSection';
import { usePreferences } from '../../contexts/PreferencesContext';

export default function ProposalWizard() {
  const { darkMode, toggleDarkMode } = usePreferences();
  const [selectedPlatform, setSelectedPlatform] = useState('upwork');
  const [proposal, setProposal] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAnalyze = () => {
    setAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setFeedback({
        score: 85,
        strengths: [
          'Clear project structure and phases',
          'Professional tone and presentation',
          'Relevant experience highlighted'
        ],
        improvements: [
          'Add more specific deliverables per phase',
          'Include client testimonials or case studies',
          'Emphasize unique value proposition earlier'
        ]
      });
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div className={`flex h-screen font-inter ${darkMode ? 'bg-[#0d0d0d]' : 'bg-gray-50'}`}>
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg ${
          darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-black'
        } shadow-lg`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <div className={`${
        sidebarOpen ? 'block' : 'hidden'
      } lg:block fixed lg:relative z-40 h-full`}>
        <ZenibleSidebar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`h-16 border-b ${
          darkMode
            ? 'bg-[#1a1a1a] border-[#333333]'
            : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center h-full px-4 pl-16 lg:pl-4">
            <h1 className={`font-inter font-semibold text-xl sm:text-2xl ${
              darkMode ? 'text-white' : 'text-zinc-950'
            }`}>Proposal Wizard</h1>
          </div>
        </div>

        {/* Platform Selector */}
        <PlatformSelector
          darkMode={darkMode}
          selectedPlatform={selectedPlatform}
          setSelectedPlatform={setSelectedPlatform}
        />

        {/* Content Section - Responsive grid */}
        <div className="flex-1 overflow-auto">
          <div className="p-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
              {/* Left Column - Job Post & Proposal */}
              <div className="flex flex-col gap-4 w-full">
                <JobPostSection darkMode={darkMode} />
                <ProposalInput
                  darkMode={darkMode}
                  proposal={proposal}
                  setProposal={setProposal}
                  onAnalyze={handleAnalyze}
                  analyzing={analyzing}
                />
              </div>

              {/* Right Column - AI Feedback */}
              <div className="min-h-[500px] w-full">
                <AIFeedbackSection
                  darkMode={darkMode}
                  feedback={feedback}
                  analyzing={analyzing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}