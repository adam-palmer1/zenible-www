import React from 'react';
import Combobox from '../../ui/combobox/Combobox';

interface BulkActionsModalProps {
  darkMode: boolean;
  selectedEventsCount: number;
  bulkAction: string;
  setBulkAction: (action: string) => void;
  onExecute: () => void;
  onClose: () => void;
}

export default function BulkActionsModal({
  darkMode,
  selectedEventsCount,
  bulkAction,
  setBulkAction,
  onExecute,
  onClose,
}: BulkActionsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Bulk Actions
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Action
            </label>
            <Combobox
              options={[
                { id: 'activate', label: 'Activate' },
                { id: 'deactivate', label: 'Deactivate' },
                { id: 'delete', label: 'Delete' },
              ]}
              value={bulkAction}
              onChange={(value) => setBulkAction(value)}
              placeholder="Select action..."
              allowClear={false}
            />
          </div>

          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            {selectedEventsCount} event(s) selected
          </p>
        </div>
        <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <button
            onClick={onExecute}
            disabled={!bulkAction}
            className={`px-4 py-2 rounded-lg ${
              bulkAction
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Execute
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
