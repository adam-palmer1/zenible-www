import React, { useState } from 'react';
import { ArrowLeft, Pencil, Loader2 } from 'lucide-react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS, type ReportEntityType } from '@/types/customReport';
import ResultsEntityTab from './ResultsEntityTab';
import CustomReportExportButton from './CustomReportExportButton';

const ReportResults: React.FC = () => {
  const {
    executionResult,
    executionLoading,
    executionError,
    activeReportId,
    activeReportName,
    setMode,
    executeReport,
    executeSavedReport,
  } = useCustomReports();

  const entityTypes = executionResult
    ? (Object.keys(executionResult.results) as ReportEntityType[])
    : [];

  const [activeEntity, setActiveEntity] = useState<ReportEntityType | null>(
    entityTypes[0] || null
  );

  // Keep activeEntity in sync if results change
  if (activeEntity && !entityTypes.includes(activeEntity) && entityTypes.length > 0) {
    setActiveEntity(entityTypes[0]);
  }

  const handlePageChange = async (page: number) => {
    if (activeReportId) {
      await executeSavedReport(activeReportId, page);
    } else {
      await executeReport(page);
    }
  };

  if (executionLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
        <p className="text-sm text-[#71717a]">Running report...</p>
      </div>
    );
  }

  if (executionError) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Error: {executionError}</p>
          <button
            onClick={() => setMode('build')}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Back to builder
          </button>
        </div>
      </div>
    );
  }

  if (!executionResult) {
    return (
      <div className="p-4 text-center text-sm text-[#71717a]">
        No results to display. Run a report first.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('build')}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-[#09090b]">
              {activeReportName || 'Report Results'}
            </h2>
            {executionResult.date_range_resolved && (
              <p className="text-sm text-[#71717a]">
                {new Date(executionResult.date_range_resolved.start).toLocaleDateString()} -{' '}
                {new Date(executionResult.date_range_resolved.end).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('build')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <CustomReportExportButton />
        </div>
      </div>

      {/* Entity Tabs */}
      {entityTypes.length > 1 && (
        <div className="flex items-center gap-1 border-b border-gray-200">
          {entityTypes.map((et) => {
            const colors = ENTITY_TYPE_COLORS[et];
            const resultData = executionResult.results[et];
            return (
              <button
                key={et}
                onClick={() => setActiveEntity(et)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeEntity === et
                    ? `${colors.text} border-current`
                    : 'text-[#71717a] border-transparent hover:text-[#09090b]'
                }`}
              >
                {ENTITY_TYPE_LABELS[et]}
                <span className="ml-1.5 text-xs opacity-75">({resultData?.total || 0})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Entity Results */}
      {activeEntity && executionResult.results[activeEntity] && (
        <ResultsEntityTab
          result={executionResult.results[activeEntity]}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default ReportResults;
