import React, { createContext, useContext, useCallback } from 'react';
import { useNotification } from './NotificationContext';
import { getContactDisplayName } from '../utils/crm/contactUtils';
import appointmentsAPI from '../services/api/crm/appointments';
import { prepareAppointmentData } from '../utils/crm/appointmentUtils';

/** Minimal contact shape used throughout contact actions */
interface ContactActionContact {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  is_hidden_crm?: boolean;
  is_hidden_client?: boolean;
  is_hidden_vendor?: boolean;
  is_client?: boolean;
  next_appointment?: { id: string; title?: string; start_datetime?: string; appointment_type?: string } | null;
  [key: string]: unknown;
}

/** Status shape as stored in globalStatuses / customStatuses */
interface StatusEntry {
  id: string;
  name: string;
  friendly_name?: string;
  color?: string;
  [key: string]: unknown;
}

interface ContactActionResult {
  success: boolean;
  error?: unknown;
  added?: boolean;
  contactName?: string;
}

interface StatusRoles {
  lead_status_id?: string | null;
  call_booked_status_id?: string | null;
  lost_status_id?: string | null;
  won_status_id?: string | null;
}

interface ContactActionsProviderProps {
  children: React.ReactNode;
  globalStatuses: StatusEntry[];
  customStatuses: StatusEntry[];
  statusRoles?: StatusRoles;
  onEdit: ((contact: ContactActionContact) => void) | undefined;
  onDelete: (contact: ContactActionContact) => Promise<void>;
  onUpdateStatus: (contactId: string, updates: Record<string, unknown>) => Promise<ContactActionResult>;
  onRefreshContacts?: () => void;
}

interface ContactActionsContextValue {
  markAsLost: (contact: ContactActionContact) => Promise<ContactActionResult>;
  markAsWon: (contact: ContactActionContact) => Promise<ContactActionResult>;
  changeStatus: (contact: ContactActionContact, statusId: string, isGlobal?: boolean) => Promise<ContactActionResult>;
  editContact: (contact: ContactActionContact) => void;
  deleteContact: (contact: ContactActionContact) => Promise<ContactActionResult>;
  toggleHidden: (contact: ContactActionContact, context?: 'crm' | 'client' | 'vendor') => Promise<ContactActionResult>;
  toggleClient: (contact: ContactActionContact, showSuccessModal?: boolean) => Promise<ContactActionResult>;
  setFollowUp: (contact: ContactActionContact, followUpDateTime: string, appointmentType?: string, durationMinutes?: number, sendInviteToContact?: boolean) => Promise<ContactActionResult>;
  dismissFollowUp: (contact: ContactActionContact) => Promise<ContactActionResult>;
  refreshContacts?: () => void;
  statusRoles?: StatusRoles;
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
  customStatuses,
  statusRoles,
  onEdit,
  onDelete,
  onUpdateStatus,
  onRefreshContacts
}: ContactActionsProviderProps) => {
  const { showSuccess, showError } = useNotification();

  /**
   * Mark contact as lost
   */
  const markAsLost = useCallback(async (contact: ContactActionContact): Promise<ContactActionResult> => {
    try {
      // Use role assignment first, fall back to name lookup
      let lostStatusId = statusRoles?.lost_status_id;
      let isGlobal = true;

      if (lostStatusId) {
        // Determine if it's a global or custom status
        const inGlobal = globalStatuses?.some((s: StatusEntry) => s.id === lostStatusId);
        const inCustom = customStatuses?.some((s: StatusEntry) => s.id === lostStatusId);
        isGlobal = inGlobal || !inCustom;
      } else {
        const lostStatus = globalStatuses?.find((s: StatusEntry) => s.name === 'lost');
        if (!lostStatus) {
          showError('Lost status not found');
          return { success: false, error: 'Status not found' };
        }
        lostStatusId = lostStatus.id;
      }

      const result = await onUpdateStatus(contact.id, isGlobal
        ? { current_global_status_id: lostStatusId, current_custom_status_id: null }
        : { current_custom_status_id: lostStatusId, current_global_status_id: null }
      );

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
  }, [globalStatuses, customStatuses, statusRoles, onUpdateStatus, showSuccess, showError]);

  /**
   * Mark contact as won
   */
  const markAsWon = useCallback(async (contact: ContactActionContact): Promise<ContactActionResult> => {
    try {
      // Use role assignment first, fall back to name lookup
      let wonStatusId = statusRoles?.won_status_id;
      let isGlobal = true;

      if (wonStatusId) {
        const inGlobal = globalStatuses?.some((s: StatusEntry) => s.id === wonStatusId);
        const inCustom = customStatuses?.some((s: StatusEntry) => s.id === wonStatusId);
        isGlobal = inGlobal || !inCustom;
      } else {
        const wonStatus = globalStatuses?.find((s: StatusEntry) => s.name === 'won');
        if (!wonStatus) {
          showError('Won status not found');
          return { success: false, error: 'Status not found' };
        }
        wonStatusId = wonStatus.id;
      }

      const result = await onUpdateStatus(contact.id, isGlobal
        ? { current_global_status_id: wonStatusId, current_custom_status_id: null }
        : { current_custom_status_id: wonStatusId, current_global_status_id: null }
      );

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
  }, [globalStatuses, customStatuses, statusRoles, onUpdateStatus, showSuccess, showError]);

  /**
   * Change contact status (generic)
   */
  const changeStatus = useCallback(async (contact: ContactActionContact, statusId: string, isGlobal = true): Promise<ContactActionResult> => {
    try {
      const result = await onUpdateStatus(contact.id, isGlobal
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
  const editContact = useCallback((contact: ContactActionContact) => {
    onEdit && onEdit(contact);
  }, [onEdit]);

  /**
   * Delete contact (confirmation handled by caller)
   */
  const deleteContact = useCallback(async (contact: ContactActionContact): Promise<ContactActionResult> => {
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
  const toggleHidden = useCallback(async (contact: ContactActionContact, context: 'crm' | 'client' | 'vendor' = 'crm'): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'Contact');
    const fieldMap = {
      crm: 'is_hidden_crm',
      client: 'is_hidden_client',
      vendor: 'is_hidden_vendor',
    } as const;
    const field = fieldMap[context];
    const newHiddenState = !contact[field];

    try {
      const result = await onUpdateStatus(contact.id, { [field]: newHiddenState });

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
  const toggleClient = useCallback(async (contact: ContactActionContact, _showSuccessModal = false): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'Contact');
    const newClientState = !contact.is_client;

    // Require email to add to client list
    if (newClientState && !contact.email) {
      showError('Contact must have an email address to be added to the client list.');
      return { success: false };
    }

    try {
      const result = await onUpdateStatus(contact.id, { is_client: newClientState });

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
  const setFollowUp = useCallback(async (contact: ContactActionContact, followUpDateTime: string, appointmentType = 'follow_up', durationMinutes = 60, sendInviteToContact = true): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'Contact');
    const isCall = appointmentType === 'call';

    try {
      // Prepare appointment data
      const appointmentData = {
        ...prepareAppointmentData(contact, followUpDateTime, appointmentType, null, durationMinutes),
        send_invite_to_contact: sendInviteToContact,
      };

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
  const dismissFollowUp = useCallback(async (contact: ContactActionContact): Promise<ContactActionResult> => {
    const displayName = getContactDisplayName(contact, 'Contact');

    try {
      // Get the next appointment from the pre-computed field
      const nextAppointment = contact.next_appointment;

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
    refreshContacts: onRefreshContacts,

    // Status roles for conditional rendering
    statusRoles
  };

  return (
    <ContactActionsContext.Provider value={value}>
      {children}
    </ContactActionsContext.Provider>
  );
};
