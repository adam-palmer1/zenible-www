import React from 'react';

interface BulkActionsBarProps {
  darkMode: boolean;
  selectedCount: number;
  onBulkUpdate: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export default function BulkActionsBar({
  darkMode,
  selectedCount,
  onBulkUpdate,
  onBulkDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  return (
    <div className="px-6 pb-4">
      <div className={`p-4 rounded-lg border flex items-center justify-between ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-blue-50 border-blue-200'}`}>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
            {selectedCount} tag{selectedCount !== 1 ? 's' : ''} selected
          </span>
          {selectedCount > 100 && (
            <span className="text-sm text-red-600">
              Warning: Maximum 100 tags can be updated at once
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBulkUpdate}
            disabled={selectedCount > 100}
            className={`px-4 py-2 rounded-lg ${
              selectedCount <= 100
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Bulk Update
          </button>
          <button
            onClick={onBulkDelete}
            disabled={selectedCount > 100}
            className={`px-4 py-2 rounded-lg ${
              selectedCount <= 100
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Bulk Delete
          </button>
          <button
            onClick={onClearSelection}
            className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}
