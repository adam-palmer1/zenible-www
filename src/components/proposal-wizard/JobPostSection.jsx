import React from 'react';

export default function JobPostSection({ darkMode, jobPost, setJobPost }) {

  return (
    <div className={`w-full rounded-xl border shadow-sm flex flex-col h-full max-h-72 sm:max-h-96 ${
      darkMode
        ? 'bg-[#1e1e1e] border-[#333333]'
        : 'bg-white border-neutral-200'
    }`}>
      {/* Header */}
      <div className={`p-3 sm:p-4 border-b flex-shrink-0 ${
        darkMode ? 'border-[#333333]' : 'border-neutral-200'
      }`}>
        <h3 className={`font-inter font-semibold text-base sm:text-lg ${
          darkMode ? 'text-white' : 'text-zinc-950'
        }`}>Job Post</h3>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 sm:px-4 pt-2 pb-3 sm:pb-4 min-h-0">
        <textarea
          value={jobPost || ''}
          onChange={(e) => setJobPost && setJobPost(e.target.value)}
          className={`w-full h-full min-h-[150px] font-inter font-normal text-xs sm:text-sm leading-[22px] resize-none outline-none bg-transparent ${
            darkMode ? 'text-[#a0a0a0] placeholder:text-[#666666]' : 'text-zinc-500 placeholder:text-zinc-400'
          }`}
          placeholder="Enter the full job post and any relevant detail..."
        />
      </div>
    </div>
  );
}