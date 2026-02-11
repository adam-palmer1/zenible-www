import React, { useState } from 'react';
import { Search, Shield, Filter, ShieldCheck, SortAsc, ChevronDown } from 'lucide-react';
import FilterDropdown from './FilterDropdown';
import {
  ROLE_FILTER_OPTIONS,
  ACTIVE_FILTER_OPTIONS,
  VERIFIED_FILTER_OPTIONS,
  ORDER_BY_OPTIONS,
  ORDER_DIR_OPTIONS,
} from './constants';

interface UserFiltersProps {
  darkMode: boolean;
  search: string;
  setSearch: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  activeFilter: string;
  setActiveFilter: (val: string) => void;
  verifiedFilter: string;
  setVerifiedFilter: (val: string) => void;
  orderBy: string;
  setOrderBy: (val: string) => void;
  orderDir: string;
  setOrderDir: (val: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  darkMode,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  activeFilter,
  setActiveFilter,
  verifiedFilter,
  setVerifiedFilter,
  orderBy,
  setOrderBy,
  orderDir,
  setOrderDir,
  onSearch,
}) => {
  const [showRoleFilterDropdown, setShowRoleFilterDropdown] = useState<boolean>(false);
  const [showActiveFilterDropdown, setShowActiveFilterDropdown] = useState<boolean>(false);
  const [showVerifiedFilterDropdown, setShowVerifiedFilterDropdown] = useState<boolean>(false);
  const [showOrderByDropdown, setShowOrderByDropdown] = useState<boolean>(false);
  const [showOrderDirDropdown, setShowOrderDirDropdown] = useState<boolean>(false);

  return (
    <div className="p-4 sm:p-6">
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <form onSubmit={onSearch} className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="w-full sm:flex-1 sm:min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowRoleFilterDropdown(!showRoleFilterDropdown);
                setShowActiveFilterDropdown(false);
                setShowVerifiedFilterDropdown(false);
                setShowOrderByDropdown(false);
                setShowOrderDirDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors ${roleFilter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
            >
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{ROLE_FILTER_OPTIONS.find(o => o.id === roleFilter)?.label || 'All Roles'}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <FilterDropdown
              isOpen={showRoleFilterDropdown}
              onClose={() => setShowRoleFilterDropdown(false)}
              options={ROLE_FILTER_OPTIONS}
              selectedValue={roleFilter}
              onSelect={setRoleFilter}
              title="Role"
            />
          </div>

          {/* Active Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowActiveFilterDropdown(!showActiveFilterDropdown);
                setShowRoleFilterDropdown(false);
                setShowVerifiedFilterDropdown(false);
                setShowOrderByDropdown(false);
                setShowOrderDirDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors ${activeFilter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
            >
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{ACTIVE_FILTER_OPTIONS.find(o => o.id === activeFilter)?.label || 'All Users'}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <FilterDropdown
              isOpen={showActiveFilterDropdown}
              onClose={() => setShowActiveFilterDropdown(false)}
              options={ACTIVE_FILTER_OPTIONS}
              selectedValue={activeFilter}
              onSelect={setActiveFilter}
              title="Status"
            />
          </div>

          {/* Verified Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowVerifiedFilterDropdown(!showVerifiedFilterDropdown);
                setShowRoleFilterDropdown(false);
                setShowActiveFilterDropdown(false);
                setShowOrderByDropdown(false);
                setShowOrderDirDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors ${verifiedFilter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}
            >
              <ShieldCheck className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{VERIFIED_FILTER_OPTIONS.find(o => o.id === verifiedFilter)?.label || 'All'}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <FilterDropdown
              isOpen={showVerifiedFilterDropdown}
              onClose={() => setShowVerifiedFilterDropdown(false)}
              options={VERIFIED_FILTER_OPTIONS}
              selectedValue={verifiedFilter}
              onSelect={setVerifiedFilter}
              title="Verified"
            />
          </div>

          {/* Order By */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowOrderByDropdown(!showOrderByDropdown);
                setShowRoleFilterDropdown(false);
                setShowActiveFilterDropdown(false);
                setShowVerifiedFilterDropdown(false);
                setShowOrderDirDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors`}
            >
              <SortAsc className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{ORDER_BY_OPTIONS.find(o => o.id === orderBy)?.label || 'Sort'}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <FilterDropdown
              isOpen={showOrderByDropdown}
              onClose={() => setShowOrderByDropdown(false)}
              options={ORDER_BY_OPTIONS}
              selectedValue={orderBy}
              onSelect={setOrderBy}
              title="Sort By"
            />
          </div>

          {/* Order Direction */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowOrderDirDropdown(!showOrderDirDropdown);
                setShowRoleFilterDropdown(false);
                setShowActiveFilterDropdown(false);
                setShowVerifiedFilterDropdown(false);
                setShowOrderByDropdown(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'} hover:border-purple-400 transition-colors`}
            >
              <span className="text-sm">{ORDER_DIR_OPTIONS.find(o => o.id === orderDir)?.label || 'Desc'}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <FilterDropdown
              isOpen={showOrderDirDropdown}
              onClose={() => setShowOrderDirDropdown(false)}
              options={ORDER_DIR_OPTIONS}
              selectedValue={orderDir}
              onSelect={setOrderDir}
              title="Direction"
            />
          </div>

          {/* Search Button */}
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserFilters;
