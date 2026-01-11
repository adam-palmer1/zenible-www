import { useState, useEffect, useCallback } from 'react';
import appointmentsAPI from '../services/api/crm/appointments';

export function useCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleCalendarId, setGoogleCalendarId] = useState(null);
  const [lastSync, setLastSync] = useState(null);

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

  // Check Google Calendar connection status
  const checkGoogleConnection = async () => {
    try {
      const status = await appointmentsAPI.getGoogleStatus();
      setGoogleConnected(status.is_connected);
      setGoogleCalendarId(status.primary_calendar_id);
      setLastSync(status.last_sync_at);
      return status;
    } catch (err) {
      console.error('Failed to check Google connection:', err);
      return null;
    }
  };

  // Initiate Google OAuth flow
  const connectGoogleCalendar = async () => {
    setError(null);
    try {
      const response = await appointmentsAPI.initiateGoogleOAuth();
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

  // Disconnect Google Calendar
  const disconnectGoogleCalendar = async () => {
    setError(null);
    try {
      await appointmentsAPI.disconnectGoogle();
      setGoogleConnected(false);
      setGoogleCalendarId(null);
      setLastSync(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // Manual sync with Google Calendar
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

  // Load appointments on mount and when filters/page change
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

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

    // Google Calendar
    checkGoogleConnection,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncGoogleCalendar,
  };
}
