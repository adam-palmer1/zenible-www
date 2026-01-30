import React from 'react';

export default function HeadlineInput({ darkMode, headline, setHeadline, onAnalyze, analyzing, isPanelReady, isConnected }) {

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
        }`}>Your Headline</h3>
        <p className={`font-inter font-normal text-xs sm:text-sm mt-0.5 ${
          darkMode ? 'text-[#c4b4ff]' : 'text-zinc-500'
        }`}>
          Paste your headline text below for analysis, or leave blank to generate headline suggestions
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
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={`w-full h-full font-inter font-normal text-xs sm:text-sm leading-[22px] resize-none outline-none bg-transparent whitespace-pre-wrap ${
              darkMode ? 'text-white placeholder:text-[#888888]' : 'text-zinc-950 placeholder:text-zinc-500'
            }`}
            placeholder="Enter your headline here for analysis, or leave blank to generate headline suggestions."
            spellCheck="true"
          />
        </div>
      </div>

      {/* Analyze Button */}
      <div className="p-3 sm:p-4 flex justify-end flex-shrink-0">
        <button
          onClick={() => {
            if (onAnalyze) {
              onAnalyze();
            }
          }}
          disabled={analyzing || !isPanelReady || !isConnected}
          className={`px-4 sm:px-6 py-2.5 sm:py-3 bg-zenible-primary text-white rounded-xl font-inter font-medium text-sm sm:text-base transition-all ${
            (analyzing || !isPanelReady || !isConnected) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-600'
          }`}
          title={!isConnected ? 'Connecting...' : !isPanelReady ? 'Initializing...' : ''}
        >
          {analyzing ? (headline ? 'Analyzing...' : 'Generating...') : !isConnected ? 'Connecting...' : !isPanelReady ? 'Initializing...' : (headline ? 'Analyze Headline' : 'Generate Headline')}
        </button>
      </div>
    </div>
  );
}
