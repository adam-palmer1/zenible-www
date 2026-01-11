import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';
import contactsAPI from '../../services/api/crm/contacts';

/**
 * Dropdown for selecting a contact from CRM with autocomplete search
 */
const ContactSelectorModal = ({ isOpen, onClose, onSelect, selectedContactId = null, anchorRef = null, filterParams = {} }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          anchorRef?.current && !anchorRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorRef]);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen, searchQuery, page]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: 10,
        ...filterParams,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await contactsAPI.list(params);
      setContacts(response.items || []);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (contact) => {
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 flex flex-col"
      >
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
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              {searchQuery ? 'No contacts found' : 'Start typing to search...'}
            </div>
          ) : (
            <div className="py-1">
              {contacts.map((contact) => {
                const displayName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'No Name';

                const isSelected = contact.id === selectedContactId;

                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelect(contact)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-start justify-between ${
                      isSelected ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{displayName}</div>
                      {contact.business_name && (
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
      </div>
    </>
  );
};

export default ContactSelectorModal;
