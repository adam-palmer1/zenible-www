import React, { useState } from 'react';
import { ArrowLeft, Play, Save, Loader2 } from 'lucide-react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
import { useNotification } from '@/contexts/NotificationContext';
import EntitySelector from './EntitySelector';
import EntityConfigPanel from './EntityConfigPanel';
import DateRangeSelector from './DateRangeSelector';
import SaveReportModal from './SaveReportModal';

const ReportBuilder: React.FC = () => {
  const {
    configuration,
    setSort,
    executeReport,
    saveReport,
    updateReport,
    executionLoading,
    activeReportId,
    activeReportName,
    setMode,
    columnsLoading,
  } = useCustomReports();
  const { showSuccess, showError } = useNotification();

  const [saveModalOpen, setSaveModalOpen] = useState(false);

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

  const handleSave = async (data: { name: string; description: string; is_shared: boolean }) => {
    if (activeReportId) {
      await updateReport(activeReportId, {
        name: data.name,
        description: data.description || undefined,
        is_shared: data.is_shared,
        configuration,
      });
      showSuccess('Report updated');
    } else {
      await saveReport({
        name: data.name,
        description: data.description || undefined,
        is_shared: data.is_shared,
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

      {/* Date Range + Sort Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateRangeSelector />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={configuration.sort_by || ''}
              onChange={(e) => setSort(e.target.value || undefined, configuration.sort_direction)}
              placeholder="Sort column (e.g., created_at)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <select
              value={configuration.sort_direction || 'desc'}
              onChange={(e) =>
                setSort(configuration.sort_by, e.target.value as 'asc' | 'desc')
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      </div>

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
