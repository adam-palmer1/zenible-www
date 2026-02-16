import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Play, Save, Loader2, ArrowUpDown, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useCompanyCurrencies } from '@/hooks/crm/useCompanyCurrencies';
import EntitySelector from './EntitySelector';
import EntityConfigPanel from './EntityConfigPanel';
import DateRangeSelector from './DateRangeSelector';
import SaveReportModal from './SaveReportModal';

const ReportBuilder: React.FC = () => {
  const {
    configuration,
    setSort,
    setEntityExtraFilters,
    executeReport,
    saveReport,
    updateReport,
    executionLoading,
    activeReportId,
    activeReportName,
    setMode,
    columnsLoading,
    availableColumns,
  } = useCustomReports();
  const { showSuccess, showError } = useNotification();
  const { companyCurrencies } = useCompanyCurrencies();

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [dirOpen, setDirOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);
  const dirButtonRef = useRef<HTMLButtonElement>(null);
  const [sortPos, setSortPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });
  const [dirPos, setDirPos] = useState<{ top?: number; bottom?: number; left: number }>({ left: 0 });

  useEffect(() => {
    if (sortOpen && sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setSortPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
      } else {
        setSortPos({ top: rect.bottom + 8, left: rect.left });
      }
    }
  }, [sortOpen]);

  useEffect(() => {
    if (dirOpen && dirButtonRef.current) {
      const rect = dirButtonRef.current.getBoundingClientRect();
      const dropdownHeight = 100;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setDirPos({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
      } else {
        setDirPos({ top: rect.bottom + 8, left: rect.left });
      }
    }
  }, [dirOpen]);

  // Build sortable columns from selected entities
  const sortableColumns = useMemo(() => {
    if (!availableColumns?.entities) return [];
    const selectedTypes = configuration.entity_selections.map((s) => s.entity_type);
    const cols: { key: string; label: string }[] = [];
    const seen = new Set<string>();

    for (const entity of availableColumns.entities) {
      if (!selectedTypes.includes(entity.entity_type)) continue;
      for (const col of entity.columns) {
        if (col.sortable && !seen.has(col.key)) {
          seen.add(col.key);
          cols.push({ key: col.key, label: col.label });
        }
      }
    }
    return cols;
  }, [availableColumns, configuration.entity_selections]);

  // Reset sort if current sort_by is no longer valid for selected entities
  useEffect(() => {
    if (configuration.sort_by && sortableColumns.length > 0 && !sortableColumns.some((c) => c.key === configuration.sort_by)) {
      setSort(undefined, configuration.sort_direction);
    }
  }, [sortableColumns, configuration.sort_by, configuration.sort_direction, setSort]);

  // Close currency dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if any selected entity supports currency_ids filter
  const hasCurrencyEntities = useMemo(() => {
    if (!availableColumns?.entities) return false;
    return configuration.entity_selections.some((sel) => {
      const meta = availableColumns.entities.find((e) => e.entity_type === sel.entity_type);
      return meta?.filters.extra_filters.includes('currency_ids');
    });
  }, [availableColumns, configuration.entity_selections]);

  // Get currently selected currency_ids (from first entity that has them)
  const selectedCurrencyIds = useMemo(() => {
    const first = configuration.entity_selections.find((sel) => {
      const meta = availableColumns?.entities.find((e) => e.entity_type === sel.entity_type);
      return meta?.filters.extra_filters.includes('currency_ids');
    });
    return new Set(first?.extra_filters?.currency_ids || []);
  }, [configuration.entity_selections, availableColumns]);

  const handleCurrencyToggle = (currencyId: string) => {
    const currentIds = Array.from(selectedCurrencyIds);
    const newIds = selectedCurrencyIds.has(currencyId)
      ? currentIds.filter((id) => id !== currencyId)
      : [...currentIds, currencyId];
    const idsOrUndefined = newIds.length > 0 ? newIds : undefined;

    // Apply to all entities that support currency_ids
    for (const sel of configuration.entity_selections) {
      const meta = availableColumns?.entities.find((e) => e.entity_type === sel.entity_type);
      if (meta?.filters.extra_filters.includes('currency_ids')) {
        setEntityExtraFilters(sel.entity_type, {
          ...sel.extra_filters,
          currency_ids: idsOrUndefined,
        });
      }
    }
  };

  const currentSortLabel = sortableColumns.find((c) => c.key === configuration.sort_by)?.label || configuration.sort_by || 'None';
  const currentDirLabel = configuration.sort_direction === 'asc' ? 'Ascending' : 'Descending';

  const canRun = configuration.entity_selections.length > 0 &&
    configuration.entity_selections.every((s) => s.columns.length > 0);

  const handleRun = async () => {
    if (!canRun) return;
    try {
      await executeReport();
    } catch {
      showError('Failed to execute report');
    }
  };

  const handleSave = async (data: { name: string; description: string }) => {
    if (activeReportId) {
      await updateReport(activeReportId, {
        name: data.name,
        description: data.description || undefined,
        configuration,
      });
      showSuccess('Report updated');
    } else {
      await saveReport({
        name: data.name,
        description: data.description || undefined,
        configuration,
      });
      showSuccess('Report saved');
    }
  };

  if (columnsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('list')}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-[#09090b]">
              {activeReportName || 'New Report'}
            </h2>
            <p className="text-sm text-[#71717a]">
              Select entities and configure columns to build your report
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSaveModalOpen(true)}
            disabled={!canRun}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleRun}
            disabled={!canRun || executionLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {executionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Report
          </button>
        </div>
      </div>

      {/* Date Range + Sort Row */}
      <div className="flex flex-wrap items-end gap-4">
        <DateRangeSelector />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
          <div className="flex items-center gap-2">
            {/* Sort Column Dropdown */}
            <div className="relative">
              <button
                ref={sortButtonRef}
                onClick={() => setSortOpen((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  configuration.sort_by
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <ArrowUpDown className="h-4 w-4 flex-shrink-0" />
                <span className="truncate flex-1 text-left">{currentSortLabel}</span>
                <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortOpen && createPortal(
                <>
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: 9998 }}
                    onClick={() => setSortOpen(false)}
                  />
                  <div
                    style={{ position: 'fixed', top: sortPos.top, bottom: sortPos.bottom, left: sortPos.left, width: 280, zIndex: 9999 }}
                    className="bg-white rounded-lg shadow-lg border border-gray-200"
                  >
                    <div className="max-h-64 overflow-y-auto p-2">
                      {/* None option */}
                      <button
                        onClick={() => { setSort(undefined, configuration.sort_direction); setSortOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg cursor-pointer w-full text-left ${
                          !configuration.sort_by ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          !configuration.sort_by ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                        }`}>
                          {!configuration.sort_by && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span>None</span>
                      </button>

                      {sortableColumns.length === 0 ? (
                        <p className="text-sm text-gray-500 py-3 text-center">Select an entity first</p>
                      ) : (
                        sortableColumns.map((col) => (
                          <button
                            key={col.key}
                            onClick={() => { setSort(col.key, configuration.sort_direction); setSortOpen(false); }}
                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg cursor-pointer w-full text-left ${
                              configuration.sort_by === col.key ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              configuration.sort_by === col.key ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                            }`}>
                              {configuration.sort_by === col.key && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <span>{col.label}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>

            {/* Sort Direction Dropdown */}
            <div className="relative">
              <button
                ref={dirButtonRef}
                onClick={() => setDirOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              >
                <span>{currentDirLabel}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${dirOpen ? 'rotate-180' : ''}`} />
              </button>

              {dirOpen && createPortal(
                <>
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: 9998 }}
                    onClick={() => setDirOpen(false)}
                  />
                  <div
                    style={{ position: 'fixed', top: dirPos.top, bottom: dirPos.bottom, left: dirPos.left, width: 160, zIndex: 9999 }}
                    className="bg-white rounded-lg shadow-lg border border-gray-200 p-2"
                  >
                    {(['desc', 'asc'] as const).map((dir) => (
                      <button
                        key={dir}
                        onClick={() => { setSort(configuration.sort_by, dir); setDirOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg cursor-pointer w-full text-left ${
                          configuration.sort_direction === dir ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          configuration.sort_direction === dir ? 'border-purple-600 bg-purple-600' : 'border-gray-300'
                        }`}>
                          {configuration.sort_direction === dir && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span>{dir === 'desc' ? 'Descending' : 'Ascending'}</span>
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Currency Filter */}
        {hasCurrencyEntities && companyCurrencies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <div className="relative" ref={currencyRef}>
              <button
                type="button"
                onClick={() => setCurrencyOpen((v) => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors ${
                  selectedCurrencyIds.size > 0
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                {selectedCurrencyIds.size > 0
                  ? `Currencies (${selectedCurrencyIds.size})`
                  : 'All Currencies'}
                {currencyOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {currencyOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {companyCurrencies.map((cc) => (
                    <label
                      key={cc.currency.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCurrencyIds.has(cc.currency.id)}
                        onChange={() => handleCurrencyToggle(cc.currency.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-900 font-medium">{cc.currency.code}</span>
                      <span className="text-sm text-gray-400">{cc.currency.symbol}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Entity Selector */}
      <EntitySelector />

      {/* Per-Entity Config Panels */}
      {configuration.entity_selections.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Configure Entities</label>
          {configuration.entity_selections.map((selection) => (
            <EntityConfigPanel key={selection.entity_type} selection={selection} />
          ))}
        </div>
      )}

      {/* Validation hint */}
      {configuration.entity_selections.length > 0 &&
        configuration.entity_selections.some((s) => s.columns.length === 0) && (
          <p className="text-sm text-amber-600">
            Select at least one column for each entity to run the report.
          </p>
        )}

      <SaveReportModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSave}
        initialName={activeReportName || ''}
        isUpdate={!!activeReportId}
      />
    </div>
  );
};

export default ReportBuilder;
