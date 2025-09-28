import React, { useState, useEffect } from 'react';

export default function JobPostSection({ darkMode, onJobPostChange }) {
  const [jobPost, setJobPost] = useState(`React Native Mobile App Developer Needed

We're looking for an experienced React Native developer to build a cross-platform mobile app for our fitness startup.

Project Requirements:
- iOS and Android compatibility
- User authentication and profile management
- Integration with fitness tracking APIs
- Real-time workout tracking
- Social features for sharing progress
- Push notifications
- Clean, modern UI/UX design

Required Skills:
- 3+ years React Native experience
- Strong JavaScript/TypeScript skills
- Experience with Redux or MobX
- RESTful API integration
- App Store & Google Play deployment experience

Budget: $10,000 - $15,000
Timeline: 2-3 months
Type: Fixed price project`);

  // Notify parent component when job post changes
  useEffect(() => {
    if (onJobPostChange) {
      onJobPostChange(jobPost);
    }
  }, [jobPost, onJobPostChange]);

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
          value={jobPost}
          onChange={(e) => setJobPost(e.target.value)}
          className={`w-full h-full min-h-[150px] font-inter font-normal text-xs sm:text-sm leading-[22px] resize-none outline-none bg-transparent ${
            darkMode ? 'text-[#a0a0a0] placeholder:text-[#666666]' : 'text-zinc-500 placeholder:text-zinc-400'
          }`}
          placeholder="Paste the job post here..."
        />
      </div>
    </div>
  );
}