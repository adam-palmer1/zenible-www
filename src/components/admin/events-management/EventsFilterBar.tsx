import React from 'react';
import { EventHost, PlanItem } from './types';
import Combobox from '../../ui/combobox/Combobox';

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

          <Combobox
            options={hosts.map(host => ({ id: host.id, label: host.name }))}
            value={hostFilter}
            onChange={(value) => {
              setHostFilter(value);
              setPage(1);
            }}
            placeholder="All Hosts"
            allowClear
          />

          <Combobox
            options={plans.map(plan => ({ id: plan.id, label: plan.name }))}
            value={planFilter}
            onChange={(value) => {
              setPlanFilter(value);
              setPage(1);
            }}
            placeholder="All Plans"
            allowClear
          />

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

          <Combobox
            options={[
              { id: 'true', label: 'Active' },
              { id: 'false', label: 'Inactive' },
            ]}
            value={activeFilter}
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            placeholder="All Status"
            allowClear
          />
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
