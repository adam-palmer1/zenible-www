import { useCallback, useRef } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { CRM_ERRORS, CRM_SUCCESS } from '../../constants/crm';

/**
 * Centralized hook for contact status updates with optimistic UI
 * Eliminates duplication between drag-and-drop and quick actions
 */
export const useContactStatusUpdate = (localContacts, setLocalContacts, onUpdateContact) => {
  const { showSuccess, showError } = useNotification();
  const pendingUpdatesRef = useRef(new Set());
  const requestInFlightRef = useRef(new Set());
  const lastSyncedContactsRef = useRef(localContacts);
  const preUpdateSnapshotsRef = useRef(new Map());

  /**
   * Update contact status with optimistic UI and proper error handling
   */
  const updateContactStatus = useCallback(async (contactId, updateData, options = {}) => {
    // Prevent duplicate requests
    if (requestInFlightRef.current.has(contactId)) {
      console.warn(`Request already in flight for contact ${contactId}`);
      return { success: false, error: 'Request already in progress' };
    }

    // Store snapshot for rollback
    const currentContact = localContacts.find(c => c.id === contactId);
    if (currentContact) {
      preUpdateSnapshotsRef.current.set(contactId, { ...currentContact });
    }

    // Mark as pending and in-flight
    pendingUpdatesRef.current.add(contactId);
    requestInFlightRef.current.add(contactId);

    // Optimistic update
    setLocalContacts(prevContacts =>
      prevContacts.map(c =>
        c.id === contactId ? { ...c, ...updateData } : c
      )
    );

    try {
      // Call backend API
      const updatedContact = await onUpdateContact(contactId, updateData, {
        skipLoading: true,
        ...options
      });

      // Update with server response
      setLocalContacts(prevLocal =>
        prevLocal.map(c => c.id === contactId ? updatedContact : c)
      );

      // Show success notification if requested
      if (options.showSuccess) {
        showSuccess(options.successMessage || CRM_SUCCESS.STATUS_UPDATED, {
          duration: 3000
        });
      }

      // Clean up
      preUpdateSnapshotsRef.current.delete(contactId);

      return { success: true, data: updatedContact };
    } catch (error) {
      console.error('Failed to update contact status:', error);

      // Rollback to pre-update snapshot (more reliable than using props)
      const snapshot = preUpdateSnapshotsRef.current.get(contactId);
      if (snapshot) {
        setLocalContacts(prevLocal =>
          prevLocal.map(c => c.id === contactId ? snapshot : c)
        );
        preUpdateSnapshotsRef.current.delete(contactId);
      } else {
        // Fallback to lastSynced if snapshot not available
        setLocalContacts(lastSyncedContactsRef.current);
      }

      // Show error notification
      const errorMessage = options.errorMessage || CRM_ERRORS.UPDATE_FAILED;
      showError(errorMessage, {
        action: options.retryable ? 'Retry' : undefined,
        onAction: options.retryable
          ? () => updateContactStatus(contactId, updateData, options)
          : undefined
      });

      return { success: false, error };
    } finally {
      // Clean up tracking
      pendingUpdatesRef.current.delete(contactId);
      requestInFlightRef.current.delete(contactId);
    }
  }, [localContacts, setLocalContacts, onUpdateContact, showSuccess, showError]);

  /**
   * Check if a contact update is currently pending
   */
  const isPending = useCallback((contactId) => {
    return pendingUpdatesRef.current.has(contactId);
  }, []);

  /**
   * Check if any updates are pending
   */
  const hasPendingUpdates = useCallback(() => {
    return pendingUpdatesRef.current.size > 0;
  }, []);

  /**
   * Update last synced reference (for prop sync logic)
   */
  const updateLastSynced = useCallback((contacts) => {
    lastSyncedContactsRef.current = contacts;
  }, []);

  return {
    updateContactStatus,
    isPending,
    hasPendingUpdates,
    updateLastSynced,
    pendingUpdatesRef,
    lastSyncedContactsRef
  };
};
