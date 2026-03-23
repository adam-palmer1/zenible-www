import React, { useState } from 'react';
import Modal from '../ui/modal/Modal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';

interface FollowUpDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: {
    id: string;
    follow_up_reminder_at?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    business_name?: string | null;
    email?: string | null;
  } | null;
  onDismiss: () => void;
  onEdit: () => void;
}

const FollowUpDetailsModal: React.FC<FollowUpDetailsModalProps> = ({
  isOpen,
  onClose,
  contact,
  onDismiss,
  onEdit,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!contact) return null;

  const displayName = getContactDisplayName(contact, 'Contact');
  const reminderAt = contact.follow_up_reminder_at;

  const isOverdue = reminderAt ? new Date(reminderAt) <= new Date() : false;

  const formattedDate = reminderAt
    ? new Date(reminderAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const formattedTime = reminderAt
    ? new Date(reminderAt).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => { if (!open) { setShowConfirm(false); onClose(); } }}
      title="Follow-Up Reminder"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Reminder for <span className="font-medium">{displayName}</span>
        </p>

        {reminderAt ? (
          <div className={`p-3 rounded-lg ${isOverdue ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'}`}>
            <p className={`text-sm font-medium ${isOverdue ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {formattedDate} at {formattedTime}
            </p>
            {isOverdue && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">Overdue</p>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">General follow-up (no date set)</p>
          </div>
        )}

        {showConfirm ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to dismiss this reminder?
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowConfirm(false); onDismiss(); onClose(); }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => { onEdit(); onClose(); }}
              className="px-4 py-2 text-sm font-medium text-white bg-zenible-primary hover:bg-zenible-primary/90 rounded-lg transition-colors"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FollowUpDetailsModal;
