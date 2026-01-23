import { useState, useEffect, useCallback } from 'react';
import appointmentsAPI from '../services/api/crm/appointments';

export function useCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Multi-account Google Calendar state
  const [googleAccounts, setGoogleAccounts] = useState([]);
  const [primaryAccount, setPrimaryAccount] = useState(null);

  // Derived state for backward compatibility
  const googleConnected = googleAccounts.length > 0;
  const googleCalendarId = primaryAccount?.primary_calendar_id || null;
  const lastSync = primaryAccount?.last_sync_at || null;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAppointments, setTotalAppointments] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    start_date: null,
    end_date: null,
    appointment_type: null,
    contact_id: null,
    status: 'scheduled', // Default to showing only scheduled appointments
  });

  // Fetch appointments with filters
  const fetchAppointments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        page: currentPage,
        per_page: 100, // Fetch more for calendar view
        ...filters,
        ...params,
      };

      const response = await appointmentsAPI.list(queryParams);
      setAppointments(response.items || []);
      setTotalPages(response.total_pages || 1);
      setTotalAppointments(response.total || 0);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch appointments:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Fetch appointments for a specific date range (for calendar view)
  const fetchAppointmentsForDateRange = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);

    try {
      const response = await appointmentsAPI.getCalendarAppointments(
        startDate.toISOString(),
        endDate.toISOString(),
        { status: filters.status }
      );
      setAppointments(response.appointments || []);
      setTotalAppointments(response.total || 0);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch calendar appointments:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  // Create appointment
  const createAppointment = async (data) => {
    setError(null);
    try {
      const newAppointment = await appointmentsAPI.create(data);
      setAppointments(prev => [newAppointment, ...prev]);
      setTotalAppointments(prev => prev + 1);
      return { success: true, appointment: newAppointment };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Update appointment
  const updateAppointment = async (appointmentId, data, queryParams = {}) => {
    setError(null);
    try {
      const updated = await appointmentsAPI.update(appointmentId, data, queryParams);
      // For recurring appointments, refetch to get the updated instances
      // instead of trying to update in place, since the structure may have changed
      if (data.edit_scope || data.recurrence) {
        // Trigger a refetch of appointments to get the updated recurring instances
        // We'll let the parent component handle the refetch via useEffect
      } else {
        // For non-recurring updates, update in place
        setAppointments(prev =>
          prev.map(apt => (apt.id === appointmentId ? updated : apt))
        );
      }
      return { success: true, appointment: updated };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId, queryParams = {}) => {
    setError(null);
    try {
      await appointmentsAPI.delete(appointmentId, queryParams);
      // For recurring appointments with scope, refetch to get updated instances
      if (queryParams.delete_scope) {
        // Trigger refetch - parent component will handle via useEffect
      } else {
        // For non-recurring deletes, remove from state
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
        setTotalAppointments(prev => prev - 1);
      }
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Get single appointment
  const getAppointment = async (appointmentId) => {
    setError(null);
    try {
      const appointment = await appointmentsAPI.get(appointmentId);
      return { success: true, appointment };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ========== Google Calendar Integration ==========

  // Check Google Calendar connection status (multi-account)
  const checkGoogleConnection = async () => {
    try {
      const status = await appointmentsAPI.getGoogleStatus();
      setGoogleAccounts(status.accounts || []);
      setPrimaryAccount(status.primary_account);
      return status;
    } catch (err) {
      console.error('Failed to check Google connection:', err);
      return null;
    }
  };

  // Initiate Google OAuth flow (add new account)
  const connectGoogleCalendar = async (setAsPrimary = false) => {
    setError(null);
    try {
      const response = await appointmentsAPI.initiateGoogleOAuth(setAsPrimary);
      // CSRF Protection: Store state for validation in callback
      sessionStorage.setItem('google_calendar_oauth_state', response.state);
      // Redirect to Google OAuth
      window.location.href = response.authorization_url;
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Disconnect Google Calendar (legacy - disconnects primary)
  const disconnectGoogleCalendar = async () => {
    setError(null);
    try {
      await appointmentsAPI.disconnectGoogle();
      await checkGoogleConnection();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Manual sync with Google Calendar (legacy - syncs primary)
  const syncGoogleCalendar = async () => {
    setError(null);
    try {
      const result = await appointmentsAPI.syncGoogleCalendar();
      // Update last sync time
      await checkGoogleConnection();
      // Refresh appointments to show synced data
      await fetchAppointments();
      return {
        success: true,
        created: result.created || 0,
        updated: result.updated || 0,
        deleted: result.deleted || 0
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ========== Multi-Account Management ==========

  // Set a specific account as primary
  const setAccountAsPrimary = async (accountId) => {
    setError(null);
    try {
      const result = await appointmentsAPI.setAccountPrimary(accountId);
      await checkGoogleConnection();
      return { success: true, ...result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Disconnect a specific account
  const disconnectAccount = async (accountId) => {
    setError(null);
    try {
      const result = await appointmentsAPI.disconnectAccount(accountId);
      await checkGoogleConnection();
      // Refresh appointments to remove any from disconnected account
      await fetchAppointments();
      return { success: true, ...result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Rename an account
  const renameAccount = async (accountId, name) => {
    setError(null);
    try {
      const result = await appointmentsAPI.updateAccount(accountId, { name });
      await checkGoogleConnection();
      return { success: true, ...result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Update account color
  const updateAccountColor = async (accountId, color) => {
    setError(null);
    try {
      const result = await appointmentsAPI.updateAccount(accountId, { color });
      await checkGoogleConnection();
      return { success: true, ...result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Toggle account read-only status
  const toggleAccountReadOnly = async (accountId, isReadOnly) => {
    setError(null);
    try {
      const result = await appointmentsAPI.updateAccount(accountId, { is_read_only: isReadOnly });
      await checkGoogleConnection();
      await fetchAppointments();
      return { success: true, ...result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Sync a specific account
  const syncAccount = async (accountId) => {
    setError(null);
    try {
      const result = await appointmentsAPI.syncAccount(accountId);
      await checkGoogleConnection();
      await fetchAppointments();
      return {
        success: true,
        syncType: result.sync_type,
        created: result.created || 0,
        updated: result.updated || 0,
        deleted: result.deleted || 0,
        skipped: result.skipped || 0
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      start_date: null,
      end_date: null,
      appointment_type: null,
      contact_id: null,
      status: 'scheduled',
    });
    setCurrentPage(1);
  };

  // Check Google connection on mount
  useEffect(() => {
    checkGoogleConnection();
  }, []);

  return {
    // State
    appointments,
    loading,
    error,
    googleConnected,
    googleCalendarId,
    lastSync,
    currentPage,
    totalPages,
    totalAppointments,
    filters,

    // Multi-account Google Calendar state
    googleAccounts,
    primaryAccount,

    // Actions
    fetchAppointments,
    fetchAppointmentsForDateRange,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointment,
    updateFilters,
    clearFilters,
    setCurrentPage,

    // Google Calendar (legacy)
    checkGoogleConnection,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncGoogleCalendar,

    // Multi-account Google Calendar actions
    setAccountAsPrimary,
    disconnectAccount,
    renameAccount,
    updateAccountColor,
    toggleAccountReadOnly,
    syncAccount,
  };
}
