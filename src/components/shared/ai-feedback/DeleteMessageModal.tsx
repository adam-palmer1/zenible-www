import React from 'react';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface DeleteMessageModalProps {
  darkMode: boolean;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  darkMode,
  open,
  onClose,
  onConfirm,
  loading = false,
}) => {
  useEscapeKey(onClose, open && !loading);

  if (!open) return null;

  const handleBackdropClick = () => {
    if (!loading) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleBackdropClick}
        />

        {/* Dialog card */}
        <div
          className={`inline-block w-full max-w-sm my-8 overflow-hidden text-left align-middle transition-all transform shadow-xl rounded-lg ${
            darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-zinc-900'
          }`}
        >
          <div className="px-6 py-5">
            <h3 className="text-base font-semibold mb-2">Delete message?</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              The message will be removed from this conversation and excluded from
              future AI context. This cannot be undone.
            </p>
          </div>

          <div
            className={`px-6 py-3 border-t flex justify-end gap-3 ${
              darkMode ? 'border-[#333333]' : 'border-gray-200'
            }`}
          >
            <button
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                darkMode
                  ? 'text-gray-200 bg-transparent border-[#4a4a4a] hover:bg-[#2a2a2a]'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => void onConfirm()}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded-md bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loading && (
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;
