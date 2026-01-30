import React, { useState, useEffect } from 'react';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useBillableHours } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { formatCurrency } from '../../utils/currencyUtils';
import BillableHourEntry from './BillableHourEntry';
import BillableHourModal from './BillableHourModal';
import ConfirmationModal from '../common/ConfirmationModal';

/**
 * Billable Hours tab content for ProjectDetailModal
 */
const BillableHoursTab = ({
  projectId,
  defaultRate,
  defaultCurrencyId,
  currency = 'USD',
  contactCurrencyId = null, // Client's default currency ID
  contactCurrencyCode = null, // Client's default currency code
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

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
      const filters = {};
      if (uninvoicedOnly) filters.uninvoiced_only = true;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      fetchEntries(filters);
    }
  }, [projectId, fetchEntries, uninvoicedOnly, startDate, endDate]);

  // Handle add new entry
  const handleAdd = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  // Handle edit entry
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  // Handle save (create or update)
  const handleSave = async (data) => {
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, data);
        showSuccess('Entry updated');
      } else {
        await createEntry(data);
        showSuccess('Hours logged');
      }
      setShowModal(false);
      setEditingEntry(null);
    } catch (err) {
      throw err; // Let modal handle error display
    }
  };

  // Handle duplicate
  const handleDuplicate = async (entry) => {
    try {
      await duplicateEntry(entry.id);
      showSuccess('Entry duplicated');
    } catch (err) {
      showError(err.message || 'Failed to duplicate entry');
    }
  };

  // Handle delete click
  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    try {
      await deleteEntry(entryToDelete.id);
      showSuccess('Entry deleted');
      setShowDeleteConfirm(false);
      setEntryToDelete(null);
    } catch (err) {
      showError(err.message || 'Failed to delete entry');
    }
  };

  // Handle link to invoice
  const handleLinkInvoice = (entry) => {
    showInfo('Invoice linking coming soon');
  };

  // Handle unlink from invoice
  const handleUnlinkInvoice = async (entry) => {
    try {
      await unlinkFromInvoice(entry.id);
      showSuccess('Entry unlinked from invoice');
    } catch (err) {
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
            onChange={(e) => setUninvoicedOnly(e.target.checked)}
            className="rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Uninvoiced Only</span>
        </label>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <span className="text-gray-500">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
        </div>
      )}

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
          {entries.map(entry => (
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
      {!loading && (parseFloat(summary.total_hours) > 0 || parseFloat(summary.total_amount) > 0) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Total</span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {parseFloat(summary.total_hours).toFixed(2)}h ({formatCurrency(summary.total_amount, currency)})
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Uninvoiced</span>
                <p className="font-semibold text-purple-600 dark:text-purple-400">
                  {parseFloat(summary.uninvoiced_hours).toFixed(2)}h ({formatCurrency(summary.uninvoiced_amount, currency)})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <BillableHourModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingEntry(null);
        }}
        projectId={projectId}
        entry={editingEntry}
        defaultRate={defaultRate}
        contactCurrencyId={contactCurrencyId}
        contactCurrencyCode={contactCurrencyCode}
        projectCurrencyCode={currency}
        projectCurrencyId={defaultCurrencyId}
        onSuccess={handleSave}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setEntryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Billable Hours Entry?"
        message={
          <p>
            Are you sure you want to delete this entry for{' '}
            <strong>{entryToDelete?.hours}h</strong>
            {entryToDelete?.description && ` - "${entryToDelete.description}"`}?
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
