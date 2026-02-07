import React from 'react';

interface ProfileInputProps {
  darkMode: boolean;
  profile: string;
  setProfile: (value: string) => void;
  profileUrl: string;
  setProfileUrl: (value: string) => void;
  onAnalyze: () => void;
  analyzing: boolean;
  isPanelReady: boolean;
  isConnected: boolean;
}

export default function ProfileInput({ darkMode, profile, setProfile, profileUrl, setProfileUrl, onAnalyze, analyzing, isPanelReady, isConnected }: ProfileInputProps) {

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
        }`}>Your Profile</h3>
        <p className={`font-inter font-normal text-xs sm:text-sm mt-0.5 ${
          darkMode ? 'text-[#c4b4ff]' : 'text-zinc-500'
        }`}>
          Paste your profile text below for analysis, or leave blank to generate profile suggestions
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
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className={`w-full h-full font-inter font-normal text-xs sm:text-sm leading-[22px] resize-none outline-none bg-transparent whitespace-pre-wrap ${
              darkMode ? 'text-white placeholder:text-[#888888]' : 'text-zinc-950 placeholder:text-zinc-500'
            }`}
            placeholder="Enter your profile text here for analysis, or leave blank to generate profile suggestions."
            spellCheck={true}
          />
        </div>
      </div>

      {/* URL Input (Disabled) */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <label className={`text-xs font-medium ${darkMode ? 'text-[#c4b4ff]' : 'text-zinc-500'}`}>
          Profile URL (Coming Soon)
        </label>
        <input
          type="url"
          disabled
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          placeholder="https://linkedin.com/in/yourprofile"
          className={`w-full mt-1 px-3 py-2 rounded-lg border text-xs sm:text-sm opacity-50 cursor-not-allowed ${
            darkMode ? 'bg-[#2d2d2d] border-[#4a4a4a] text-white placeholder:text-[#888888]' : 'bg-white border-[#ddd6ff] text-zinc-950 placeholder:text-zinc-500'
          }`}
          title="URL input coming soon"
        />
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
          {analyzing ? (profile ? 'Analyzing...' : 'Generating...') : !isConnected ? 'Connecting...' : !isPanelReady ? 'Initializing...' : (profile ? 'Analyze Profile' : 'Generate Profile')}
        </button>
      </div>
    </div>
  );
}
