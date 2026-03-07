import React from 'react';
import { CreditCard, X } from 'lucide-react';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface AutoBillingConfirmModalProps {
  isOpen: boolean;
  onBillNow: () => void;
  onSendWithoutBilling: () => void;
  onCancel: () => void;
}

const AutoBillingConfirmModal: React.FC<AutoBillingConfirmModalProps> = ({
  isOpen,
  onBillNow,
  onSendWithoutBilling,
  onCancel,
}) => {
  useEscapeKey(onCancel, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onCancel}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Automatic Payment
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    This client has a saved card for automatic payments. Would you like to bill this card immediately?
                  </p>
                </div>
              </div>
              <button
                onClick={onCancel}
                className="ml-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSendWithoutBilling}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors"
            >
              Send Without Billing
            </button>
            <button
              type="button"
              onClick={onBillNow}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-zenible-primary hover:bg-purple-700 text-white"
            >
              Send & Bill Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoBillingConfirmModal;
