import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useCustomReports } from '@/contexts/CustomReportsContext';
import { useNotification } from '@/contexts/NotificationContext';

const CustomReportExportButton: React.FC = () => {
  const { exportReport, activeReportId } = useCustomReports();
  const { showSuccess, showError } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setExporting(format);
      const success = await exportReport(format, activeReportId || undefined);
      if (success) {
        showSuccess(`Report exported as ${format.toUpperCase()}`);
      } else {
        showError(`Failed to export as ${format.toUpperCase()}`);
      }
    } catch {
      showError(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                <div className="font-medium">Export CSV</div>
                <div className="text-xs text-[#71717a]">Full data</div>
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
                <div className="font-medium">Export PDF</div>
                <div className="text-xs text-[#71717a]">Formatted report</div>
              </div>
              {exporting === 'pdf' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomReportExportButton;
