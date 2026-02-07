import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCRMReferenceData } from '../../contexts/CRMReferenceDataContext';

interface RecurringScopeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: string) => void;
  mode?: 'edit' | 'delete';
  appointment?: any;
}

const RecurringScopeDialog: React.FC<RecurringScopeDialogProps> = ({ isOpen, onClose, onConfirm, mode = 'edit', appointment: _appointment }) => {
  const { editScopes } = useCRMReferenceData();
  const [selectedScope, setSelectedScope] = useState('this');

  if (!isOpen) return null;

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Edit Recurring Appointment' : 'Delete Recurring Appointment';
  const confirmText = isEdit ? 'Save' : 'Delete';
  const confirmClass = isEdit
    ? 'bg-purple-600 hover:bg-purple-700'
    : 'bg-red-600 hover:bg-red-700';

  const handleConfirm = () => {
    onConfirm(selectedScope);
    onClose();
  };

  // Get mode-specific description for each scope
  const getScopeDescription = (scopeValue: string) => {
    const descriptions: Record<string, string> = {
      'this': isEdit
        ? 'Only this occurrence will be changed. Other occurrences will remain unchanged.'
        : 'Only this occurrence will be deleted. Other occurrences will remain.',
      'this_and_future': isEdit
        ? 'This occurrence and all future occurrences will be changed. Past occurrences will remain unchanged.'
        : 'This occurrence and all future occurrences will be deleted. Past occurrences will remain.',
      'all': isEdit
        ? 'All occurrences of this recurring appointment will be changed.'
        : 'The entire recurring appointment series will be deleted.'
    };
    return descriptions[scopeValue] || '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-600 mb-4">
              This is a recurring appointment. What would you like to {isEdit ? 'edit' : 'delete'}?
            </p>

            <div className="space-y-3">
              {editScopes.map((scope) => (
                <label
                  key={scope.value}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="scope"
                    value={scope.value}
                    checked={selectedScope === scope.value}
                    onChange={(e) => setSelectedScope(e.target.value)}
                    className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {scope.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getScopeDescription(scope.value)}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${confirmClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecurringScopeDialog;
