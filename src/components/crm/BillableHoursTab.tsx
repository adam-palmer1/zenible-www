import React, { useState, useEffect } from 'react';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useBillableHours } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { useModalState } from '../../hooks/useModalState';
import { useDeleteConfirmation } from '../../hooks/useDeleteConfirmation';
import { formatCurrency } from '../../utils/currencyUtils';
import BillableHourEntry from './BillableHourEntry';
import BillableHourModal from './BillableHourModal';
import ConfirmationModal from '../common/ConfirmationModal';
import DatePickerCalendar from '../shared/DatePickerCalendar';
import { LoadingSpinner } from '../shared';

interface BillableHoursTabProps {
  projectId: string;
  defaultRate: any;
  defaultCurrencyId: string;
  currency?: string;
  contactCurrencyId?: string | null;
  contactCurrencyCode?: string | null;
  services?: any[];
}

/**
 * Billable Hours tab content for ProjectDetailModal
 */
const BillableHoursTab: React.FC<BillableHoursTabProps> = ({
  projectId,
  defaultRate,
  defaultCurrencyId,
  currency = 'USD',
  contactCurrencyId = null,
  contactCurrencyCode = null,
  services = [],
}) => {
  const entryModal = useModalState();
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const deleteConfirm = useDeleteConfirmation<any>();

  // Filters
  const [uninvoicedOnly, setUninvoicedOnly] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { showSuccess, showError, showInfo } = useNotification();

  const {
    entries,
    loading,
    error,
    summary,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    duplicateEntry,
    unlinkFromInvoice,
  } = useBillableHours(projectId);

  // Fetch entries on mount and when filters change
  useEffect(() => {
    if (projectId) {
      const filters: any = {};
      if (uninvoicedOnly) filters.uninvoiced_only = true;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      fetchEntries(filters);
    }
  }, [projectId, fetchEntries, uninvoicedOnly, startDate, endDate]);

  // Handle add new entry
  const handleAdd = () => {
    setEditingEntry(null);
    entryModal.open();
  };

  // Handle edit entry
  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    entryModal.open();
  };

  // Handle save (create or update)
  const handleSave = async (data: any) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, data);
      showSuccess('Entry updated');
    } else {
      await createEntry(data);
      showSuccess('Hours logged');
    }
    entryModal.close();
    setEditingEntry(null);
  };

  // Handle duplicate
  const handleDuplicate = async (entry: any) => {
    try {
      await duplicateEntry(entry.id);
      showSuccess('Entry duplicated');
    } catch (err: any) {
      showError(err.message || 'Failed to duplicate entry');
    }
  };

  // Handle delete click
  const handleDeleteClick = (entry: any) => {
    deleteConfirm.requestDelete(entry);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    await deleteConfirm.confirmDelete(async (entry) => {
      try {
        await deleteEntry(entry.id);
        showSuccess('Entry deleted');
      } catch (err: any) {
        showError(err.message || 'Failed to delete entry');
        throw err;
      }
    });
  };

  // Handle link to invoice
  const handleLinkInvoice = (_entry: any) => {
    showInfo('Invoice linking coming soon');
  };

  // Handle unlink from invoice
  const handleUnlinkInvoice = async (entry: any) => {
    try {
      await unlinkFromInvoice(entry.id);
      showSuccess('Entry unlinked from invoice');
    } catch (err: any) {
      showError(err.message || 'Failed to unlink entry');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setUninvoicedOnly(false);
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = uninvoicedOnly || startDate || endDate;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Billable Hours
        </h3>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Hours
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={uninvoicedOnly}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUninvoicedOnly(e.target.checked)}
            className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Uninvoiced Only</span>
        </label>

        <div className="flex items-center gap-2">
          <DatePickerCalendar
            value={startDate}
            onChange={(date) => setStartDate(date)}
          />
          <span className="text-gray-500">-</span>
          <DatePickerCalendar
            value={endDate}
            onChange={(date) => setEndDate(date)}
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-zenible-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && <LoadingSpinner size="h-8 w-8" height="py-8" />}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-red-600 dark:text-red-400">
          <p>Error loading billable hours: {error}</p>
          <button
            onClick={() => fetchEntries()}
            className="mt-2 text-sm text-zenible-primary hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-12">
          <ClockIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {hasFilters ? 'No matching entries' : 'No billable hours logged'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {hasFilters
              ? 'Try adjusting your filters'
              : 'Start tracking time spent on this project'
            }
          </p>
          {!hasFilters && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Log First Hours
            </button>
          )}
        </div>
      )}

      {/* Entries List */}
      {!loading && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry: any) => (
            <BillableHourEntry
              key={entry.id}
              entry={entry}
              currency={currency}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDeleteClick}
              onLinkInvoice={handleLinkInvoice}
              onUnlinkInvoice={handleUnlinkInvoice}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && (summary.total_hours > 0 || summary.total_amount > 0) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {summary.total_hours.toFixed(2)}h ({formatCurrency(summary.total_amount, currency)})
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Uninvoiced</span>
                <p className="font-semibold text-purple-600 dark:text-purple-400">
                  {summary.uninvoiced_hours.toFixed(2)}h ({formatCurrency(summary.uninvoiced_amount, currency)})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <BillableHourModal
        isOpen={entryModal.isOpen}
        onClose={() => {
          entryModal.close();
          setEditingEntry(null);
        }}
        projectId={projectId}
        entry={editingEntry}
        defaultRate={defaultRate}
        contactCurrencyId={contactCurrencyId}
        contactCurrencyCode={contactCurrencyCode}
        projectCurrencyCode={currency}
        projectCurrencyId={defaultCurrencyId}
        services={services}
        onSuccess={handleSave}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        onClose={deleteConfirm.cancelDelete}
        onConfirm={handleDeleteConfirm}
        title="Delete Billable Hours Entry?"
        message={
          <p>
            Are you sure you want to delete this entry for{' '}
            <strong>{deleteConfirm.item?.hours}h</strong>
            {deleteConfirm.item?.description && ` - "${deleteConfirm.item.description}"`}?
            This cannot be undone.
          </p>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
};

export default BillableHoursTab;
