import React from 'react';
import { EventHost, PlanItem } from './types';

interface EventsFilterBarProps {
  darkMode: boolean;
  search: string;
  setSearch: (value: string) => void;
  hostFilter: string;
  setHostFilter: (value: string) => void;
  planFilter: string;
  setPlanFilter: (value: string) => void;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
  tagsFilter: string;
  setTagsFilter: (value: string) => void;
  setPage: (page: number) => void;
  hosts: EventHost[];
  plans: PlanItem[];
  selectedEventsCount: number;
  onCreateEvent: () => void;
  onBulkAction: () => void;
}

export default function EventsFilterBar({
  darkMode,
  search,
  setSearch,
  hostFilter,
  setHostFilter,
  planFilter,
  setPlanFilter,
  activeFilter,
  setActiveFilter,
  tagsFilter,
  setTagsFilter,
  setPage,
  hosts,
  plans,
  selectedEventsCount,
  onCreateEvent,
  onBulkAction,
}: EventsFilterBarProps) {
  return (
    <div className="p-6">
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search in title and description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
          />

          <select
            value={hostFilter}
            onChange={(e) => {
              setHostFilter(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
          >
            <option value="">All Hosts</option>
            {hosts.map(host => (
              <option key={host.id} value={host.id}>{host.name}</option>
            ))}
          </select>

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
          >
            <option value="">All Plans</option>
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by tags (comma separated)..."
            value={tagsFilter}
            onChange={(e) => {
              setTagsFilter(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
          />

          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCreateEvent}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
          >
            Create Event
          </button>

          {selectedEventsCount > 0 && (
            <button
              onClick={onBulkAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Bulk Actions ({selectedEventsCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
