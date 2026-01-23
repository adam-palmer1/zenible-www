import React, { useState, useEffect } from 'react';
import Modal from '../ui/modal/Modal';
import { formatCurrency } from '../../utils/currencyUtils';
import { useContacts } from '../../hooks/crm';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * Modal for creating a partial attribution to another contact
 */
const AddAttributionModal = ({
  isOpen,
  onClose,
  onSubmit,
  amountRemaining,
  currencyCode,
}) => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const { fetchContacts } = useContacts({}, 0, { skipInitialFetch: true });
  const { showError } = useNotification();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedContact(null);
      setAmount('');
      setNotes('');
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Search contacts
  useEffect(() => {
    const searchContacts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        const response = await fetchContacts({ search: searchQuery, per_page: 10 });
        setSearchResults(response?.items || []);
      } catch (error) {
        console.error('Failed to search contacts:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchContacts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, fetchContacts]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedContact) {
      showError('Please select a contact');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (parsedAmount > amountRemaining) {
      showError(`Amount cannot exceed remaining value (${formatCurrency(amountRemaining, currencyCode)})`);
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        contact_id: selectedContact.id,
        amount: parsedAmount,
        notes: notes || undefined,
      });
      onClose();
    } catch (error) {
      showError(error.message || 'Failed to create attribution');
    } finally {
      setLoading(false);
    }
  };

  const remainingAfterAttribution = amountRemaining - (parseFloat(amount) || 0);

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title="Add Attribution"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Attribute to Contact *
          </label>
          {selectedContact ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedContact.first_name} {selectedContact.last_name}
                </p>
                {selectedContact.business_name && (
                  <p className="text-sm text-gray-500">{selectedContact.business_name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zenible-primary"></div>
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => {
                        setSelectedContact(contact);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {contact.first_name} {contact.last_name}
                      </p>
                      {contact.business_name && (
                        <p className="text-sm text-gray-500">{contact.business_name}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount *
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={amountRemaining}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>Available: {formatCurrency(amountRemaining, currencyCode)}</span>
            {amount && (
              <span className={remainingAfterAttribution < 0 ? 'text-red-500' : ''}>
                After: {formatCurrency(Math.max(0, remainingAfterAttribution), currencyCode)}
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes about this attribution..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-zenible-primary focus:border-transparent"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !selectedContact || !amount || parseFloat(amount) > amountRemaining}
            className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Attribution'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddAttributionModal;
