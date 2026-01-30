import React from 'react';
import { X, Clock, Check, Loader2 } from 'lucide-react';

/**
 * MarkHoursBilledModal - Prompts user to mark billable hours as billed after invoice save
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Called when modal is dismissed (don't mark)
 * @param {Function} props.onConfirm - Called when user confirms (mark as billed)
 * @param {number} props.hoursCount - Number of hours entries to mark
 * @param {boolean} props.loading - Show loading state during API call
 */
const MarkHoursBilledModal = ({
  isOpen,
  onClose,
  onConfirm,
  hoursCount = 0,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={loading ? undefined : onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mark Hours as Billed?
            </h2>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Would you like to mark the {hoursCount} billable hour{hoursCount !== 1 ? ' entries' : ' entry'} as billed
            and link {hoursCount !== 1 ? 'them' : 'it'} to this invoice?
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This will prevent these hours from appearing as unbilled in the future
              and link them to this invoice for tracking purposes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            No, Keep Unbilled
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Marking...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Yes, Mark as Billed
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkHoursBilledModal;
