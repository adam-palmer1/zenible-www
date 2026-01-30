import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useReports } from '../../../contexts/ReportsContext';
import { useNotification } from '../../../contexts/NotificationContext';
import ConfirmationModal from '../../common/ConfirmationModal';

/**
 * Export Button with dropdown for CSV/PDF options
 */
const ExportButton = () => {
  const { exportTransactions, total } = useReports();
  const { showSuccess, showError } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const dropdownRef = useRef(null);
  const [pdfConfirmModal, setPdfConfirmModal] = useState({ isOpen: false });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    // Warn about PDF limit
    if (format === 'pdf' && total > 500) {
      setIsOpen(false);
      setPdfConfirmModal({ isOpen: true });
      return;
    }

    await performExport(format);
  };

  const performExport = async (format) => {
    try {
      setExporting(format);
      await exportTransactions(format, true);
      showSuccess(`Transactions exported to ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      showError(`Failed to export: ${error.message}`);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  const confirmPdfExport = () => {
    performExport('pdf');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Export</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="py-1">
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#09090b] hover:bg-gray-50 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Export as CSV</div>
                <div className="text-xs text-[#71717a]">Full data, no limit</div>
              </div>
              {exporting === 'csv' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#09090b] hover:bg-gray-50 disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-red-600" />
              <div className="text-left">
                <div className="font-medium">Export as PDF</div>
                <div className="text-xs text-[#71717a]">Max 500 records</div>
              </div>
              {exporting === 'pdf' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={pdfConfirmModal.isOpen}
        onClose={() => setPdfConfirmModal({ isOpen: false })}
        onConfirm={confirmPdfExport}
        title="PDF Export Limit"
        message={`PDF export is limited to 500 records. You have ${total} records. The export will include only the first 500 records. For full export, consider using CSV format instead. Do you want to continue with PDF?`}
        confirmText="Continue with PDF"
        cancelText="Cancel"
        confirmColor="orange"
      />
    </div>
  );
};

export default ExportButton;
