import React from 'react';
import { Plan } from './types';

interface TagFiltersBarProps {
  darkMode: boolean;
  search: string;
  setSearch: (value: string) => void;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
  planFilter: string;
  setPlanFilter: (value: string) => void;
  setPage: (value: number) => void;
  plans: Plan[];
  onCreateTag: () => void;
}

export default function TagFiltersBar({
  darkMode,
  search,
  setSearch,
  activeFilter,
  setActiveFilter,
  planFilter,
  setPlanFilter,
  setPage,
  plans,
  onCreateTag,
}: TagFiltersBarProps) {
  return (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search tags..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
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

        <select
          value={planFilter}
          onChange={(e) => {
            setPlanFilter(e.target.value);
            setPage(1);
          }}
          className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
        >
          <option value="">All Plans</option>
          {plans.map((plan: Plan) => (
            <option key={plan.id} value={plan.id}>{plan.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCreateTag}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
        >
          Create Tag
        </button>
      </div>
    </div>
  );
}
