import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, CheckIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import contactsAPI from '../../services/api/crm/contacts';

interface ContactSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: any) => void;
  selectedContactId?: string | null;
  anchorRef?: React.RefObject<HTMLElement> | null;
  filterParams?: Record<string, any>;
}

const ContactSelectorModal: React.FC<ContactSelectorModalProps> = ({ isOpen, onClose, onSelect, selectedContactId = null, anchorRef = null, filterParams = {} }) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [clientsOnly, setClientsOnly] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ first_name: '', last_name: '', business_name: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEscapeKey(onClose, isOpen);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current && !showAddForm) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showAddForm]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          anchorRef?.current && !anchorRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorRef]);

  useEffect(() => {
    if (isOpen && !showAddForm) {
      fetchContacts();
    }
  }, [isOpen, searchQuery, page, clientsOnly, showAddForm]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        per_page: 10,
        ...filterParams,
      };

      // Show clients by default (includes contacts that are both client and vendor)
      // Skip when for_project_selector is active — backend handles the compound filter
      if (clientsOnly && !filterParams?.for_project_selector) {
        params.is_client = true;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await (contactsAPI as unknown as Record<string, Function>).list(params);
      setContacts(response.items || []);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (contact: any) => {
    // If clicking the already-selected contact, unselect it
    if (contact.id === selectedContactId) {
      onSelect(null);
    } else {
      onSelect(contact);
    }
    setSearchQuery('');
    onClose();
  };

  const handleClearSelection = () => {
    onSelect(null);
    setSearchQuery('');
    onClose();
  };

  // Get display name - show business_name if no first/last name
  const getDisplayName = (contact: any) => {
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
    if (fullName) return fullName;
    if (contact.business_name) return contact.business_name;
    return 'No Name';
  };

  // Handle creating a new contact
  const handleCreateContact = async () => {
    setCreateError('');

    // Validate - need at least a name or business name
    if (!newContact.first_name && !newContact.last_name && !newContact.business_name) {
      setCreateError('Please enter a name or company');
      return;
    }

    setCreating(true);
    try {
      const created = await (contactsAPI as unknown as Record<string, Function>).create({
        first_name: newContact.first_name || null,
        last_name: newContact.last_name || null,
        business_name: newContact.business_name || null,
      });

      // Select the newly created contact
      onSelect(created);
      setNewContact({ first_name: '', last_name: '', business_name: '' });
      setShowAddForm(false);
      onClose();
    } catch (error: any) {
      console.error('Failed to create contact:', error);
      setCreateError(error.message || 'Failed to create contact');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewContact({ first_name: '', last_name: '', business_name: '' });
    setCreateError('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[28rem] flex flex-col"
      >
        {showAddForm ? (
          /* Add Contact Form */
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Add New Contact</h4>
              <button
                type="button"
                onClick={handleCancelAdd}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newContact.first_name}
                    onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="First name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newContact.last_name}
                    onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={newContact.business_name}
                  onChange={(e) => setNewContact({ ...newContact, business_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Company name"
                />
              </div>

              {createError && (
                <p className="text-xs text-red-600">{createError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateContact}
                  disabled={creating}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {/* Clients Only Checkbox — hidden when for_project_selector handles filtering */}
              {!filterParams?.for_project_selector && (
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="clients-only"
                    checked={clientsOnly}
                    onChange={(e) => {
                      setClientsOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="clients-only" className="ml-2 text-xs text-gray-600">
                    Clients only
                  </label>
                </div>
              )}
            </div>

            {/* Add Contact Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full text-left px-4 py-2.5 border-b border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-2 text-purple-600"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Add Contact</span>
            </button>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  {searchQuery ? 'No contacts found' : 'No contacts available'}
                </div>
              ) : (
                <div className="py-1">
                  {contacts.map((contact: any) => {
                    const displayName = getDisplayName(contact);
                    const isSelected = contact.id === selectedContactId;
                    // Show business_name as subtitle only if we're showing a person's name
                    const hasPersonName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
                    const showBusinessAsSubtitle = hasPersonName && contact.business_name;

                    return (
                      <button
                        key={contact.id}
                        onClick={() => handleSelect(contact)}
                        className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-start justify-between ${
                          isSelected ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {displayName}
                          </div>
                          {showBusinessAsSubtitle && (
                            <div className="text-xs text-gray-500 truncate">{contact.business_name}</div>
                          )}
                          {contact.email && (
                            <div className="text-xs text-gray-400 truncate">{contact.email}</div>
                          )}
                        </div>
                        {isSelected && (
                          <CheckIcon className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* Footer */}
            {selectedContactId && (
              <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleClearSelection}
                  className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ContactSelectorModal;
