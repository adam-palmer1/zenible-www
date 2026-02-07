import { useState, useEffect, useCallback } from 'react';
import appointmentsAPI from '../services/api/crm/appointments';
import type {
  CalendarAppointmentResponse,
  CalendarAppointmentsResponse,
  AppointmentListResponse,
  AppointmentResponse,
  GoogleCalendarMultiAccountStatusResponse,
  GoogleAccountInfo,
} from '../types/crm';

interface CalendarFilters {
  start_date: string | null;
  end_date: string | null;
  appointment_type: string | null;
  contact_id: string | null;
  status: string | null;
}

interface GoogleOAuthInitiateResponse {
  authorization_url: string;
  state: string;
}

interface GoogleSyncResponse {
  sync_type?: string;
  created?: number;
  updated?: number;
  deleted?: number;
  skipped?: number;
  [key: string]: unknown;
}

interface AppointmentUpdateData {
  edit_scope?: string;
  recurrence?: Record<string, unknown> | null;
  [key: string]: unknown;
}

interface DeleteQueryParams {
  delete_scope?: string;
  occurrence_date?: string;
  [key: string]: unknown;
}

interface OperationResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

interface SyncResult extends OperationResult {
  created?: number;
  updated?: number;
  deleted?: number;
  skipped?: number;
  syncType?: string;
}

export function useCalendar() {
  const [appointments, setAppointments] = useState<CalendarAppointmentResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-account Google Calendar state
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccountInfo[]>([]);
  const [primaryAccount, setPrimaryAccount] = useState<GoogleAccountInfo | null>(null);

  // Derived state for backward compatibility
  const googleConnected = googleAccounts.length > 0;
  const googleCalendarId = primaryAccount?.primary_calendar_id || null;
  const lastSync = primaryAccount?.last_sync_at || null;

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalAppointments, setTotalAppointments] = useState<number>(0);

  // Filters
  const [filters, setFilters] = useState<CalendarFilters>({
    start_date: null,
    end_date: null,
    appointment_type: null,
    contact_id: null,
    status: 'scheduled', // Default to showing only scheduled appointments
  });

  // Fetch appointments with filters
  const fetchAppointments = useCallback(async (params: Record<string, unknown> = {}): Promise<AppointmentListResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const queryParams: Record<string, string> = {};
      const merged = {
        page: currentPage,
        per_page: 100, // Fetch more for calendar view
        ...filters,
        ...params,
      };
      for (const [key, value] of Object.entries(merged)) {
        if (value != null && value !== '') {
          queryParams[key] = String(value);
        }
      }

      const response = await appointmentsAPI.list<AppointmentListResponse>(queryParams);
      setAppointments((response.items || []) as unknown as CalendarAppointmentResponse[]);
      setTotalPages(response.total_pages || 1);
      setTotalAppointments(response.total || 0);
      return response;
    } catch (err: unknown) {
      setError((err as Error).message);
      console.error('Failed to fetch appointments:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Fetch appointments for a specific date range (for calendar view)
  const fetchAppointmentsForDateRange = useCallback(async (startDate: Date, endDate: Date): Promise<CalendarAppointmentsResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const filterParams: Record<string, string> = {};
      if (filters.status) {
        filterParams.status = filters.status;
      }
      const response = await appointmentsAPI.getCalendarAppointments<CalendarAppointmentsResponse>(
        startDate.toISOString(),
        endDate.toISOString(),
        filterParams
      );
      setAppointments(response.appointments || []);
      setTotalAppointments(response.total || 0);
      return response;
    } catch (err: unknown) {
      setError((err as Error).message);
      console.error('Failed to fetch calendar appointments:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  // Create appointment
  const createAppointment = async (data: unknown): Promise<OperationResult> => {
    setError(null);
    try {
      const newAppointment = await appointmentsAPI.create<CalendarAppointmentResponse>(data);
      setAppointments(prev => [newAppointment, ...prev]);
      setTotalAppointments(prev => prev + 1);
      return { success: true, appointment: newAppointment };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Update appointment
  const updateAppointment = async (appointmentId: string, data: AppointmentUpdateData, queryParams: Record<string, string> = {}): Promise<OperationResult> => {
    setError(null);
    try {
      const updated = await appointmentsAPI.update<CalendarAppointmentResponse>(appointmentId, data, queryParams);
      // For recurring appointments, refetch to get the updated instances
      // instead of trying to update in place, since the structure may have changed
      if (data.edit_scope || data.recurrence) {
        // Trigger a refetch of appointments to get the updated recurring instances
        // We'll let the parent component handle the refetch via useEffect
      } else {
        // For non-recurring updates, update in place
        setAppointments(prev =>
          prev.map(apt => apt.id === appointmentId ? updated : apt)
        );
      }
      return { success: true, appointment: updated };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Delete appointment
  const deleteAppointment = async (appointmentId: string, queryParams: DeleteQueryParams = {}): Promise<OperationResult> => {
    setError(null);
    try {
      const stringParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(queryParams)) {
        if (value != null && value !== '') {
          stringParams[key] = String(value);
        }
      }
      await appointmentsAPI.delete(appointmentId, stringParams);
      // For recurring appointments with scope, refetch to get updated instances
      if (queryParams.delete_scope) {
        // Trigger refetch - parent component will handle via useEffect
      } else {
        // For non-recurring deletes, remove from state
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
        setTotalAppointments(prev => prev - 1);
      }
      return { success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Get single appointment
  const getAppointment = async (appointmentId: string): Promise<OperationResult> => {
    setError(null);
    try {
      const appointment = await appointmentsAPI.get(appointmentId);
      return { success: true, appointment };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // ========== Google Calendar Integration ==========

  // Check Google Calendar connection status (multi-account)
  const checkGoogleConnection = async (): Promise<GoogleCalendarMultiAccountStatusResponse | null> => {
    try {
      const status = await appointmentsAPI.getGoogleStatus<GoogleCalendarMultiAccountStatusResponse>();
      setGoogleAccounts(status.accounts || []);
      setPrimaryAccount(status.primary_account || null);
      return status;
    } catch (err) {
      console.error('Failed to check Google connection:', err);
      return null;
    }
  };

  // Initiate Google OAuth flow (add new account)
  const connectGoogleCalendar = async (setAsPrimary: boolean = false): Promise<OperationResult> => {
    setError(null);
    try {
      const response = await appointmentsAPI.initiateGoogleOAuth<GoogleOAuthInitiateResponse>(setAsPrimary);
      // CSRF Protection: Store state for validation in callback
      sessionStorage.setItem('google_calendar_oauth_state', response.state);
      // Redirect to Google OAuth
      window.location.href = response.authorization_url;
      return { success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Disconnect Google Calendar (legacy - disconnects primary)
  const disconnectGoogleCalendar = async (): Promise<OperationResult> => {
    setError(null);
    try {
      await appointmentsAPI.disconnectGoogle();
      await checkGoogleConnection();
      return { success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Manual sync with Google Calendar (legacy - syncs primary)
  const syncGoogleCalendar = async (): Promise<SyncResult> => {
    setError(null);
    try {
      const result = await appointmentsAPI.syncGoogleCalendar<GoogleSyncResponse>();
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
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // ========== Multi-Account Management ==========

  // Set a specific account as primary
  const setAccountAsPrimary = async (accountId: string): Promise<OperationResult> => {
    setError(null);
    try {
      const result = await appointmentsAPI.setAccountPrimary<OperationResult>(accountId);
      await checkGoogleConnection();
      return { ...result, success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Disconnect a specific account
  const disconnectAccount = async (accountId: string): Promise<OperationResult> => {
    setError(null);
    try {
      const result = await appointmentsAPI.disconnectAccount<OperationResult>(accountId);
      await checkGoogleConnection();
      // Refresh appointments to remove any from disconnected account
      await fetchAppointments();
      return { ...result, success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Rename an account
  const renameAccount = async (accountId: string, name: string): Promise<OperationResult> => {
    setError(null);
    try {
      const result = await appointmentsAPI.updateAccount<OperationResult>(accountId, { name });
      await checkGoogleConnection();
      return { ...result, success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Update account color
  const updateAccountColor = async (accountId: string, color: string): Promise<OperationResult> => {
    setError(null);
    try {
      const result = await appointmentsAPI.updateAccount<OperationResult>(accountId, { color });
      await checkGoogleConnection();
      return { ...result, success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Toggle account read-only status
  const toggleAccountReadOnly = async (accountId: string, isReadOnly: boolean): Promise<OperationResult> => {
    setError(null);
    try {
      const result = await appointmentsAPI.updateAccount<OperationResult>(accountId, { is_read_only: isReadOnly });
      await checkGoogleConnection();
      await fetchAppointments();
      return { ...result, success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Sync a specific account
  const syncAccount = async (accountId: string): Promise<SyncResult> => {
    setError(null);
    try {
      const result = await appointmentsAPI.syncAccount<GoogleSyncResponse>(accountId);
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
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Update filters
  const updateFilters = (newFilters: Partial<CalendarFilters>): void => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Clear filters
  const clearFilters = (): void => {
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
