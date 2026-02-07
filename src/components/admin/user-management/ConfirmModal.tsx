import React from 'react';
import { Loader2 } from 'lucide-react';
import { ConfirmModalState } from './types';

interface ConfirmModalProps {
  confirmModal: ConfirmModalState;
  confirmLoading: boolean;
  setConfirmModal: (val: ConfirmModalState) => void;
  setConfirmLoading: (val: boolean) => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ confirmModal, confirmLoading, setConfirmModal, setConfirmLoading }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !confirmLoading && setConfirmModal({ ...confirmModal, open: false })} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {confirmModal.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {confirmModal.message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setConfirmModal({ ...confirmModal, open: false })}
            disabled={confirmLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setConfirmLoading(true);
              try {
                await confirmModal.action?.();
              } finally {
                setConfirmLoading(false);
                setConfirmModal({ ...confirmModal, open: false });
              }
            }}
            disabled={confirmLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
              confirmModal.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : confirmModal.variant === 'warning'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {confirmLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
