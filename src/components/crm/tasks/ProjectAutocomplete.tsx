import React, { useEffect, useMemo, useRef, useState } from 'react';
import projectsAPI from '../../../services/api/crm/projects';
import logger from '../../../utils/logger';

interface ProjectOption {
  id: string;
  name: string;
  status?: string;
}

interface ProjectAutocompleteProps {
  value: string | null;
  valueLabel?: string | null;
  onChange: (project: ProjectOption | null) => void;
  placeholder?: string;
}

/**
 * Project picker with autocomplete.
 * - Empty/focused: shows ACTIVE projects (default API behaviour).
 * - Typing: searches ALL projects regardless of status.
 */
const ProjectAutocomplete: React.FC<ProjectAutocompleteProps> = ({
  value,
  valueLabel,
  onChange,
  placeholder = 'Link a project (optional)',
}) => {
  const [query, setQuery] = useState(valueLabel ?? '');
  const [options, setOptions] = useState<ProjectOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value label.
  useEffect(() => {
    setQuery(valueLabel ?? '');
  }, [valueLabel]);

  const fetchOptions = useMemo(
    () =>
      async (search: string) => {
        setLoading(true);
        try {
          const params: Record<string, string | string[]> = { per_page: '20' };
          if (search.trim()) {
            params.search = search.trim();
          } else {
            params.active_only = 'true';
          }
          const resp = (await projectsAPI.list(params)) as { items?: ProjectOption[] };
          setOptions(resp.items ?? []);
        } catch (err) {
          logger.error('Failed to load projects', err);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      },
    [],
  );

  const handleInputChange = (next: string) => {
    setQuery(next);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchOptions(next), 200);
  };

  const handleFocus = () => {
    setOpen(true);
    void fetchOptions(query);
  };

  const handleSelect = (option: ProjectOption | null) => {
    onChange(option);
    setQuery(option?.name ?? '');
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenible-primary"
      />
      {value && (
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          aria-label="Clear project"
        >
          ×
        </button>
      )}
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading…</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              {query.trim() ? 'No matching projects' : 'No active projects'}
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-purple-50 flex items-center justify-between ${
                  value === opt.id ? 'bg-purple-50 font-medium text-zenible-primary' : 'text-gray-800'
                }`}
              >
                <span className="truncate">{opt.name}</span>
                {opt.status && (
                  <span className="ml-2 text-xs text-gray-400 uppercase tracking-wide">{opt.status}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectAutocomplete;
