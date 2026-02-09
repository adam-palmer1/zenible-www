import React, { useState, useEffect, useMemo, useCallback } from 'react';
import NewSidebar from '../sidebar/NewSidebar';
import { useCalendar } from '../../hooks/useCalendar';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useCRMReferenceData, type EnumItem } from '../../contexts/CRMReferenceDataContext';
import type { CalendarAppointmentResponse } from '../../types/crm';
import AppointmentModal from './AppointmentModal';
import RecurringScopeDialog from './RecurringScopeDialog';
import ConfirmationModal from '../shared/ConfirmationModal';
import CalendarHeader from './CalendarHeader';
import CalendarWeekView from './CalendarWeekView';
import CalendarMonthView from './CalendarMonthView';
import CalendarDayView from './CalendarDayView';
import CalendarMiniCalendar from './CalendarMiniCalendar';
import CalendarUpcomingSchedule from './CalendarUpcomingSchedule';
import CalendarSettingsModal from './CalendarSettingsModal';
import { isRecurringAppointment } from './calendarUtils';
import {
  format,
  addDays,
  addMonths,
  addWeeks,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  parseISO,
  startOfDay,
} from 'date-fns';

interface DragPreview {
  start: Date;
  end: Date;
  x: number;
  y: number;
}

interface AppointmentFormData {
  title?: string;
  description?: string | null;
  start_datetime?: string;
  end_datetime?: string;
  appointment_type?: string;
  contact_id?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  all_day?: boolean;
  recurrence?: Record<string, unknown> | null;
  edit_scope?: string;
  status?: string;
  [key: string]: unknown;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('weekly');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointmentResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [draggingAppointment, setDraggingAppointment] = useState<CalendarAppointmentResponse | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Recurring scope dialog state
  const [showRecurringScopeDialog, setShowRecurringScopeDialog] = useState(false);
  const [scopeDialogMode, setScopeDialogMode] = useState<'edit' | 'delete'>('edit');
  const [scopeDialogAppointment, setScopeDialogAppointment] = useState<CalendarAppointmentResponse | null>(null);
  const [selectedEditScope, setSelectedEditScope] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<CalendarAppointmentResponse | null>(null);

  const {
    appointments,
    googleConnected,
    googleAccounts,
    primaryAccount,
    fetchAppointmentsForDateRange,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    connectGoogleCalendar,
    setAccountAsPrimary,
    disconnectAccount,
    renameAccount,
    updateAccountColor,
    toggleAccountReadOnly,
    syncAccount,
  } = useCalendar();

  const { getPreference, updatePreference } = usePreferences();

  // Get enum metadata from context
  const {
    appointmentTypes,
    appointmentStatuses,
    loading: enumsLoading,
    getStatusColor
  } = useCRMReferenceData();

  // Build dynamic default colors from appointment types
  const DEFAULT_APPOINTMENT_COLORS = useMemo(() => {
    const colors: Record<string, string> = {};
    appointmentTypes.forEach((type: EnumItem) => {
      colors[type.value] = type.color || (type['default_color'] as string) || '#3b82f6';
    });
    return colors;
  }, [appointmentTypes]);

  // Initialize preferences
  const [visibleTypes, setVisibleTypes] = useState<string[]>(() => {
    const allTypeValues = appointmentTypes.map((t: EnumItem) => t.value);
    return getPreference('calendar_visible_types', allTypeValues.length > 0 ? allTypeValues : ['manual', 'call', 'follow_up']) as string[];
  });
  const [typeColors, setTypeColors] = useState<Record<string, string>>(() =>
    getPreference('calendar_type_colors', DEFAULT_APPOINTMENT_COLORS) as Record<string, string>
  );

  // Update visible types when appointment types load
  useEffect(() => {
    if (!enumsLoading && appointmentTypes.length > 0) {
      const allTypeValues = appointmentTypes.map((t: EnumItem) => t.value);
      const currentVisible = getPreference('calendar_visible_types', allTypeValues) as string[];
      setVisibleTypes(currentVisible);
    }
  }, [enumsLoading, appointmentTypes, getPreference]);

  // Load view mode from preferences
  useEffect(() => {
    const savedViewMode = getPreference('calendar_view_mode', 'weekly') as string;
    setViewMode(savedViewMode);
  }, [getPreference]);

  // Sync local state with preferences when they change
  useEffect(() => {
    const allTypeValues = appointmentTypes.map((t: EnumItem) => t.value);
    setVisibleTypes(getPreference('calendar_visible_types', allTypeValues.length > 0 ? allTypeValues : ['manual', 'call', 'follow_up']) as string[]);
    setTypeColors(getPreference('calendar_type_colors', DEFAULT_APPOINTMENT_COLORS) as Record<string, string>);
  }, [getPreference, appointmentTypes, DEFAULT_APPOINTMENT_COLORS]);

  // Migrate user preferences when enums load (Phase 9: Preference Migration)
  useEffect(() => {
    if (!enumsLoading && appointmentTypes.length > 0) {
      // Migrate colors - add new types from backend with their default colors
      const currentColors = getPreference('calendar_type_colors', {}) as Record<string, string>;
      const mergedColors: Record<string, string> = {};

      appointmentTypes.forEach((type: EnumItem) => {
        mergedColors[type.value] = currentColors[type.value] || type.color || (type['default_color'] as string) || '#3b82f6';
      });

      // Only update if there are new types
      if (Object.keys(mergedColors).length > Object.keys(currentColors).length) {
        updatePreference('calendar_type_colors', mergedColors, 'calendar');
        setTypeColors(mergedColors);
      }

      // Migrate visible types - ensure all types are visible by default
      const currentVisible = getPreference('calendar_visible_types', []) as string[];
      const allTypeValues = appointmentTypes.map((t: EnumItem) => t.value);
      const merged = [...new Set([...currentVisible, ...allTypeValues])];

      // Only update if there are new types to add
      if (merged.length > currentVisible.length) {
        updatePreference('calendar_visible_types', merged, 'calendar');
        setVisibleTypes(merged);
      }
    }
  }, [enumsLoading, appointmentTypes, getPreference, updatePreference]);

  // Fetch appointments when date or view mode changes
  useEffect(() => {
    const { startDate, endDate } = getDateRange();
    // Expand range to include +-1 month to ensure mini calendar shows all appointments
    const expandedStartDate = addMonths(startDate, -1);
    const expandedEndDate = addMonths(endDate, 1);
    fetchAppointmentsForDateRange(expandedStartDate, expandedEndDate);
  }, [currentDate, viewMode, fetchAppointmentsForDateRange]);

  // Poll for calendar changes every 120 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      const { startDate, endDate } = getDateRange();
      const expandedStartDate = addMonths(startDate, -1);
      const expandedEndDate = addMonths(endDate, 1);
      fetchAppointmentsForDateRange(expandedStartDate, expandedEndDate);
    }, 120000);

    return () => clearInterval(pollInterval);
  }, [currentDate, viewMode, fetchAppointmentsForDateRange]);

  // Get date range based on view mode
  const getDateRange = () => {
    let startDate: Date;
    let endDate: Date;

    switch (viewMode) {
      case 'daily':
        startDate = startOfDay(currentDate);
        endDate = addDays(startDate, 1);
        break;
      case 'weekly':
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        endDate = addDays(startDate, 7);
        break;
      case 'monthly':
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      default:
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        endDate = addDays(startDate, 7);
    }

    return { startDate, endDate };
  };

  // Get color for appointment (priority: Google account color > user type preference > backend default > fallback)
  const getAppointmentColor = useCallback((appointment: CalendarAppointmentResponse | string) => {
    // Handle legacy calls that pass just the type string
    const appointmentType = typeof appointment === 'string' ? appointment : (appointment?.appointment_type || 'manual');
    const googleTokenId = typeof appointment === 'object' ? appointment?.google_calendar_token_id : null;

    // 1. If appointment is from a Google Calendar account, use that account's color
    if (googleTokenId && googleAccounts.length > 0) {
      const account = googleAccounts.find(acc => String(acc.id) === String(googleTokenId));
      if (account?.color) {
        return account.color;
      }
    }

    // 2. Check user preference for appointment type
    if (typeColors[appointmentType]) {
      return typeColors[appointmentType];
    }

    // 3. Check backend default
    const typeObj = appointmentTypes.find((t: EnumItem) => t.value === appointmentType);
    if (typeObj?.color || typeObj?.['default_color']) {
      return typeObj.color || (typeObj['default_color'] as string);
    }

    // 4. Hardcoded fallback
    return '#3b82f6';
  }, [googleAccounts, typeColors, appointmentTypes]);

  // Check if appointment should be treated as read-only
  const isAppointmentReadOnly = useCallback((appointment: CalendarAppointmentResponse) => {
    // is_read_only may be present on extended responses from the backend
    if ((appointment as Record<string, unknown>)?.is_read_only) {
      return true;
    }

    const googleTokenId = appointment?.google_calendar_token_id;
    if (googleTokenId && googleAccounts.length > 0) {
      const account = googleAccounts.find(acc => String(acc.id) === String(googleTokenId));
      if (account?.is_read_only) {
        return true;
      }
    }

    return false;
  }, [googleAccounts]);

  // Filter appointments by visible types
  const filteredAppointments = appointments.filter((apt: CalendarAppointmentResponse) =>
    visibleTypes.includes(apt.appointment_type || 'manual')
  );

  // Toggle appointment type visibility
  const toggleAppointmentType = async (type: string) => {
    const newVisibleTypes = visibleTypes.includes(type)
      ? visibleTypes.filter(t => t !== type)
      : [...visibleTypes, type];

    setVisibleTypes(newVisibleTypes);
    await updatePreference('calendar_visible_types', newVisibleTypes, 'calendar');
  };

  // Update appointment type color
  const updateTypeColor = async (type: string, color: string) => {
    const newColors = { ...typeColors, [type]: color };
    setTypeColors(newColors);
    await updatePreference('calendar_type_colors', newColors, 'calendar');
  };

  // Reset colors to default
  const resetColors = async () => {
    setTypeColors(DEFAULT_APPOINTMENT_COLORS);
    await updatePreference('calendar_type_colors', DEFAULT_APPOINTMENT_COLORS, 'calendar');
  };

  // Update view mode and save to preferences
  const handleViewModeChange = async (newViewMode: string) => {
    setViewMode(newViewMode);
    await updatePreference('calendar_view_mode', newViewMode, 'calendar');
  };

  // Navigate date
  const navigateDate = (direction: string) => {
    if (direction === 'prev') {
      switch (viewMode) {
        case 'daily':
          setCurrentDate(addDays(currentDate, -1));
          break;
        case 'weekly':
          setCurrentDate(addWeeks(currentDate, -1));
          break;
        case 'monthly':
          setCurrentDate(addMonths(currentDate, -1));
          break;
      }
    } else {
      switch (viewMode) {
        case 'daily':
          setCurrentDate(addDays(currentDate, 1));
          break;
        case 'weekly':
          setCurrentDate(addWeeks(currentDate, 1));
          break;
        case 'monthly':
          setCurrentDate(addMonths(currentDate, 1));
          break;
      }
    }
  };

  // Handle appointment save
  const handleAppointmentSave = async (appointmentData: AppointmentFormData) => {
    if (selectedAppointment) {
      const updateData: AppointmentFormData = { ...appointmentData };

      if (selectedEditScope) {
        updateData.edit_scope = selectedEditScope;
      }

      const queryParams: Record<string, string> = {};
      if (selectedEditScope && (selectedEditScope === 'this' || selectedEditScope === 'this_and_future')) {
        queryParams.occurrence_date = selectedAppointment.start_datetime;
      }

      const result = await updateAppointment(selectedAppointment.id, updateData, queryParams);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update appointment');
      }

      if (selectedEditScope || appointmentData.recurrence) {
        const { startDate, endDate } = getDateRange();
        await fetchAppointmentsForDateRange(startDate, endDate);
      }
    } else {
      const createData = { ...appointmentData };
      delete createData.status;

      const result = await createAppointment(createData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create appointment');
      }

      if (appointmentData.recurrence) {
        const { startDate, endDate } = getDateRange();
        await fetchAppointmentsForDateRange(startDate, endDate);
      }
    }
    setShowAppointmentModal(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
    setSelectedEditScope(null);
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment: CalendarAppointmentResponse) => {
    const isRecurring = isRecurringAppointment(filteredAppointments, appointment.id);

    if (isRecurring) {
      setScopeDialogAppointment(appointment);
      setScopeDialogMode('edit');
      setShowRecurringScopeDialog(true);
    } else {
      setSelectedAppointment(appointment);
      setShowAppointmentModal(true);
    }
  };

  // Handle recurring scope selection for edit
  const handleEditScopeConfirm = (scope: string) => {
    setShowRecurringScopeDialog(false);
    setSelectedEditScope(scope);
    setSelectedAppointment(scopeDialogAppointment);
    setShowAppointmentModal(true);
  };

  // Handle new appointment
  const handleNewAppointment = (date: Date | null = null, time: { hour: number; minute: number } | null = null) => {
    setSelectedAppointment(null);

    if (date) {
      const appointmentDate = new Date(date);

      if (time !== null) {
        appointmentDate.setHours(time.hour, time.minute, 0, 0);
      } else {
        appointmentDate.setHours(9, 0, 0, 0);
      }

      setSelectedDate(appointmentDate.toISOString());
    } else {
      setSelectedDate(null);
    }

    setShowAppointmentModal(true);
  };

  // Handle appointment delete
  const handleAppointmentDelete = async (appointment: CalendarAppointmentResponse) => {
    const isRecurring = isRecurringAppointment(filteredAppointments, appointment.id);

    if (isRecurring) {
      setShowAppointmentModal(false);
      setScopeDialogAppointment(appointment);
      setScopeDialogMode('delete');
      setShowRecurringScopeDialog(true);
    } else {
      setAppointmentToDelete(appointment);
      setShowDeleteConfirmation(true);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (appointmentToDelete) {
      await deleteAppointment(appointmentToDelete.id);
      setShowAppointmentModal(false);
      setSelectedAppointment(null);
      setAppointmentToDelete(null);
    }
  };

  // Handle recurring scope selection for delete
  const handleDeleteScopeConfirm = async (scope: string) => {
    setShowRecurringScopeDialog(false);

    const queryParams: Record<string, string> = {
      delete_scope: scope
    };

    if (scope === 'this' || scope === 'this_and_future') {
      queryParams.occurrence_date = scopeDialogAppointment!.start_datetime;
    }

    await deleteAppointment(scopeDialogAppointment!.id, queryParams);

    const { startDate, endDate } = getDateRange();
    await fetchAppointmentsForDateRange(startDate, endDate);

    setScopeDialogAppointment(null);
  };

  // Handle drag start
  const handleDragStart = (appointment: CalendarAppointmentResponse, event: React.DragEvent) => {
    setDraggingAppointment(appointment);
    event.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    event.dataTransfer.setDragImage(img, 0, 0);
  };

  // Handle drag over - calculate new time and show preview
  const handleDragOver = (day: Date, event: React.DragEvent, timeSlots: number[]) => {
    event.preventDefault();
    if (!draggingAppointment) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;

    const slotHeight = 64;
    const totalMinutes = (y / slotHeight) * 60;
    const startHour = timeSlots[0];
    const minutesFromStart = startHour * 60 + totalMinutes;

    const snappedMinutes = Math.round(minutesFromStart / 15) * 15;
    const newHour = Math.floor(snappedMinutes / 60);
    const newMinute = snappedMinutes % 60;

    const originalStart = parseISO(draggingAppointment.start_datetime);
    const originalEnd = parseISO(draggingAppointment.end_datetime);
    const durationMs = originalEnd.getTime() - originalStart.getTime();

    const newStart = new Date(day);
    newStart.setHours(newHour, newMinute, 0, 0);
    const newEnd = new Date(newStart.getTime() + durationMs);

    setDragPreview({
      start: newStart,
      end: newEnd,
      x: event.clientX,
      y: event.clientY,
    });
  };

  // Handle drop - update appointment
  const handleDrop = async (day: Date, event: React.DragEvent, _timeSlots: number[]) => {
    event.preventDefault();
    if (!draggingAppointment || !dragPreview) return;

    try {
      await updateAppointment(draggingAppointment.id, {
        start_datetime: dragPreview.start.toISOString(),
        end_datetime: dragPreview.end.toISOString(),
      });
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }

    setDraggingAppointment(null);
    setDragPreview(null);
  };

  // Handle drag end - cleanup if drag was cancelled
  const handleDragEnd = () => {
    setDraggingAppointment(null);
    setDragPreview(null);
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  // Helper to get status label (used in sub-components)
  const getStatusLabel = (status: string) => {
    const statusObj = appointmentStatuses?.find((s: EnumItem) => s.value === status);
    return statusObj?.label || status;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <NewSidebar />

      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        <div className="flex-1 flex gap-4 p-4 overflow-hidden max-w-[2000px] mx-auto w-full">
          {/* Left: Calendar View */}
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
            {/* Calendar Header */}
            <CalendarHeader
              currentDate={currentDate}
              viewMode={viewMode}
              onNavigateDate={navigateDate}
              onViewModeChange={handleViewModeChange}
              onNewAppointment={() => handleNewAppointment()}
              onToday={() => setCurrentDate(new Date())}
              onOpenSettings={() => setShowSettingsModal(true)}
            />

            {/* Calendar View */}
            <div className="flex-1 overflow-hidden relative">
              {viewMode === 'weekly' && <CalendarWeekView
                currentDate={currentDate}
                appointments={filteredAppointments}
                timeSlots={timeSlots}
                onAppointmentClick={handleAppointmentClick}
                onNewAppointment={handleNewAppointment}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                draggingAppointment={draggingAppointment}
                dragPreview={dragPreview}
                getAppointmentColor={getAppointmentColor}
                isRecurringAppointment={isRecurringAppointment}
                isAppointmentReadOnly={isAppointmentReadOnly}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />}
              {viewMode === 'monthly' && <CalendarMonthView
                currentDate={currentDate}
                appointments={filteredAppointments}
                onAppointmentClick={handleAppointmentClick}
                onNewAppointment={handleNewAppointment}
                getAppointmentColor={getAppointmentColor}
                isRecurringAppointment={isRecurringAppointment}
                isAppointmentReadOnly={isAppointmentReadOnly}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />}
              {viewMode === 'daily' && <CalendarDayView
                currentDate={currentDate}
                appointments={filteredAppointments}
                timeSlots={timeSlots}
                onAppointmentClick={handleAppointmentClick}
                onNewAppointment={handleNewAppointment}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                draggingAppointment={draggingAppointment}
                dragPreview={dragPreview}
                getAppointmentColor={getAppointmentColor}
                isRecurringAppointment={isRecurringAppointment}
                isAppointmentReadOnly={isAppointmentReadOnly}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />}

              {/* Drag Preview Tooltip */}
              {dragPreview && (
                <div
                  className="fixed z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none"
                  style={{
                    left: `${dragPreview.x + 10}px`,
                    top: `${dragPreview.y + 10}px`,
                  }}
                >
                  {format(dragPreview.start, 'MMM d, h:mm a')} - {format(dragPreview.end, 'h:mm a')}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-4">
            {/* Mini Calendar */}
            <CalendarMiniCalendar
              currentDate={currentDate}
              onDateSelect={setCurrentDate}
              appointments={filteredAppointments}
            />

            {/* Upcoming Schedule */}
            <CalendarUpcomingSchedule
              appointments={filteredAppointments}
              onAppointmentClick={handleAppointmentClick}
            />
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setSelectedAppointment(null);
          setSelectedDate(null);
          setSelectedEditScope(null);
        }}
        onSave={handleAppointmentSave}
        onDelete={(appointment) => handleAppointmentDelete(appointment as CalendarAppointmentResponse)}
        appointment={selectedAppointment}
        initialDate={selectedDate}
        isReadOnly={selectedAppointment ? isAppointmentReadOnly(selectedAppointment) : false}
      />

      {/* Recurring Scope Dialog */}
      <RecurringScopeDialog
        isOpen={showRecurringScopeDialog}
        onClose={() => {
          setShowRecurringScopeDialog(false);
          setScopeDialogAppointment(null);
        }}
        onConfirm={scopeDialogMode === 'edit' ? handleEditScopeConfirm : handleDeleteScopeConfirm}
        mode={scopeDialogMode}
        appointment={scopeDialogAppointment}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setAppointmentToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Appointment"
        message={`Are you sure you want to delete "${appointmentToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Settings Modal */}
      {showSettingsModal && (
        <CalendarSettingsModal
          onClose={() => setShowSettingsModal(false)}
          googleConnected={googleConnected}
          googleAccounts={googleAccounts}
          primaryAccount={primaryAccount}
          connectGoogleCalendar={connectGoogleCalendar}
          setAccountAsPrimary={setAccountAsPrimary}
          disconnectAccount={disconnectAccount}
          renameAccount={renameAccount}
          updateAccountColor={updateAccountColor}
          toggleAccountReadOnly={toggleAccountReadOnly}
          syncAccount={syncAccount}
          enumsLoading={enumsLoading}
          appointmentTypes={appointmentTypes}
          visibleTypes={visibleTypes}
          typeColors={typeColors}
          defaultAppointmentColors={DEFAULT_APPOINTMENT_COLORS}
          toggleAppointmentType={toggleAppointmentType}
          updateTypeColor={updateTypeColor}
          resetColors={resetColors}
        />
      )}
    </div>
  );
}
