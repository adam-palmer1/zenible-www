import React from 'react';
import { LoadingSpinner } from '../../shared';
import { EventAnalytics } from './types';
import eventsAPI from '../../../services/eventsAPI';
import Combobox from '../../ui/combobox/Combobox';

interface EventAnalyticsTabProps {
  darkMode: boolean;
  analytics: EventAnalytics | null;
  analyticsLoading: boolean;
  analyticsDays: number;
  setAnalyticsDays: (days: number) => void;
}

const formatDateTime = (dateString: string): string => {
  if (!dateString) return '-';
  return eventsAPI.formatLocalDateTime(dateString);
};

export default function EventAnalyticsTab({
  darkMode,
  analytics,
  analyticsLoading,
  analyticsDays,
  setAnalyticsDays,
}: EventAnalyticsTabProps) {
  return (
    <div className="p-6">
      <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <Combobox
          options={[
            { id: '7', label: 'Last 7 days' },
            { id: '30', label: 'Last 30 days' },
            { id: '90', label: 'Last 90 days' },
            { id: '365', label: 'Last 365 days' },
          ]}
          value={String(analyticsDays)}
          onChange={(value) => setAnalyticsDays(parseInt(value || '7'))}
          placeholder="Select period"
          allowClear={false}
        />
      </div>

      {analyticsLoading ? (
        <LoadingSpinner height="py-12" />
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Events</div>
              <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {analytics.total_events || 0}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Upcoming Events</div>
              <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {analytics.upcoming_events || 0}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Past Events</div>
              <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {analytics.past_events || 0}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Registrations</div>
              <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {analytics.total_registrations || 0}
              </div>
            </div>
          </div>

          {analytics.analytics && analytics.analytics.length > 0 && (
            <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
              <div className="p-4 border-b">
                <h3 className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                  Event Performance
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Event
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Start Date
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Total Registrations
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Active Registrations
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        Capacity
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                    {analytics.analytics.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {item.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {formatDateTime(item.start_datetime)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {item.total_registrations || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {item.active_registrations || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {item.capacity_utilization?.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={`text-center py-12 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          No analytics data available
        </div>
      )}
    </div>
  );
}
