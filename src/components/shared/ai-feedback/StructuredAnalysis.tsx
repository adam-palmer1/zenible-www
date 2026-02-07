import React from 'react';
import CircularScoreIndicator from '../CircularScoreIndicator';
import { StructuredAnalysisData } from './types';

interface StructuredAnalysisProps {
  darkMode: boolean;
  structuredData?: unknown;
  structuredAnalysis?: unknown;
  feedbackStructured?: unknown;
  feedbackAnalysisStructured?: unknown;
}

export default function StructuredAnalysis({
  darkMode,
  structuredData = null,
  structuredAnalysis,
  feedbackStructured,
  feedbackAnalysisStructured,
}: StructuredAnalysisProps) {
  const rawStructured = structuredData !== null && structuredData !== undefined
    ? structuredData
    : (structuredAnalysis || feedbackStructured || feedbackAnalysisStructured);
  if (!rawStructured) return null;
  const structured = rawStructured as StructuredAnalysisData;

  return (
    <div className="space-y-6 mt-4">
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
            ✅ Strengths
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
            ❌ Weaknesses
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
            💡 Improvements
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
