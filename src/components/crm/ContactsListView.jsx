import React, { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import contactsAPI from '../../services/api/crm/contacts';
import { useNotification } from '../../contexts/NotificationContext';
import Dropdown from '../ui/dropdown/Dropdown';
import ConfirmationModal from '../common/ConfirmationModal';

/**
 * ContactsListView Component
 *
 * Displays contacts in a table/list format with filtering and actions.
 */
const ContactsListView = ({ contacts, statuses, onContactClick, onEdit, onDelete, onUpdateStatus }) => {
  const { showError, showSuccess } = useNotification();
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ isOpen: false, contact: null });

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const handleSelectContact = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleEditContact = (contact) => {
    if (onEdit) {
      onEdit(contact);
    }
  };

  const handleDeleteContact = (contact) => {
    setDeleteConfirmModal({ isOpen: true, contact });
  };

  const confirmDeleteContact = async () => {
    const contact = deleteConfirmModal.contact;
    if (!contact) return;

    try {
      if (onDelete) {
        await onDelete(contact);
      }
      showSuccess('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      showError('Failed to delete contact');
    }
  };

  const handleHideContact = async (contact) => {

    try {
      const newVisibility = !contact.is_hidden;
      await contactsAPI.update(contact.id, {
        is_hidden: newVisibility
      });

      showSuccess(newVisibility ? 'Contact hidden' : 'Contact is now visible');

      // Update local state through parent callback
      if (onUpdateStatus) {
        await onUpdateStatus(contact.id, { is_hidden: newVisibility });
      }
    } catch (error) {
      console.error('Error updating contact visibility:', error);
      showError('Failed to update contact visibility');
    }
  };

  const getStatus = (contact) => {
    // Prefer embedded status object over looking up in statuses array
    const status = contact.current_global_status || contact.current_custom_status;
    if (status) {
      return {
        name: status.friendly_name || status.name,
        color: status.color || '#6B7280'
      };
    }

    // Fallback to looking up in statuses array
    const statusId = contact.current_global_status_id || contact.current_custom_status_id;
    const foundStatus = statuses.find(s => s.id === statusId);
    return {
      name: foundStatus?.friendly_name || foundStatus?.name || 'No Status',
      color: foundStatus?.color || '#6B7280'
    };
  };

  const getStatusBadgeStyles = (statusName) => {
    const name = statusName.toLowerCase();
    if (name.includes('lead')) return 'bg-gray-100 text-gray-800';
    if (name.includes('follow')) return 'bg-blue-50 text-blue-800';
    if (name.includes('confirm')) return 'bg-yellow-50 text-yellow-800';
    if (name.includes('call') || name.includes('book')) return 'bg-purple-50 text-purple-800';
    if (name.includes('won')) return 'bg-green-50 text-green-800';
    if (name.includes('lost')) return 'bg-red-50 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return null;
    }
  };

  return (
    <>
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-[#e5e5e5] dark:border-gray-700">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e5e5] dark:border-gray-700">
              <th className="px-4 py-3 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                />
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Phone</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Company</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Created</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No contacts found
                </td>
              </tr>
            ) : (
              contacts.map((contact, index) => {
                const status = getStatus(contact);
                const statusBadgeClass = getStatusBadgeStyles(status.name);

                return (
                  <tr
                    key={contact.id}
                    className={`border-b border-[#e5e5e5] dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${index === contacts.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => handleSelectContact(contact.id)}
                        className="w-4 h-4 rounded border-gray-300 text-zenible-primary focus:ring-zenible-primary"
                      />
                    </td>
                    <td className="px-4 py-4 cursor-pointer" onClick={() => onContactClick && onContactClick(contact)}>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className={`font-normal text-sm text-gray-900 dark:text-white ${contact.is_hidden ? 'line-through italic opacity-60' : ''}`}>
                            {contact.first_name} {contact.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white cursor-pointer" onClick={() => onContactClick && onContactClick(contact)}>
                      {contact.email || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white cursor-pointer" onClick={() => onContactClick && onContactClick(contact)}>
                      {contact.phone || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-white cursor-pointer" onClick={() => onContactClick && onContactClick(contact)}>
                      {contact.business_name || '-'}
                    </td>
                    <td className="px-4 py-4 cursor-pointer" onClick={() => onContactClick && onContactClick(contact)}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${statusBadgeClass}`}>
                        {status.name}
                      </span>
                    </td>
                    <td className="px-4 py-4 cursor-pointer" onClick={() => onContactClick && onContactClick(contact)}>
                      <div className="flex gap-1">
                        {contact.is_client && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            Client
                          </span>
                        )}
                        {contact.is_vendor && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            Vendor
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 cursor-pointer" onClick={() => onContactClick && onContactClick(contact)}>
                      {formatDate(contact.created_at) || '-'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Dropdown
                        trigger={
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded-full transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 10.8334C10.4603 10.8334 10.8334 10.4603 10.8334 10C10.8334 9.53978 10.4603 9.16669 10 9.16669C9.53978 9.16669 9.16669 9.53978 9.16669 10C9.16669 10.4603 9.53978 10.8334 10 10.8334Z" fill="currentColor"/>
                              <path d="M10 5.00002C10.4603 5.00002 10.8334 4.62692 10.8334 4.16669C10.8334 3.70645 10.4603 3.33335 10 3.33335C9.53978 3.33335 9.16669 3.70645 9.16669 4.16669C9.16669 4.62692 9.53978 5.00002 10 5.00002Z" fill="currentColor"/>
                              <path d="M10 16.6667C10.4603 16.6667 10.8334 16.2936 10.8334 15.8334C10.8334 15.3731 10.4603 15 10 15C9.53978 15 9.16669 15.3731 9.16669 15.8334C9.16669 16.2936 9.53978 16.6667 10 16.6667Z" fill="currentColor"/>
                            </svg>
                          </button>
                        }
                        align="end"
                        side="bottom"
                      >
                        <Dropdown.Item
                          onSelect={(e) => {
                            e.stopPropagation();
                            handleEditContact(contact);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit Contact
                        </Dropdown.Item>

                        <Dropdown.Item
                          onSelect={(e) => {
                            e.stopPropagation();
                            handleHideContact(contact);
                          }}
                        >
                          {contact.is_hidden ? 'Show Contact' : 'Hide Contact'}
                        </Dropdown.Item>

                        <Dropdown.Item
                          onSelect={(e) => {
                            e.stopPropagation();
                            handleDeleteContact(contact);
                          }}
                          destructive
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete Contact
                        </Dropdown.Item>
                      </Dropdown>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmationModal
      isOpen={deleteConfirmModal.isOpen}
      onClose={() => setDeleteConfirmModal({ isOpen: false, contact: null })}
      onConfirm={confirmDeleteContact}
      title="Delete Contact"
      message={deleteConfirmModal.contact ? `Are you sure you want to delete ${deleteConfirmModal.contact.first_name} ${deleteConfirmModal.contact.last_name}?` : ''}
      confirmText="Delete"
      cancelText="Cancel"
      confirmColor="red"
    />
    </>
  );
};

export default ContactsListView;
