import React, { useState, useEffect } from 'react';
import { TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currencyUtils';
import contactsAPI from '../../services/api/crm/contacts';

/**
 * Display list of attributions for a service
 */
const AttributionsList = ({
  attributions = [],
  loading = false,
  onDelete,
  currencyCode,
}) => {
  const [contactsMap, setContactsMap] = useState({});
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Fetch contact details for attributions that don't have embedded contact data
  useEffect(() => {
    const fetchContactDetails = async () => {
      const contactIds = attributions
        .filter(a => a.contact_id && !a.contact)
        .map(a => a.contact_id)
        .filter(id => !contactsMap[id]);

      if (contactIds.length === 0) return;

      setLoadingContacts(true);
      const newContacts = {};

      await Promise.all(
        contactIds.map(async (contactId) => {
          try {
            const contact = await contactsAPI.get(contactId);
            newContacts[contactId] = contact;
          } catch (error) {
            console.error(`Failed to fetch contact ${contactId}:`, error);
            newContacts[contactId] = null;
          }
        })
      );

      setContactsMap(prev => ({ ...prev, ...newContacts }));
      setLoadingContacts(false);
    };

    fetchContactDetails();
  }, [attributions]);

  // Helper to get contact display name
  const getContactName = (attribution) => {
    const contact = attribution.contact || contactsMap[attribution.contact_id];
    if (!contact) {
      return loadingContacts ? 'Loading...' : 'Unknown Contact';
    }
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    return name || contact.business_name || 'Unnamed Contact';
  };

  const getContactBusiness = (attribution) => {
    const contact = attribution.contact || contactsMap[attribution.contact_id];
    if (!contact) return null;
    const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    // Only show business name in parentheses if we also have a personal name
    if (name && contact.business_name) {
      return contact.business_name;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  if (attributions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>No attributions yet</p>
        <p className="text-sm mt-1">Attribute portions of this service to other contacts for billing</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attributions.map((attribution) => (
        <div
          key={attribution.id}
          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(parseFloat(attribution.amount), currencyCode)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">→</span>
              <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <UserIcon className="h-4 w-4 text-gray-400" />
                {getContactName(attribution)}
                {getContactBusiness(attribution) && (
                  <span className="text-gray-500 ml-1">({getContactBusiness(attribution)})</span>
                )}
              </span>
            </div>
            {attribution.notes && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {attribution.notes}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {new Date(attribution.attributed_at).toLocaleDateString()}
            </p>
          </div>

          {onDelete && (
            <button
              onClick={() => onDelete(attribution.id)}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
              title="Delete attribution"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AttributionsList;
