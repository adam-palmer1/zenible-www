import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePreferences } from '../../contexts/PreferencesContext';
import { planAPI } from '../../services/planAPI';
import { queryKeys } from '../../lib/query-keys';
import type { UsageHistoryMonth } from '../../types/usageHistory';
import { LoadingSpinner } from '../shared';

function formatCount(n: number): string {
  return Number(n).toLocaleString();
}

function MiniProgressBar({
  current,
  limit,
  darkMode,
}: {
  current: number;
  limit: number;
  darkMode: boolean;
}) {
  const pct = limit <= 0 ? 0 : Math.min((current / limit) * 100, 100);
  const over = limit > 0 && current > limit;
  const near = limit > 0 && pct >= 75 && !over;
  const color = over ? 'bg-red-500' : near ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className={`h-1.5 rounded-full overflow-hidden mt-1 ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-200'}`}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MonthCellValue({
  current,
  limit,
  isCurrent,
  darkMode,
}: {
  current: number;
  limit: number | null;
  isCurrent: boolean;
  darkMode: boolean;
}) {
  if (isCurrent && typeof limit === 'number' && limit > 0) {
    return (
      <div>
        <div className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {formatCount(current)} <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>/ {formatCount(limit)}</span>
        </div>
        <MiniProgressBar current={current} limit={limit} darkMode={darkMode} />
      </div>
    );
  }
  return (
    <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {formatCount(current)}
    </span>
  );
}

function MonthRowExpanded({ month, darkMode }: { month: UsageHistoryMonth; darkMode: boolean }) {
  const hasCharacters = month.per_character.length > 0;
  const hasTools = month.per_tool.length > 0;

  if (!hasCharacters && !hasTools) {
    return (
      <div className={`text-xs italic ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
        No per-character or per-tool activity this month.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasCharacters && (
        <div>
          <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
            Per AI Character
          </div>
          <ul className={`text-sm divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-100'}`}>
            {month.per_character.map((c) => (
              <li key={c.character_id} className="flex items-center justify-between py-1">
                <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-700'}>
                  {c.character_name}
                </span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                  {formatCount(c.usage)}
                  {month.is_current && typeof c.limit === 'number' && c.limit > 0 && (
                    <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}> / {formatCount(c.limit)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasTools && (
        <div>
          <div className={`text-xs font-medium mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
            Per AI Tool
          </div>
          <ul className={`text-sm divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-100'}`}>
            {month.per_tool.map((t) => (
              <li key={t.tool_name} className="flex items-center justify-between py-1">
                <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-700'}>
                  {t.tool_name}
                </span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                  {formatCount(t.usage)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function UsageHistoryPanel() {
  const { darkMode } = usePreferences();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data = null, isLoading: loading, error: queryError } = useQuery({
    queryKey: queryKeys.usageHistory.all,
    queryFn: () => planAPI.getUsageHistory(),
  });
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load usage history') : null;

  if (loading) {
    return (
      <div className="py-6 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm p-4 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
        {error}
      </div>
    );
  }

  if (!data || data.months.length === 0) {
    return (
      <div className={`text-sm p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text-secondary' : 'bg-white border-gray-200 text-gray-500'}`}>
        No usage history available yet.
      </div>
    );
  }

  // Render newest first
  const ordered = [...data.months].reverse();

  return (
    <div className={`rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'}`}>
      <div className={`px-4 py-3 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
        <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Usage History
        </h3>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          Month-by-month AI messages, meeting minutes, and tool usage.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left ${darkMode ? 'text-zenible-dark-text-secondary border-zenible-dark-border' : 'text-gray-500 border-gray-200'} border-b`}>
              <th className="px-4 py-2 font-medium">Month</th>
              <th className="px-4 py-2 font-medium">AI Messages</th>
              <th className="px-4 py-2 font-medium">Meeting Minutes</th>
              <th className="px-2 py-2 w-8" aria-label="Expand" />
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-100'}`}>
            {ordered.map((m) => {
              const key = `${m.year}-${m.month}`;
              const isExpanded = !!expanded[key];
              const hasDetail = m.per_character.length > 0 || m.per_tool.length > 0;

              return (
                <React.Fragment key={key}>
                  <tr className={m.is_current ? (darkMode ? 'bg-zenible-primary/10' : 'bg-indigo-50/40') : ''}>
                    <td className="px-4 py-3">
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'} ${m.is_current ? 'font-semibold' : ''}`}>
                        {m.period_label}
                      </div>
                      {m.is_current && typeof m.days_remaining === 'number' && (
                        <div className={`text-xs mt-0.5 inline-block px-2 py-0.5 rounded-full ${darkMode ? 'bg-zenible-primary/20 text-zenible-primary' : 'bg-indigo-100 text-indigo-700'}`}>
                          {m.days_remaining} {m.days_remaining === 1 ? 'day' : 'days'} left
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <MonthCellValue
                        current={m.total_ai_messages}
                        limit={m.total_ai_messages_limit}
                        isCurrent={m.is_current}
                        darkMode={darkMode}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <MonthCellValue
                        current={m.meeting_bot_minutes}
                        limit={m.meeting_bot_minutes_limit}
                        isCurrent={m.is_current}
                        darkMode={darkMode}
                      />
                    </td>
                    <td className="px-2 py-3 text-right">
                      {hasDetail && (
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className={`text-xs px-2 py-1 rounded ${darkMode ? 'text-zenible-dark-text-secondary hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          {isExpanded ? '▾' : '▸'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && hasDetail && (
                    <tr className={darkMode ? 'bg-zenible-dark-bg/30' : 'bg-gray-50'}>
                      <td colSpan={4} className="px-4 py-3">
                        <MonthRowExpanded month={m} darkMode={darkMode} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
