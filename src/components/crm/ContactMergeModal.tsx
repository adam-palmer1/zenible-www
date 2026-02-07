import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Z_INDEX } from '../../constants/crm';
import contactsAPI from '../../services/api/crm/contacts';
import { getContactDisplayName } from '../../utils/crm/contactUtils';
import { useNotification } from '../../contexts/NotificationContext';

interface ContactMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceContact: any;
  onMergeComplete?: (result: any) => void;
}

const ContactMergeModal: React.FC<ContactMergeModalProps> = ({ isOpen, onClose, sourceContact, onMergeComplete }) => {
  const { showSuccess, showError } = useNotification() as any;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<'select' | 'confirm' | 'result'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [merging, setMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<any>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedTarget(null);
      setMergeResult(null);
      // Focus search input after a short delay
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search for contacts as user types
  const searchContacts = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const result = await (contactsAPI as any).searchForMerge(query, sourceContact?.id);
      setSearchResults(result.items || []);
    } catch (error) {
      console.error('Failed to search contacts:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [sourceContact?.id]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContacts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchContacts]);

  // Handle merge confirmation
  const handleMerge = async () => {
    if (!selectedTarget || !sourceContact) return;

    setMerging(true);
    try {
      const result = await (contactsAPI as any).merge(selectedTarget.id, sourceContact.id);
      setMergeResult(result);
      setStep('result');

      // Notify parent to refresh
      if (onMergeComplete) {
        onMergeComplete(result);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to merge contacts');
      setMerging(false);
    }
  };

  // Handle close after result
  const handleClose = () => {
    if (step === 'result' && mergeResult?.success) {
      showSuccess(mergeResult.message || 'Contacts merged successfully');
    }
    onClose();
  };

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !merging) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, merging]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !sourceContact) return null;

  const sourceDisplayName = getContactDisplayName(sourceContact, 'Source Contact');
  const targetDisplayName = selectedTarget
    ? getContactDisplayName(selectedTarget, 'Target Contact')
    : null;

  // Calculate total records transferred
  const getTotalRecords = (records: any): number => {
    if (!records) return 0;
    return (Object.values(records) as number[]).reduce((sum: number, count: number) => sum + count, 0);
  };

  // Format field name for display
  const formatFieldName = (field: string) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: (Z_INDEX as any).MODAL_BACKDROP }}
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !merging) {
          handleClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal Content */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden"
        style={{ zIndex: (Z_INDEX as any).MODAL }}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step === 'result' ? 'Merge Complete' : 'Merge Contacts'}
          </h2>
          <button
            onClick={handleClose}
            disabled={merging}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {step === 'select' && (
            <>
              {/* Source Contact Display */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contact to merge (will be deleted)
                </label>
                <div className="flex items-center gap-3 p-3 bg-[#8e51ff]/10 dark:bg-[#a684ff]/10 border border-[#8e51ff]/30 dark:border-[#a684ff]/30 rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#8e51ff]/20 dark:bg-[#a684ff]/20 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-[#8e51ff] dark:text-[#a684ff]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {sourceDisplayName}
                    </p>
                    {sourceContact.email && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {sourceContact.email}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-[#8e51ff] dark:text-[#a684ff] bg-[#8e51ff]/20 dark:bg-[#a684ff]/20 px-2 py-1 rounded">
                    Source
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center my-3">
                <ArrowRightIcon className="h-5 w-5 text-gray-400 rotate-90" />
              </div>

              {/* Target Contact Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Merge into (will be kept)
                </label>

                {selectedTarget ? (
                  <div className="flex items-center gap-3 p-3 bg-[#8e51ff]/20 dark:bg-[#a684ff]/20 border border-[#8e51ff] dark:border-[#a684ff] rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {targetDisplayName}
                      </p>
                      {selectedTarget.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {selectedTarget.email}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTarget(null)}
                      className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        placeholder="Search contacts by name or email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Search Results */}
                    {searchQuery.length >= 2 && (
                      <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                        {searching ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            <div className="animate-spin h-5 w-5 border-2 border-zenible-primary border-t-transparent rounded-full mx-auto mb-2" />
                            Searching...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No contacts found
                          </div>
                        ) : (
                          searchResults.map((contact: any) => (
                            <button
                              key={contact.id}
                              onClick={() => setSelectedTarget(contact)}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            >
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {getContactDisplayName(contact)}
                                </p>
                                {contact.email && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {contact.email}
                                  </p>
                                )}
                              </div>
                              {(contact.is_client || contact.is_vendor) && (
                                <div className="flex gap-1">
                                  {contact.is_client && (
                                    <span className="text-xs bg-zenible-primary text-white px-2 py-0.5 rounded">
                                      Client
                                    </span>
                                  )}
                                  {contact.is_vendor && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                      Vendor
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Info Message */}
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">How merge works:</p>
                    <ul className="list-disc list-inside text-xs space-y-1 text-amber-700 dark:text-amber-300">
                      <li>All records (invoices, notes, etc.) will be transferred</li>
                      <li>Target contact's data is preserved for conflicts</li>
                      <li>Empty fields on target will be filled from source</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              {/* Confirmation View */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* Source */}
                <div className="flex-1 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#8e51ff]/20 dark:bg-[#a684ff]/20 flex items-center justify-center mx-auto mb-2">
                    <UserIcon className="h-8 w-8 text-[#8e51ff] dark:text-[#a684ff]" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {sourceDisplayName}
                  </p>
                  <p className="text-xs text-[#8e51ff] dark:text-[#a684ff]">will be deleted</p>
                </div>

                {/* Arrow */}
                <ArrowRightIcon className="h-6 w-6 text-gray-400 flex-shrink-0" />

                {/* Target */}
                <div className="flex-1 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center mx-auto mb-2">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {targetDisplayName}
                  </p>
                  <p className="text-xs text-[#8e51ff] dark:text-[#a684ff]">will be kept</p>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      Are you sure?
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      All invoices, quotes, payments, and other records from{' '}
                      <strong>{sourceDisplayName}</strong> will be transferred to{' '}
                      <strong>{targetDisplayName}</strong>.
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-2 font-medium">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'result' && mergeResult && (
            <>
              {/* Success View */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {mergeResult.message}
                </p>
              </div>

              {/* Records Transferred */}
              {getTotalRecords(mergeResult.records_transferred) > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Records Transferred
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(mergeResult.records_transferred)
                      .filter(([, count]) => (count as number) > 0)
                      .map(([key, count]) => (
                        <div
                          key={key}
                          className="flex justify-between py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded"
                        >
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatFieldName(key)}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {count as number}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Fields Updated */}
              {mergeResult.attributes_filled?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Fields Updated on {targetDisplayName}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mergeResult.attributes_filled.map((field: string) => (
                      <span
                        key={field}
                        className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                      >
                        {formatFieldName(field)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {step === 'select' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedTarget}
                className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary hover:bg-opacity-90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('select')}
                disabled={merging}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleMerge}
                disabled={merging}
                className="px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] hover:bg-[#7a3fe6] dark:bg-[#a684ff] dark:hover:bg-[#9370ff] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {merging ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Merging...
                  </>
                ) : (
                  'Merge Contacts'
                )}
              </button>
            </>
          )}

          {step === 'result' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary hover:bg-opacity-90 rounded-lg transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ContactMergeModal;
