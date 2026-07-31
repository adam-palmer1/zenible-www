import React, { useState, useEffect, useRef } from 'react';
import { usePreferences } from '../../../contexts/PreferencesContext';
import type { InsightsState } from '../../../types/meetingIntelligence';

interface RealtimeInsightsPanelProps {
  state: InsightsState;
  creditsRemaining: number | null;
}

const COACHING_TYPE_STYLES: Record<string, { bg: string; darkBg: string; text: string; darkText: string }> = {
  buying_signal: { bg: 'bg-green-50', darkBg: 'bg-green-900/20', text: 'text-green-700', darkText: 'text-green-400' },
  objection: { bg: 'bg-red-50', darkBg: 'bg-red-900/20', text: 'text-red-700', darkText: 'text-red-400' },
  concern: { bg: 'bg-amber-50', darkBg: 'bg-amber-900/20', text: 'text-amber-700', darkText: 'text-amber-400' },
  talk_ratio: { bg: 'bg-blue-50', darkBg: 'bg-blue-900/20', text: 'text-blue-700', darkText: 'text-blue-400' },
  question_gap: { bg: 'bg-purple-50', darkBg: 'bg-purple-900/20', text: 'text-purple-700', darkText: 'text-purple-400' },
  positive: { bg: 'bg-green-50', darkBg: 'bg-green-900/20', text: 'text-green-700', darkText: 'text-green-400' },
  insight: { bg: 'bg-blue-50', darkBg: 'bg-blue-900/20', text: 'text-blue-700', darkText: 'text-blue-400' },
};

const DEFAULT_STYLE = { bg: 'bg-gray-50', darkBg: 'bg-gray-800', text: 'text-gray-700', darkText: 'text-gray-400' };

const SPEAKER_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500',
];

const RealtimeInsightsPanel: React.FC<RealtimeInsightsPanelProps> = ({ state, creditsRemaining }) => {
  const { darkMode } = usePreferences();
  const speakers = Object.entries(state.talk_time);
  const latestSentiment = state.sentiment_trajectory.length > 0
    ? state.sentiment_trajectory[state.sentiment_trajectory.length - 1]
    : null;

  // Track seconds since last update
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    lastUpdateRef.current = Date.now();
    setSecondsAgo(0);
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdateRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`space-y-3 p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Real-time Insights
          </h3>
          <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
            (Last updated: {secondsAgo}s ago)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {latestSentiment && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              latestSentiment.label === 'positive'
                ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700')
                : latestSentiment.label === 'negative'
                  ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-700')
                  : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')
            }`}>
              {latestSentiment.label}
            </span>
          )}
          {creditsRemaining != null && (
            <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
              {creditsRemaining} credits
            </span>
          )}
        </div>
      </div>

      {/* Talk Ratio Bar */}
      {speakers.length > 0 && (
        <div>
          <div className="flex rounded-full overflow-hidden h-2.5">
            {speakers.map(([speaker, info], i) => (
              <div
                key={speaker}
                className={`${SPEAKER_COLORS[i % SPEAKER_COLORS.length]} transition-all duration-500`}
                style={{ width: `${info.percent}%` }}
                title={`${speaker}: ${info.percent}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {speakers.map(([speaker, info], i) => (
              <span key={speaker} className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${SPEAKER_COLORS[i % SPEAKER_COLORS.length]}`} />
                <span className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  {speaker} {info.percent}%
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Coaching Nudges */}
      {state.coaching_notes.length > 0 && (
        <div className="space-y-1.5">
          {state.coaching_notes.slice(-5).reverse().map((note, i) => {
            const style = COACHING_TYPE_STYLES[note.type] || DEFAULT_STYLE;
            return (
              <div
                key={i}
                className={`text-xs px-2.5 py-1.5 rounded ${darkMode ? style.darkBg : style.bg} ${darkMode ? style.darkText : style.text}`}
              >
                {note.message}
              </div>
            );
          })}
        </div>
      )}

      {/* Topics */}
      {state.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {state.topics.map((topic, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded-full ${
                darkMode ? 'bg-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Running Summary */}
      {state.running_summary && (
        <div>
          <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Summary
          </h4>
          <p className={`text-xs leading-relaxed ${darkMode ? 'text-zenible-dark-text-primary' : 'text-gray-700'}`}>
            {state.running_summary}
          </p>
        </div>
      )}

      {/* Action Items */}
      {state.action_items.length > 0 && (
        <div>
          <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Action Items ({state.action_items.length})
          </h4>
          <ul className="space-y-0.5">
            {state.action_items.map((item, i) => (
              <li key={i} className={`flex items-start gap-1.5 text-xs ${darkMode ? 'text-zenible-dark-text-primary' : 'text-gray-700'}`}>
                <span className="text-zenible-primary mt-0.5">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Open Questions */}
      {state.open_questions.length > 0 && (
        <div>
          <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Open Questions ({state.open_questions.length})
          </h4>
          <ul className="space-y-0.5">
            {state.open_questions.map((q, i) => (
              <li key={i} className={`text-xs ${darkMode ? 'text-zenible-dark-text-primary' : 'text-gray-700'}`}>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Decisions */}
      {state.decisions.length > 0 && (
        <div>
          <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Decisions ({state.decisions.length})
          </h4>
          <ul className="space-y-0.5">
            {state.decisions.map((d, i) => (
              <li key={i} className={`text-xs ${darkMode ? 'text-zenible-dark-text-primary' : 'text-gray-700'}`}>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {!state.running_summary && state.action_items.length === 0 && state.coaching_notes.length === 0 && (
        <p className={`text-xs text-center py-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
          Analyzing meeting... insights will appear shortly
        </p>
      )}
    </div>
  );
};

export default RealtimeInsightsPanel;
