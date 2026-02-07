import React, { useState } from 'react';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  EyeSlashIcon,
  EyeIcon,
  BellSlashIcon,
  UserPlusIcon,
  UserMinusIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import Dropdown from '../ui/dropdown/Dropdown';
import { useContactActions } from '../../contexts/ContactActionsContext';
import ConfirmationModal from '../common/ConfirmationModal';
import SuccessModal from '../common/SuccessModal';
import ContactMergeModal from './ContactMergeModal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';
import { getNextAppointment } from '../../utils/crm/appointmentUtils';
import { useModalState } from '../../hooks/useModalState';

interface ContactActionMenuProps {
  contact: any;
  showMarkLost?: boolean;
}

/**
 * Reusable contact action menu with dropdown and modals
 * Handles Edit, Mark Lost, Hide/Unhide, and Delete actions
 */
const ContactActionMenu: React.FC<ContactActionMenuProps> = ({ contact, showMarkLost = true }) => {
  const [confirmationModal, setConfirmationModal] = useState<string | null>(null);
  const successModal = useModalState();
  const [successContactName, setSuccessContactName] = useState('');
  const mergeModal = useModalState();

  const { editContact, deleteContact, markAsLost, toggleHidden, dismissFollowUp, toggleClient, refreshContacts } = useContactActions() as any;

  // Get display name using shared utility
  const displayName = getContactDisplayName(contact, 'Contact');

  // Get next appointment to determine if dismiss option should show
  const nextAppointment = getNextAppointment(contact.appointments);

  // Handle add to client list
  const handleAddToClientList = async () => {
    const result = await toggleClient(contact);
    if (result.success && result.added) {
      setSuccessContactName(result.contactName);
      successModal.open();
      // Don't refresh immediately - wait for modal to close
    }
  };

  // Handle success modal close - refresh after user acknowledges
  const handleSuccessModalClose = () => {
    successModal.close();
    if (refreshContacts) {
      refreshContacts();
    }
  };

  // Handle remove from client list
  const handleRemoveFromClientList = async () => {
    const result = await toggleClient(contact);
    if (result.success && !result.added) {
      if (refreshContacts) {
        refreshContacts();
      }
    }
  };

  // Handle merge completion
  const handleMergeComplete = () => {
    mergeModal.close();
    if (refreshContacts) {
      refreshContacts();
    }
  };

  // Menu items configuration
  const menuItems = [
    {
      id: 'edit',
      label: 'Edit Contact',
      icon: PencilIcon,
      onClick: () => editContact(contact),
    },
    {
      id: 'merge',
      label: 'Merge with another contact...',
      icon: ArrowsRightLeftIcon,
      onClick: () => mergeModal.open(),
    },
    !contact.is_client && {
      id: 'add_to_client_list',
      label: 'Add to Client List',
      icon: UserPlusIcon,
      onClick: handleAddToClientList,
    },
    contact.is_client && {
      id: 'remove_from_client_list',
      label: 'Remove from Client List',
      icon: UserMinusIcon,
      onClick: () => setConfirmationModal('remove_client'),
    },
    showMarkLost && {
      id: 'mark_lost',
      label: 'Mark Lost',
      icon: XCircleIcon,
      onClick: () => setConfirmationModal('lost'),
    },
    {
      id: 'toggle_hidden',
      label: contact.is_hidden ? 'Unhide Contact' : 'Hide Contact',
      icon: contact.is_hidden ? EyeIcon : EyeSlashIcon,
      onClick: () => toggleHidden(contact),
    },
    nextAppointment && {
      id: 'dismiss_follow_up',
      label: 'Dismiss Appointment',
      icon: BellSlashIcon,
      onClick: () => dismissFollowUp(contact),
    },
    {
      id: 'delete',
      label: 'Delete Contact',
      icon: TrashIcon,
      onClick: () => setConfirmationModal('delete'),
      destructive: true,
    }
  ].filter(Boolean) as any[]; // Remove falsy items

  return (
    <>
      <Dropdown
        trigger={
          <button
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            aria-label="Contact actions"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
        }
        align="end"
        side="bottom"
      >
        {menuItems.map((item: any, index: number) => (
          <Dropdown.Item
            key={item.id}
            onSelect={(e: any) => {
              e.stopPropagation();
              item.onClick();
            }}
            destructive={item.destructive}
            highlighted={index === 0}
          >
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown>

      {/* Mark Lost Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal === 'lost'}
        onClose={() => setConfirmationModal(null)}
        onConfirm={() => markAsLost(contact)}
        title="Mark as Lost?"
        message={`Are you sure you want to mark ${displayName} as lost? This will move the contact to the Lost status.`}
        confirmText="Mark Lost"
        confirmColor="purple"
        icon={XCircleIcon}
        iconColor="text-gray-600"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal === 'delete'}
        onClose={() => setConfirmationModal(null)}
        onConfirm={() => deleteContact(contact)}
        title="Delete Contact?"
        message={`Are you sure you want to delete ${displayName}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
        icon={TrashIcon}
        iconColor="text-red-600"
      />

      {/* Remove from Client List Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal === 'remove_client'}
        onClose={() => setConfirmationModal(null)}
        onConfirm={handleRemoveFromClientList}
        title="Remove from Client List?"
        message={
          <div>
            <p className="mb-2">Are you sure you want to remove {displayName} from your client list?</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Note: This will not remove them from the CRM or delete any history.
            </p>
          </div>
        }
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="orange"
        icon={UserMinusIcon}
        iconColor="text-orange-600"
      />

      {/* Add to Client List Success Modal */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={handleSuccessModalClose}
        title="Added to Client List!"
        message={`${successContactName} has been successfully added to your client list.`}
        buttonText="OK"
      />

      {/* Contact Merge Modal */}
      <ContactMergeModal
        isOpen={mergeModal.isOpen}
        onClose={mergeModal.close}
        sourceContact={contact}
        onMergeComplete={handleMergeComplete}
      />
    </>
  );
};

export default ContactActionMenu;
