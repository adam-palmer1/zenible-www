import React, { useState } from 'react';
import infoIcon from '../../assets/icons/info.svg';
import thumbsUpIcon from '../../assets/icons/thumbs-up.svg';
import thumbsDownIcon from '../../assets/icons/thumbs-down.svg';
import sendIcon from '../../assets/icons/send.svg';
import brandIcon from '../../assets/icons/brand-icon.svg';
import aiAssistantIcon from '../../assets/icons/ai-assistant.svg';

const suggestionButtons = [
  'Improve pricing strategy',
  'Enhance timeline details',
  'Strengthen value proposition',
  'Ask something else'
];

export default function AIFeedbackSection({ darkMode, feedback, analyzing }) {
  const [question, setQuestion] = useState('');

  const defaultFeedback = `Your proposal scored 85/100! Here are the key strengths and areas for improvement:

**Strengths:**
✅ Clear project structure and phases
✅ Professional tone and presentation
✅ Relevant experience highlighted

**Improvements:**
🔧 Add more specific deliverables per phase
🔧 Include client testimonials or case studies
🔧 Emphasize unique value proposition earlier

Would you like me to help you improve any specific area?`;

  return (
    <div className={`rounded-xl border shadow-sm h-full flex flex-col min-h-[500px] ${
      darkMode
        ? 'bg-[#1e1e1e] border-[#333333]'
        : 'bg-white border-neutral-200'
    }`}>
      {/* Header */}
      <div className={`p-3 sm:p-4 border-b flex items-center justify-between ${
        darkMode ? 'border-[#333333]' : 'border-neutral-200'
      }`}>
        <h3 className={`font-inter font-semibold text-base sm:text-lg ${
          darkMode ? 'text-white' : 'text-zinc-950'
        }`}>AI Analysis & Feedback</h3>
        <img src={infoIcon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-4 overflow-auto">
        {!feedback && !analyzing && (
          <div className="flex flex-col items-center justify-center h-full gap-1.5">
            {/* AI Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-violet-50 rounded-full border-[1.167px] border-[#ddd6ff] flex items-center justify-center">
              <img src={aiAssistantIcon} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Title and Description */}
            <div className="flex flex-col items-center gap-0.5 mt-4 px-4">
              <h4 className={`font-inter font-semibold text-base sm:text-lg text-center ${
                darkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                AI Assistant Ready
              </h4>
              <p className={`font-inter font-normal text-xs sm:text-sm text-center max-w-[320px] leading-relaxed ${
                darkMode ? 'text-[#a0a0a0]' : 'text-zinc-500'
              }`}>
                Paste your proposal and click "Analyze" to get personalized feedback and improvement suggestions.
              </p>
            </div>
          </div>
        )}

        {(feedback || analyzing) && (
          <div className="flex gap-1.5 sm:gap-2">
            {/* AI Avatar */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-100 rounded-full border border-[#c4b4ff] flex items-center justify-center">
                <img src={brandIcon} alt="" className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="bg-violet-50 border border-[#ddd6ff] rounded-md px-1.5 sm:px-2 py-0.5">
                <span className="font-inter font-medium text-[8px] sm:text-[10px] text-zenible-primary">Zep</span>
              </div>
            </div>

            {/* Feedback Content */}
            <div className="flex-1 flex flex-col gap-2 sm:gap-3 min-w-0">
              {/* Main Feedback */}
              <div className={`rounded-xl p-2.5 sm:p-3 ${
                darkMode ? 'bg-[#2d2d2d]' : 'bg-zinc-100'
              }`}>
                {analyzing ? (
                  <div className={`font-inter font-normal text-xs sm:text-sm ${
                    darkMode ? 'text-white' : 'text-zinc-950'
                  }`}>
                    Analyzing your proposal...
                  </div>
                ) : (
                  <pre className={`whitespace-pre-wrap font-inter font-normal text-xs sm:text-sm leading-[20px] sm:leading-[22px] break-words ${
                    darkMode ? 'text-white' : 'text-zinc-950'
                  }`}>
                    {feedback ? defaultFeedback : ''}
                  </pre>
                )}

                {feedback && !analyzing && (
                  <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 sm:gap-2">
                    {suggestionButtons.map((suggestion) => (
                      <button
                        key={suggestion}
                        className={`w-full h-8 sm:h-9 px-2 sm:px-3 py-1.5 sm:py-2 rounded-[10px] border font-inter font-medium text-xs sm:text-sm transition-colors text-left ${
                          darkMode
                            ? 'bg-[#3a3a3a] border-[#4a4a4a] text-white hover:bg-[#444444]'
                            : 'bg-white border-zinc-100 text-zinc-950 hover:bg-gray-50'
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback Actions */}
              {feedback && !analyzing && (
                <div className="flex gap-2 sm:gap-3">
                  <button className="hover:opacity-70 transition-opacity">
                    <img src={thumbsUpIcon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button className="hover:opacity-70 transition-opacity">
                    <img src={thumbsDownIcon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-1.5 sm:p-2">
        <div className={`border rounded-xl flex items-center pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-1 sm:py-1.5 ${
          darkMode
            ? 'bg-[#2d2d2d] border-[#4a4a4a]'
            : 'bg-neutral-50 border-neutral-200'
        }`}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask me about proposal writing..."
            className={`flex-1 bg-transparent font-inter font-normal text-xs sm:text-sm outline-none min-w-0 ${
              darkMode
                ? 'text-white placeholder:text-[#888888]'
                : 'text-zinc-950 placeholder:text-zinc-500'
            }`}
          />
          <button className="w-8 h-8 sm:w-9 sm:h-9 bg-zenible-primary rounded-[10px] flex items-center justify-center hover:bg-purple-600 transition-colors flex-shrink-0">
            <img src={sendIcon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}