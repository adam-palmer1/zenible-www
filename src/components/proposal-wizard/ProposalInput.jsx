import React from 'react';

const defaultProposal = `Dear Client,

I'm excited to propose my services for your mobile app development project. With 5+ years of React Native experience, I can deliver a high-quality solution that meets your requirements.

**Project Approach:**
- Phase 1: Design & Planning (2 weeks)
- Phase 2: Development (6 weeks)
- Phase 3: Testing & Launch (1 week)

**Timeline:** 9 weeks total
**Budget:** $15,000 fixed price

I've successfully delivered similar apps for startups, including a fitness tracking app with 10K+ downloads. My expertise includes React Native, Node.js, and AWS deployment.

Looking forward to discussing this opportunity!

Best regards,
[Your Name]`;

export default function ProposalInput({ darkMode, proposal, setProposal, onAnalyze, analyzing, isPanelReady, isConnected }) {
  React.useEffect(() => {
    if (!proposal) {
      setProposal(defaultProposal);
    }
  }, []);

  return (
    <div className={`rounded-xl border border-dashed shadow-sm flex flex-col h-full ${
      darkMode
        ? 'bg-[#4c3d7a] border-[#6b5b95]'
        : 'bg-violet-50 border-[#c4b4ff]'
    }`}>
      {/* Header */}
      <div className="p-3 sm:p-4 flex-shrink-0">
        <h3 className={`font-inter font-semibold text-base sm:text-lg ${
          darkMode ? 'text-white' : 'text-zinc-950'
        }`}>Your Proposal</h3>
        <p className={`font-inter font-normal text-xs sm:text-sm mt-0.5 ${
          darkMode ? 'text-[#c4b4ff]' : 'text-zinc-500'
        }`}>
          Paste your job proposal below for comprehensive AI analysis
        </p>
      </div>

      {/* Textarea */}
      <div className="flex-1 px-3 sm:px-4 min-h-0">
        <div className={`h-full rounded-[10px] border p-3 sm:p-4 min-h-[200px] ${
          darkMode
            ? 'bg-[#2d2d2d] border-[#4a4a4a]'
            : 'bg-white border-[#ddd6ff]'
        }`}>
          <textarea
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            className={`w-full h-full font-inter font-normal text-xs sm:text-sm leading-[22px] resize-none outline-none bg-transparent whitespace-pre-wrap ${
              darkMode ? 'text-white placeholder:text-[#888888]' : 'text-zinc-950 placeholder:text-zinc-500'
            }`}
            placeholder="Paste your proposal here..."
            spellCheck="true"
          />
        </div>
      </div>

      {/* Analyze Button */}
      <div className="p-3 sm:p-4 flex justify-end flex-shrink-0">
        <button
          onClick={() => {
            console.log('[ProposalInput] Analyze button clicked:', {
              hasProposal: !!proposal,
              analyzing,
              isPanelReady,
              isConnected,
              disabled: !proposal || analyzing || !isPanelReady || !isConnected,
              disabledReasons: {
                noProposal: !proposal,
                analyzing,
                panelNotReady: !isPanelReady,
                notConnected: !isConnected
              }
            });
            if (onAnalyze) {
              onAnalyze();
            } else {
              console.error('[ProposalInput] onAnalyze callback is not defined!');
            }
          }}
          disabled={!proposal || analyzing || !isPanelReady || !isConnected}
          className={`px-4 sm:px-6 py-2.5 sm:py-3 bg-zenible-primary text-white rounded-xl font-inter font-medium text-sm sm:text-base transition-all ${
            (!proposal || analyzing || !isPanelReady || !isConnected) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-600'
          }`}
          title={!isConnected ? 'Connecting...' : !isPanelReady ? 'Initializing...' : ''}
        >
          {analyzing ? 'Analyzing...' : !isConnected ? 'Connecting...' : !isPanelReady ? 'Initializing...' : 'Analyze Proposal'}
        </button>
      </div>
    </div>
  );
}