import React, { useState } from 'react';
import { Plus, FileBarChart, Loader2 } from 'lucide-react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
import { useNotification } from '@/contexts/NotificationContext';
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS } from '@/types/customReport';
import type { CustomReportListItem } from '@/types/customReport';
import SavedReportActions from './SavedReportActions';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import customReportsAPI from '@/services/api/finance/customReports';

const SavedReportsList: React.FC = () => {
  const {
    savedReports,
    savedReportsTotal,
    savedReportsLoading,
    savedReportsPage,
    setSavedReportsPage,
    startNewReport,
    executeSavedReport,
    loadSavedReport,
    cloneReport,
    deleteReport,
  } = useCustomReports();
  const { showSuccess, showError } = useNotification();

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; reportId: string | null }>({
    isOpen: false,
    reportId: null,
  });

  const handleRun = async (id: string) => {
    try {
      await executeSavedReport(id);
    } catch {
      showError('Failed to run report');
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const report = await customReportsAPI.getReport(id);
      loadSavedReport(report);
    } catch {
      showError('Failed to load report');
    }
  };

  const handleClone = async (id: string) => {
    try {
      await cloneReport(id);
      showSuccess('Report cloned successfully');
    } catch {
      showError('Failed to clone report');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.reportId) return;
    try {
      await deleteReport(deleteModal.reportId);
      showSuccess('Report deleted');
    } catch {
      showError('Failed to delete report');
    }
  };

  const totalPages = Math.ceil(savedReportsTotal / 20);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#09090b]">Custom Reports</h2>
          <p className="text-sm text-[#71717a]">Build and save custom reports across your financial data</p>
        </div>
        <button
          onClick={startNewReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {savedReportsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          </div>
        ) : savedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileBarChart className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-[#71717a] mb-4">No custom reports yet</p>
            <button
              onClick={startNewReport}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#8e51ff] border border-[#8e51ff] rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first report
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entities
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {savedReports.map((report: CustomReportListItem) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleRun(report.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-[#09090b]">{report.name}</div>
                        {report.description && (
                          <div className="text-xs text-[#71717a] mt-0.5 truncate max-w-xs">
                            {report.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {report.entity_types.map((et) => {
                            const colors = ENTITY_TYPE_COLORS[et];
                            return (
                              <span
                                key={et}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                              >
                                {ENTITY_TYPE_LABELS[et]}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#71717a]">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <SavedReportActions
                          report={report}
                          onEdit={handleEdit}
                          onClone={handleClone}
                          onDelete={(id) => setDeleteModal({ isOpen: true, reportId: id })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <div className="text-sm text-[#71717a]">{savedReportsTotal} reports</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSavedReportsPage(savedReportsPage - 1)}
                    disabled={savedReportsPage <= 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-[#71717a]">
                    {savedReportsPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setSavedReportsPage(savedReportsPage + 1)}
                    disabled={savedReportsPage >= totalPages}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, reportId: null })}
        onConfirm={handleDelete}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
};

export default SavedReportsList;
