import React, { useEffect } from 'react';
import { X, Check, Shield } from 'lucide-react';
import { RoleSelectorModalProps } from './types';
import { ROLE_OPTIONS } from './constants';

/**
 * Role Selection Modal - Full screen centered modal
 */
const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({ isOpen, onClose, selectedRole, onSelect }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Role
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Role List */}
        <div className="py-2">
          {ROLE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => { onSelect(option.id); onClose(); }}
              className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                option.id === selectedRole ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
              </div>
              {option.id === selectedRole && <Check className="h-5 w-5 text-blue-600" />}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectorModal;
