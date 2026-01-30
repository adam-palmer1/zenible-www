import React, { useState } from 'react';
import Modal from '../ui/modal/Modal';
import ContactFormTabbed from './forms/ContactFormTabbed';
import { useCRM } from '../../contexts/CRMContext';
import { useContacts, useContactStatuses, useCompanyCurrencies } from '../../hooks/crm';

/**
 * Modal for adding/editing contacts
 * - Uses ContactFormTabbed with 4 internal tabs (Basic, Address, Additional, Finance)
 * - All data submitted together via single form
 * - No real-time API updates - standard form pattern
 */
const AddContactModal = ({ isOpen, onClose, contact = null }) => {
  const { refresh, initialContactStatus, initialContactType } = useCRM();
  const { createContact, updateContact, getContact } = useContacts({}, 0, { skipInitialFetch: true });
  const { allStatuses } = useContactStatuses();
  const { companyCurrencies, loadData: loadCurrencies } = useCompanyCurrencies({ skipInitialFetch: true });

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fullContact, setFullContact] = useState(null);
  const [fetchingContact, setFetchingContact] = useState(false);

  // Load currencies when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadCurrencies();
    }
  }, [isOpen, loadCurrencies]);

  // Fetch full contact details when editing (list view only has minimal fields)
  React.useEffect(() => {
    const fetchFullContact = async () => {
      if (isOpen && contact?.id) {
        try {
          setFetchingContact(true);
          const fullData = await getContact(contact.id);
          setFullContact(fullData);
        } catch (error) {
          console.error('Failed to fetch full contact:', error);
          // Fallback to partial contact if fetch fails
          setFullContact(contact);
        } finally {
          setFetchingContact(false);
        }
      } else if (isOpen && !contact) {
        // New contact - no need to fetch
        setFullContact(null);
      }
    };

    fetchFullContact();
  }, [isOpen, contact?.id, getContact]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setSubmitError(null);

      if (fullContact) {
        // Update contact - useContacts already updates local state with API response
        await updateContact(fullContact.id, formData);
      } else {
        // Create contact - useContacts already adds to local state
        await createContact(formData);
      }

      // Only refresh if creating a new contact (to ensure it appears in filtered views)
      // For updates, the local state is already updated, so no need to refetch
      if (!fullContact) {
        refresh();
      }

      onClose();
    } catch (error) {
      console.error('Failed to save contact:', error);
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={onClose}
      title={fullContact ? 'Edit Contact' : 'Add New Contact'}
      size="3xl"
    >
      {fetchingContact ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary mx-auto mb-4"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Loading contact details...</p>
          </div>
        </div>
      ) : (
        <ContactFormTabbed
          key={fullContact?.id || 'new'}
          contact={fullContact}
          initialStatus={initialContactStatus}
          initialContactType={initialContactType}
          allStatuses={allStatuses}
          companyCurrencies={companyCurrencies}
          onSubmit={handleSubmit}
          loading={loading}
          submitError={submitError}
        />
      )}

      {/* Cancel Button - Only show when not fetching */}
      {!fetchingContact && (
        <div className="flex items-center justify-start gap-3 -mt-4 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </Modal>
  );
};

export default AddContactModal;
