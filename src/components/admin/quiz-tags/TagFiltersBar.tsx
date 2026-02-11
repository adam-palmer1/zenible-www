import React from 'react';
import { Plan } from './types';
import Combobox from '../../ui/combobox/Combobox';

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

        <Combobox
          options={plans.map((plan: Plan) => ({ id: plan.id, label: plan.name }))}
          value={planFilter}
          onChange={(value) => {
            setPlanFilter(value);
            setPage(1);
          }}
          placeholder="All Plans"
          allowClear
        />
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
