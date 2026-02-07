import React, { useMemo } from 'react';
import { X, Clock, Plus, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

interface UnbilledHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lineItems: any[]) => void;
  data: any;
  defaultCurrency: string;
  loading?: boolean;
}

const UnbilledHoursModal: React.FC<UnbilledHoursModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  data,
  defaultCurrency,
  loading = false,
}) => {
  // Get currency from the billable hours data (use first item's currency, fallback to company default)
  const currency = data?.items?.[0]?.currency?.code || defaultCurrency;
  // Group hours by project
  const projectGroups = useMemo(() => {
    if (!data?.items?.length) return [];

    const groups: Record<string, any> = {};
    data.items.forEach((entry: any) => {
      const projectId = entry.project_id || 'no-project';
      if (!groups[projectId]) {
        groups[projectId] = {
          projectId,
          projectName: entry.project?.name || 'Unnamed Project',
          entries: [],
          totalHours: 0,
          hourlyRate: parseFloat(entry.hourly_rate) || 0,
          totalAmount: 0,
        };
      }
      groups[projectId].entries.push(entry);
      groups[projectId].totalHours += parseFloat(entry.hours) || 0;
      groups[projectId].totalAmount += parseFloat(entry.amount) || 0;
      // Use the rate from entries (they should all be the same for a project)
      if (!groups[projectId].hourlyRate && entry.hourly_rate) {
        groups[projectId].hourlyRate = parseFloat(entry.hourly_rate);
      }
    });

    return Object.values(groups);
  }, [data?.items]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Build line items from grouped data
  const buildLineItems = () => {
    return projectGroups.map((group: any) => {
      // Build description with breakdown of hours (sorted by date descending)
      const sortedEntries = [...group.entries].sort((a: any, b: any) => {
        const dateA = new Date(a.start_time || a.created_at);
        const dateB = new Date(b.start_time || b.created_at);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });

      const descriptionLines = sortedEntries.map((entry: any) => {
        const date = formatDate(entry.start_time || entry.created_at);
        const hours = parseFloat(entry.hours).toFixed(2);
        const desc = entry.description || 'Work';
        return `${date}: ${desc} (${hours}h)`;
      });

      return {
        description: `${group.projectName} hours`,
        subtext: descriptionLines.join('\n'),
        quantity: parseFloat(group.totalHours.toFixed(2)),
        price: group.hourlyRate,
        amount: parseFloat((group.totalHours * group.hourlyRate).toFixed(2)),
        taxes: [],
        tax_amount: 0,
        // Store entry IDs for potential linking after invoice is saved
        _billable_hour_ids: group.entries.map((e: any) => e.id),
        _project_id: group.projectId !== 'no-project' ? group.projectId : null,
      };
    });
  };

  const handleConfirm = () => {
    const lineItems = buildLineItems();
    onConfirm(lineItems);
  };

  if (!isOpen) return null;

  const totalHours = parseFloat(data?.uninvoiced_hours || data?.total_hours || 0);
  const totalAmount = parseFloat(data?.uninvoiced_amount || data?.total_amount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Unbilled Hours Found
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This client has unbilled hours. Would you like to add them to this invoice?
              </p>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Hours</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {totalHours.toFixed(2)}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Value</span>
                  <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {formatCurrency(totalAmount, currency)}
                  </span>
                </div>
              </div>

              {/* Project breakdown */}
              {projectGroups.length > 1 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    By Project
                  </p>
                  {projectGroups.map((group: any) => (
                    <div
                      key={group.projectId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700 dark:text-gray-300 truncate mr-2">
                        {group.projectName}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {group.totalHours.toFixed(2)}h - {formatCurrency(group.totalAmount, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            No Thanks
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !projectGroups.length}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Yes, Add to Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnbilledHoursModal;
