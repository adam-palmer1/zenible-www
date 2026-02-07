import React, { createContext, useContext, useCallback } from 'react';
import { useNotification } from './NotificationContext';
import { getContactDisplayName } from '../utils/crm/contactUtils';
import appointmentsAPI from '../services/api/crm/appointments';
import { prepareAppointmentData, getNextAppointment } from '../utils/crm/appointmentUtils';

interface ContactActionResult {
  success: boolean;
  error?: unknown;
  added?: boolean;
  contactName?: string;
}

interface ContactActionsProviderProps {
  children: React.ReactNode;
  globalStatuses: unknown[];
  customStatuses: unknown[];
  onEdit: ((contact: unknown) => void) | undefined;
  onDelete: (contact: unknown) => Promise<void>;
  onUpdateStatus: (contactId: string, updates: Record<string, unknown>) => Promise<ContactActionResult>;
  onRefreshContacts?: () => void;
}

interface ContactActionsContextValue {
  markAsLost: (contact: unknown) => Promise<ContactActionResult>;
  markAsWon: (contact: unknown) => Promise<ContactActionResult>;
  changeStatus: (contact: unknown, statusId: string, isGlobal?: boolean) => Promise<ContactActionResult>;
  editContact: (contact: unknown) => void;
  deleteContact: (contact: unknown) => Promise<ContactActionResult>;
  toggleHidden: (contact: unknown) => Promise<ContactActionResult>;
  toggleClient: (contact: unknown, showSuccessModal?: boolean) => Promise<ContactActionResult>;
  setFollowUp: (contact: unknown, followUpDateTime: string, appointmentType?: string) => Promise<ContactActionResult>;
  dismissFollowUp: (contact: unknown) => Promise<ContactActionResult>;
  refreshContacts?: () => void;
}

const ContactActionsContext = createContext<ContactActionsContextValue | null>(null);

export const useContactActions = () => {
  const context = useContext(ContactActionsContext);
  if (!context) {
    throw new Error('useContactActions must be used within a ContactActionsProvider');
  }
  return context;
};

/**
 * ContactActionsProvider - Provides contact action handlers throughout the app
 * Eliminates prop drilling and centralizes contact actions
 */
export const ContactActionsProvider = ({
  children,
  globalStatuses,
  onEdit,
  onDelete,
  onUpdateStatus,
  onRefreshContacts
}: ContactActionsProviderProps) => {
  const { showSuccess, showError } = useNotification();

  /**
   * Mark contact as lost
   */
  const markAsLost = useCallback(async (contact: unknown): Promise<ContactActionResult> => {
    try {
      const lostStatus = (globalStatuses as any[])?.find((s: any) => s.name === 'lost');
      if (!lostStatus) {
        showError('Lost status not found');
        return { success: false, error: 'Status not found' };
      }

      const result = await onUpdateStatus((contact as any).id, {
        current_global_status_id: lostStatus.id,
        current_custom_status_id: null
      });

      if (result.success) {
        const displayName = getContactDisplayName(contact, 'Contact');
        showSuccess(`${displayName} marked as lost`, { duration: 3000 });
      }

      return result;
    } catch (error) {
      console.error('Failed to mark contact as lost:', error);
      showError((error as Error).message || 'Failed to update contact');
      return { success: false, error };
    }
  }, [globalStatuses, onUpdateStatus, showSuccess, showError]);

  /**
   * Mark contact as won
   */
  const markAsWon = useCallback(async (contact: unknown): Promise<ContactActionResult> => {
    try {
      const wonStatus = (globalStatuses as any[])?.find((s: any) => s.name === 'won');
      if (!wonStatus) {
        showError('Won status not found');
        return { success: false, error: 'Status not found' };
      }

      const result = await onUpdateStatus((contact as any).id, {
        current_global_status_id: wonStatus.id,
        current_custom_status_id: null
      });

      if (result.success) {
        const displayName = getContactDisplayName(contact, 'Contact');
        showSuccess(`${displayName} marked as won! 🎉`, { duration: 4000 });
      }

      return result;
    } catch (error) {
      console.error('Failed to mark contact as won:', error);
      showError((error as Error).message || 'Failed to update contact');
      return { success: false, error };
    }
  }, [globalStatuses, onUpdateStatus, showSuccess, showError]);

  /**
   * Change contact status (generic)
   */
  const changeStatus = useCallback(async (contact: unknown, statusId: string, isGlobal = true): Promise<ContactActionResult> => {
    try {
      const result = await onUpdateStatus((contact as any).id, isGlobal
        ? { current_global_status_id: statusId, current_custom_status_id: null }
        : { current_custom_status_id: statusId, current_global_status_id: null }
      );

      if (result.success) {
        showSuccess('Contact status updated successfully');
      }

      return result;
    } catch (error) {
      console.error('Failed to change contact status:', error);
      showError((error as Error).message || 'Failed to update contact');
      return { success: false, error };
    }
  }, [onUpdateStatus, showSuccess, showError]);

  /**
   * Edit contact
   */
  const editContact = useCallback((contact: unknown) => {
    onEdit && onEdit(contact);
  }, [onEdit]);

  /**
   * Delete contact (confirmation handled by caller)
   */
  const deleteContact = useCallback(async (contact: unknown): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'this contact');

    try {
      await onDelete(contact);
      showSuccess(`${displayName} deleted successfully`);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete contact:', error);
      showError('Failed to delete contact. Please try again.');
      return { success: false, error };
    }
  }, [onDelete, showSuccess, showError]);

  /**
   * Toggle contact hidden state
   */
  const toggleHidden = useCallback(async (contact: unknown): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'Contact');
    const newHiddenState = !(contact as any).is_hidden;

    try {
      const result = await onUpdateStatus((contact as any).id, { is_hidden: newHiddenState });

      if (result.success) {
        showSuccess(
          newHiddenState
            ? `${displayName} hidden from view`
            : `${displayName} unhidden`,
          {
            duration: 3000,
            action: 'Reload to see changes'
          }
        );

        // Reload page after a brief delay to refresh the contact list with proper filter
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

      return result;
    } catch (error) {
      console.error('Failed to toggle hidden state:', error);
      showError('Failed to update contact visibility. Please try again.');
      return { success: false, error };
    }
  }, [onUpdateStatus, showSuccess, showError]);

  /**
   * Toggle contact client status
   */
  const toggleClient = useCallback(async (contact: unknown, _showSuccessModal = false): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'Contact');
    const newClientState = !(contact as any).is_client;

    try {
      const result = await onUpdateStatus((contact as any).id, { is_client: newClientState });

      if (result.success) {
        // Return success with flag to show modal if adding to client list
        return {
          success: true,
          added: newClientState,
          contactName: displayName
        };
      }

      return result;
    } catch (error) {
      console.error('Failed to toggle client status:', error);
      showError('Failed to update client status. Please try again.');
      return { success: false, error };
    }
  }, [onUpdateStatus, showError]);

  /**
   * Set follow-up date for contact
   * @param contact - The contact to update
   * @param followUpDateTime - The follow-up date/time (ISO 8601 format)
   * @param appointmentType - The appointment type ('call' or 'follow_up')
   */
  const setFollowUp = useCallback(async (contact: unknown, followUpDateTime: string, appointmentType = 'follow_up'): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'Contact');
    const isCall = appointmentType === 'call';

    try {
      // Prepare appointment data
      const appointmentData = prepareAppointmentData(contact as any, followUpDateTime, appointmentType);

      // Create appointment via Appointments API
      await appointmentsAPI.create(appointmentData);

      // Show success message
      showSuccess(
        isCall ? `Call scheduled for ${displayName}` : `Follow-up scheduled for ${displayName}`,
        { duration: 3000 }
      );

      // Refresh contacts to get updated next_appointment
      if (onRefreshContacts) {
        onRefreshContacts();
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to create appointment:', error);
      showError((error as Error).message || 'Failed to schedule appointment. Please try again.');
      return { success: false, error };
    }
  }, [onRefreshContacts, showSuccess, showError]);

  /**
   * Dismiss follow-up date for contact
   */
  const dismissFollowUp = useCallback(async (contact: unknown): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'Contact');

    try {
      // Get the next appointment from appointments array
      const nextAppointment = getNextAppointment((contact as any).appointments);

      // Verify appointment exists
      if (!nextAppointment?.id) {
        showError('No appointment to dismiss');
        return { success: false, error: 'No appointment found' };
      }

      // Cancel appointment (status: 'cancelled' preserves history)
      await appointmentsAPI.update(nextAppointment.id as string, {
        status: 'cancelled'
      });

      showSuccess(`Appointment dismissed for ${displayName}`, { duration: 3000 });

      // Refresh to get updated appointments list (backend recalculates)
      if (onRefreshContacts) {
        onRefreshContacts();
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to dismiss appointment:', error);
      showError((error as Error).message || 'Failed to dismiss appointment. Please try again.');
      return { success: false, error };
    }
  }, [onRefreshContacts, showSuccess, showError]);

  const value: ContactActionsContextValue = {
    // Quick actions
    markAsLost,
    markAsWon,
    changeStatus,

    // CRUD actions
    editContact,
    deleteContact,

    // Visibility actions
    toggleHidden,
    toggleClient,

    // Follow-up actions
    setFollowUp,
    dismissFollowUp,

    // Refresh callback
    refreshContacts: onRefreshContacts
  };

  return (
    <ContactActionsContext.Provider value={value}>
      {children}
    </ContactActionsContext.Provider>
  );
};
