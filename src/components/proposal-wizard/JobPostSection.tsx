import React from 'react';

interface JobPostSectionProps {
  darkMode: boolean;
  jobPost: string;
  setJobPost: (value: string) => void;
}

export default function JobPostSection({ darkMode, jobPost, setJobPost }: JobPostSectionProps) {

  return (
    <div className="flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex-shrink-0">
        <h3 className={`font-inter font-semibold text-base sm:text-lg ${
          darkMode ? 'text-white' : 'text-zinc-950'
        }`}>Job Post</h3>
      </div>

      {/* Content */}
      <div className="mt-2 min-h-0">
        <div className={`rounded-[10px] border p-3 sm:p-4 min-h-[150px] max-h-60 ${
          darkMode
            ? 'bg-[#2d2d2d] border-[#4a4a4a]'
            : 'bg-white border-[#ddd6ff]'
        }`}>
          <textarea
            value={jobPost || ''}
            onChange={(e) => setJobPost && setJobPost(e.target.value)}
            className={`w-full h-full min-h-[120px] font-inter font-normal text-xs sm:text-sm leading-[22px] resize-none outline-none bg-transparent ${
              darkMode ? 'text-[#a0a0a0] placeholder:text-[#666666]' : 'text-zinc-500 placeholder:text-zinc-400'
            }`}
            placeholder="Enter the full job post and any relevant detail..."
          />
        </div>
      </div>
    </div>
  );
}
