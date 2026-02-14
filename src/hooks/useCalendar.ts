import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import appointmentsAPI from '../services/api/crm/appointments';
import { queryKeys } from '../lib/query-keys';
import type {
  CalendarAppointmentResponse,
  CalendarAppointmentsResponse,
  AppointmentListResponse,
  GoogleCalendarMultiAccountStatusResponse,
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
  const queryClient = useQueryClient();

  // Appointments local state (populated by fetch methods)
  const [appointments, setAppointments] = useState<CalendarAppointmentResponse[]>([]);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    status: 'scheduled',
  });

  // Google Calendar status query (replaces useEffect + checkGoogleConnection on mount)
  const googleStatusQuery = useQuery({
    queryKey: queryKeys.calendar.googleStatus(),
    queryFn: () => appointmentsAPI.getGoogleStatus<GoogleCalendarMultiAccountStatusResponse>(),
  });

  // Derived Google Calendar state
  const googleAccounts = googleStatusQuery.data?.accounts || [];
  const primaryAccount = googleStatusQuery.data?.primary_account || null;
  const googleConnected = googleAccounts.length > 0;
  const googleCalendarId = primaryAccount?.primary_calendar_id || null;
  const lastSync = primaryAccount?.last_sync_at || null;

  // Fetch appointments with filters
  const fetchAppointments = useCallback(async (params: Record<string, unknown> = {}): Promise<AppointmentListResponse | null> => {
    setFetchLoading(true);
    setError(null);

    try {
      const queryParams: Record<string, string> = {};
      const merged = {
        page: currentPage,
        per_page: 100,
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
      setFetchLoading(false);
    }
  }, [currentPage, filters]);

  // Fetch appointments for a specific date range (for calendar view)
  const fetchAppointmentsForDateRange = useCallback(async (startDate: Date, endDate: Date): Promise<CalendarAppointmentsResponse | null> => {
    setFetchLoading(true);
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
      setFetchLoading(false);
    }
  }, [filters.status]);

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: (data: unknown) => appointmentsAPI.create<CalendarAppointmentResponse>(data),
    onSuccess: (newAppointment) => {
      setAppointments(prev => [newAppointment, ...prev]);
      setTotalAppointments(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });

  // Update appointment mutation
  const updateMutation = useMutation({
    mutationFn: ({ appointmentId, data, queryParams }: {
      appointmentId: string;
      data: AppointmentUpdateData;
      queryParams: Record<string, string>;
    }) => appointmentsAPI.update<CalendarAppointmentResponse>(appointmentId, data, queryParams),
    onSuccess: (updated, { data }) => {
      if (!data.edit_scope && !data.recurrence) {
        setAppointments(prev =>
          prev.map(apt => apt.id === updated.id ? updated : apt)
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });

  // Delete appointment mutation
  const deleteMutation = useMutation({
    mutationFn: ({ appointmentId, stringParams }: {
      appointmentId: string;
      stringParams: Record<string, string>;
    }) => appointmentsAPI.delete(appointmentId, stringParams),
    onSuccess: (_, { appointmentId, stringParams }) => {
      if (!stringParams.delete_scope) {
        setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
        setTotalAppointments(prev => prev - 1);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
    },
  });

  // Wrapper functions maintaining the original API surface
  const createAppointment = async (data: unknown): Promise<OperationResult> => {
    setError(null);
    try {
      const newAppointment = await createMutation.mutateAsync(data);
      return { success: true, appointment: newAppointment };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  const updateAppointment = async (appointmentId: string, data: AppointmentUpdateData, queryParams: Record<string, string> = {}): Promise<OperationResult> => {
    setError(null);
    try {
      const updated = await updateMutation.mutateAsync({ appointmentId, data, queryParams });
      return { success: true, appointment: updated };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  const deleteAppointment = async (appointmentId: string, queryParams: DeleteQueryParams = {}): Promise<OperationResult> => {
    setError(null);
    try {
      const stringParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(queryParams)) {
        if (value != null && value !== '') {
          stringParams[key] = String(value);
        }
      }
      await deleteMutation.mutateAsync({ appointmentId, stringParams });
      return { success: true };
    } catch (err: unknown) {
      setError((err as Error).message);
      return { success: false, error: (err as Error).message };
    }
  };

  // Get single appointment (imperative)
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
      const result = await googleStatusQuery.refetch();
      return result.data || null;
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
      await queryClient.refetchQueries({ queryKey: queryKeys.calendar.googleStatus() });
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
      await queryClient.refetchQueries({ queryKey: queryKeys.calendar.googleStatus() });
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
      await queryClient.refetchQueries({ queryKey: queryKeys.calendar.googleStatus() });
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
      await queryClient.refetchQueries({ queryKey: queryKeys.calendar.googleStatus() });
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
      await queryClient.refetchQueries({ queryKey: queryKeys.calendar.googleStatus() });
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
      await queryClient.refetchQueries({ queryKey: queryKeys.calendar.googleStatus() });
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
      await queryClient.refetchQueries({ queryKey: queryKeys.calendar.googleStatus() });
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
      await queryClient.refetchQueries({ queryKey: queryKeys.calendar.googleStatus() });
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

  return {
    // State
    appointments,
    loading: fetchLoading,
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
