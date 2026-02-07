import React, { useState } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';
import { useContacts } from '../../../hooks/crm';
import contactsAPI from '../../../services/api/crm/contacts';
import { useNotification } from '../../../contexts/NotificationContext';

interface ConvertToClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConvertToClientModal: React.FC<ConvertToClientModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [converting, setConverting] = useState(false);
  const { showError, showSuccess } = useNotification();

  // Fetch non-client contacts
  const { contacts, loading } = useContacts({ is_client: false });

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.first_name?.toLowerCase().includes(query) ||
      contact.last_name?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.business_name?.toLowerCase().includes(query)
    );
  });

  const handleConvert = async () => {
    if (!selectedContact) return;

    setConverting(true);
    try {
      await contactsAPI.update(selectedContact.id, {
        is_client: true
      });

      showSuccess(`${selectedContact.first_name} ${selectedContact.last_name} has been converted to a client`);

      // Close modal and refresh
      onClose();

      // Reload to refresh clients list
      window.location.reload();
    } catch (error) {
      console.error('Error converting to client:', error);
      showError('Failed to convert contact to client');
    } finally {
      setConverting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl design-bg-primary rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-design-border-light px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold design-text-primary">Convert Contact to Client</h2>
              <p className="text-sm design-text-secondary mt-1">
                Select a contact from your CRM to convert them into a client
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 design-text-secondary" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-design-border-light">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 design-text-secondary" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-design-border-input rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-zenible-primary design-bg-primary design-text-primary"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <p className="design-text-secondary">
                  {searchQuery ? 'No contacts found matching your search' : 'No contacts available to convert'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact: any) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                      selectedContact?.id === contact.id
                        ? 'border-zenible-primary bg-purple-50 dark:bg-purple-900/20'
                        : 'border-design-border-light hover:border-zenible-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        {contact.profile_picture ? (
                          <img src={contact.profile_picture} alt={`${contact.first_name} ${contact.last_name}`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-medium text-sm design-text-secondary">
                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-medium design-text-primary">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm design-text-secondary">
                          {contact.email || contact.business_name || 'No email'}
                        </p>
                      </div>
                    </div>
                    {selectedContact?.id === contact.id && (
                      <CheckCircle className="h-5 w-5 text-zenible-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-design-border-light px-6 py-4">
            <p className="text-sm design-text-secondary">
              {selectedContact
                ? `Converting "${selectedContact.first_name} ${selectedContact.last_name}" to a client`
                : 'Select a contact to convert'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary"
              >
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={!selectedContact || converting}
                className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary rounded-md hover:bg-zenible-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {converting ? 'Converting...' : 'Convert to Client'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertToClientModal;
