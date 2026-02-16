import React, { useState, useMemo, useEffect } from 'react';
import { X, Clock, Plus, Loader2, Check } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

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
  useEscapeKey(onClose, isOpen);

  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

  // Get currency from the billable hours data (use first item's currency, fallback to company default)
  const currency = data?.items?.[0]?.currency?.code || defaultCurrency;

  // Group hours by service
  const serviceGroups = useMemo(() => {
    if (!data?.items?.length) return [];

    const groups: Record<string, any> = {};
    data.items.forEach((entry: any) => {
      const serviceId = entry.contact_service_id || 'no-service';
      if (!groups[serviceId]) {
        groups[serviceId] = {
          serviceId,
          serviceName: entry.contact_service?.name || 'General Hours',
          entries: [],
          totalHours: 0,
          hourlyRate: parseFloat(entry.hourly_rate) || 0,
          totalAmount: 0,
        };
      }
      groups[serviceId].entries.push(entry);
      groups[serviceId].totalHours += parseFloat(entry.hours) || 0;
      groups[serviceId].totalAmount += parseFloat(entry.amount) || 0;
      if (!groups[serviceId].hourlyRate && entry.hourly_rate) {
        groups[serviceId].hourlyRate = parseFloat(entry.hourly_rate);
      }
    });

    return Object.values(groups);
  }, [data?.items]);

  // Pre-select all services when data loads
  useEffect(() => {
    if (serviceGroups.length > 0) {
      setSelectedServiceIds(new Set(serviceGroups.map((g: any) => g.serviceId)));
    }
  }, [serviceGroups]);

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedServiceIds.size === serviceGroups.length) {
      setSelectedServiceIds(new Set());
    } else {
      setSelectedServiceIds(new Set(serviceGroups.map((g: any) => g.serviceId)));
    }
  };

  // Calculate selected totals
  const selectedTotals = useMemo(() => {
    let hours = 0;
    let amount = 0;
    serviceGroups.forEach((group: any) => {
      if (selectedServiceIds.has(group.serviceId)) {
        hours += group.totalHours;
        amount += group.totalAmount;
      }
    });
    return { hours, amount };
  }, [serviceGroups, selectedServiceIds]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Build line items from selected service groups
  const buildLineItems = () => {
    return serviceGroups
      .filter((group: any) => selectedServiceIds.has(group.serviceId))
      .map((group: any) => {
        const sortedEntries = [...group.entries].sort((a: any, b: any) => {
          const dateA = new Date(a.start_time || a.created_at);
          const dateB = new Date(b.start_time || b.created_at);
          return dateB.getTime() - dateA.getTime();
        });

        const descriptionLines = sortedEntries.map((entry: any) => {
          const date = formatDate(entry.start_time || entry.created_at);
          const hours = parseFloat(entry.hours).toFixed(2);
          const desc = entry.description || 'Work';
          return `${date}: ${desc} (${hours}h)`;
        });

        return {
          description: `${group.serviceName} hours`,
          subtext: descriptionLines.join('\n'),
          quantity: parseFloat(group.totalHours.toFixed(2)),
          price: group.hourlyRate,
          amount: parseFloat((group.totalHours * group.hourlyRate).toFixed(2)),
          taxes: [],
          tax_amount: 0,
          _billable_hour_ids: group.entries.map((e: any) => e.id),
          _project_id: group.entries[0]?.project_id || null,
          _contact_service_id: group.serviceId !== 'no-service' ? group.serviceId : null,
        };
      });
  };

  const handleConfirm = () => {
    const lineItems = buildLineItems();
    onConfirm(lineItems);
  };

  if (!isOpen) return null;

  const allSelected = selectedServiceIds.size === serviceGroups.length && serviceGroups.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
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
                This client has unbilled hours. Select which services to add to this invoice:
              </p>

              {/* Summary - shows selected totals */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Selected Hours</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedTotals.hours.toFixed(2)}h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Selected Value</span>
                  <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {formatCurrency(selectedTotals.amount, currency)}
                  </span>
                </div>
              </div>

              {/* Select All */}
              {serviceGroups.length > 1 && (
                <label className="flex items-center gap-2 mb-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      allSelected
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-300 dark:border-gray-500 hover:border-purple-400'
                    }`}
                  >
                    {allSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select All
                  </span>
                </label>
              )}

              {/* Service list */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {serviceGroups.map((group: any) => {
                  const isSelected = selectedServiceIds.has(group.serviceId);
                  return (
                    <label
                      key={group.serviceId}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleService(group.serviceId)}
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300 dark:border-gray-500'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {group.serviceName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'} &middot; {group.totalHours.toFixed(2)}h
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {formatCurrency(group.totalAmount, currency)}
                      </span>
                    </label>
                  );
                })}
              </div>
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
            disabled={loading || selectedServiceIds.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Selected to Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnbilledHoursModal;
