import React, { useState } from 'react';
import CircularScoreIndicator from '../CircularScoreIndicator';
import { StructuredAnalysisData } from './types';

interface StructuredAnalysisProps {
  darkMode: boolean;
  structuredData?: unknown;
}

export default function StructuredAnalysis({
  darkMode,
  structuredData = null,
}: StructuredAnalysisProps) {
  const [copied, setCopied] = useState(false);

  if (!structuredData) return null;
  const structured = structuredData as StructuredAnalysisData;

  const handleCopyProposal = async () => {
    if (!structured.proposal_text) return;
    try {
      await navigator.clipboard.writeText(structured.proposal_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[StructuredAnalysis] Failed to copy proposal:', err);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {structured.proposal_text?.trim() && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-semibold text-sm flex items-center gap-2 ${
              darkMode ? 'text-violet-400' : 'text-violet-700'
            }`}>
              Proposal
            </h4>
            <button
              onClick={handleCopyProposal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                copied
                  ? darkMode
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-green-100 text-green-700'
                  : darkMode
                    ? 'bg-[#3d3d3d] text-gray-300 hover:bg-[#4d4d4d]'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Proposal
                </>
              )}
            </button>
          </div>
          <div className={`rounded-lg p-3 text-xs whitespace-pre-wrap ${
            darkMode ? 'bg-[#1a1a2e] text-gray-200 border border-[#333355]' : 'bg-violet-50 text-gray-800 border border-violet-200'
          }`}>
            {structured.proposal_text}
          </div>
        </div>
      )}

      {structured.score !== undefined && structured.score !== null && (
        <>
          <div className="flex justify-center">
            <CircularScoreIndicator
              score={structured.score}
              darkMode={darkMode}
              size={140}
              strokeWidth={10}
            />
          </div>
          <div className={`border-t ${darkMode ? 'border-[#444444]' : 'border-gray-200'}`} />
        </>
      )}

      {structured.strengths && structured.strengths.length > 0 && (
        <div>
          <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
            darkMode ? 'text-green-400' : 'text-green-700'
          }`}>
            Strengths
          </h4>
          <ul className="space-y-1">
            {structured.strengths.map((strength: string, i: number) => (
              <li key={i} className={`text-xs pl-4 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                • {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {structured.weaknesses && structured.weaknesses.length > 0 && (
        <div>
          <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
            darkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            Weaknesses
          </h4>
          <ul className="space-y-1">
            {structured.weaknesses.map((weakness: string, i: number) => (
              <li key={i} className={`text-xs pl-4 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                • {weakness}
              </li>
            ))}
          </ul>
        </div>
      )}

      {structured.improvements && structured.improvements.length > 0 && (
        <div>
          <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
            darkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            Improvements
          </h4>
          <ul className="space-y-1">
            {structured.improvements.map((improvement: string, i: number) => (
              <li key={i} className={`text-xs pl-4 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                • {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
