import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  darkMode?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this item?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  darkMode
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md rounded-xl p-6 ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
            <svg className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              {title}
            </h3>
            <p className={`mt-1 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-600'}`}>
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              darkMode
                ? 'bg-zenible-dark-bg text-zenible-dark-text hover:bg-zenible-dark-sidebar'
                : 'bg-gray-100 text-zinc-700 hover:bg-gray-200'
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
