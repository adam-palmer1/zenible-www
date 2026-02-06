import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import NewSidebar from '../sidebar/NewSidebar';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, Cog6ToothIcon, XMarkIcon, ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '../../hooks/useCalendar';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useCRMReferenceData } from '../../contexts/CRMReferenceDataContext';
import AppointmentModal from './AppointmentModal';
import RecurringScopeDialog from './RecurringScopeDialog';
import ConfirmationModal from '../shared/ConfirmationModal';
import {
  format,
  addDays,
  addMonths,
  addWeeks,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfDay,
  getHours,
  getMinutes,
} from 'date-fns';

// Helper: Generate unique key for appointments (handles recurring)
// Recurring appointments share the same ID, so we need to use start_datetime too
const getAppointmentKey = (appointment) => {
  return `${appointment.id}_${appointment.start_datetime}`;
};

// Helper: Check if appointment is recurring (multiple instances with same ID)
const isRecurringAppointment = (appointments, appointmentId) => {
  return appointments.filter(apt => apt.id === appointmentId).length > 1;
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('weekly');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [draggingAppointment, setDraggingAppointment] = useState(null);
  const [dragPreview, setDragPreview] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Recurring scope dialog state
  const [showRecurringScopeDialog, setShowRecurringScopeDialog] = useState(false);
  const [scopeDialogMode, setScopeDialogMode] = useState('edit'); // 'edit' or 'delete'
  const [scopeDialogAppointment, setScopeDialogAppointment] = useState(null);
  const [selectedEditScope, setSelectedEditScope] = useState(null); // Track scope for edit operations

  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const {
    appointments,
    loading,
    error,
    googleConnected,
    googleCalendarId,
    lastSync,
    googleAccounts,
    primaryAccount,
    fetchAppointmentsForDateRange,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncGoogleCalendar,
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
    recurringTypes,
    editScopes,
    loading: enumsLoading,
    error: enumsError,
    getTypeLabel,
    getStatusColor
  } = useCRMReferenceData();

  // Build dynamic default colors from appointment types
  const DEFAULT_APPOINTMENT_COLORS = useMemo(() => {
    const colors = {};
    appointmentTypes.forEach(type => {
      colors[type.value] = type.color || type.default_color || '#3b82f6';
    });
    return colors;
  }, [appointmentTypes]);

  // Initialize preferences
  const [visibleTypes, setVisibleTypes] = useState(() => {
    const allTypeValues = appointmentTypes.map(t => t.value);
    return getPreference('calendar_visible_types', allTypeValues.length > 0 ? allTypeValues : ['manual', 'call', 'follow_up']);
  });
  const [typeColors, setTypeColors] = useState(() =>
    getPreference('calendar_type_colors', DEFAULT_APPOINTMENT_COLORS)
  );

  // Update visible types when appointment types load
  useEffect(() => {
    if (!enumsLoading && appointmentTypes.length > 0) {
      const allTypeValues = appointmentTypes.map(t => t.value);
      const currentVisible = getPreference('calendar_visible_types', allTypeValues);
      setVisibleTypes(currentVisible);
    }
  }, [enumsLoading, appointmentTypes, getPreference]);

  // Load view mode from preferences
  useEffect(() => {
    const savedViewMode = getPreference('calendar_view_mode', 'weekly');
    setViewMode(savedViewMode);
  }, [getPreference]);

  // Sync local state with preferences when they change
  useEffect(() => {
    const allTypeValues = appointmentTypes.map(t => t.value);
    setVisibleTypes(getPreference('calendar_visible_types', allTypeValues.length > 0 ? allTypeValues : ['manual', 'call', 'follow_up']));
    setTypeColors(getPreference('calendar_type_colors', DEFAULT_APPOINTMENT_COLORS));
  }, [getPreference, appointmentTypes, DEFAULT_APPOINTMENT_COLORS]);

  // Migrate user preferences when enums load (Phase 9: Preference Migration)
  useEffect(() => {
    if (!enumsLoading && appointmentTypes.length > 0) {
      // Migrate colors - add new types from backend with their default colors
      const currentColors = getPreference('calendar_type_colors', {});
      const mergedColors = {};

      appointmentTypes.forEach(type => {
        mergedColors[type.value] = currentColors[type.value] || type.color || type.default_color || '#3b82f6';
      });

      // Only update if there are new types
      if (Object.keys(mergedColors).length > Object.keys(currentColors).length) {
        updatePreference('calendar_type_colors', mergedColors, 'calendar');
        setTypeColors(mergedColors);
      }

      // Migrate visible types - ensure all types are visible by default
      const currentVisible = getPreference('calendar_visible_types', []);
      const allTypeValues = appointmentTypes.map(t => t.value);
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
    // Expand range to include ±1 month to ensure mini calendar shows all appointments
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
    }, 120000); // 120 seconds

    return () => clearInterval(pollInterval);
  }, [currentDate, viewMode, fetchAppointmentsForDateRange]);

  // Get date range based on view mode
  const getDateRange = () => {
    let startDate, endDate;

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
  const getAppointmentColor = useCallback((appointment) => {
    // Handle legacy calls that pass just the type string
    const appointmentType = typeof appointment === 'string' ? appointment : (appointment?.appointment_type || 'manual');
    const googleTokenId = typeof appointment === 'object' ? appointment?.google_calendar_token_id : null;

    // 1. If appointment is from a Google Calendar account, use that account's color
    if (googleTokenId && googleAccounts.length > 0) {
      // Use String() for comparison to handle string/number type mismatch
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
    const typeObj = appointmentTypes.find(t => t.value === appointmentType);
    if (typeObj?.color || typeObj?.default_color) {
      return typeObj.color || typeObj.default_color;
    }

    // 4. Hardcoded fallback
    return '#3b82f6';
  }, [googleAccounts, typeColors, appointmentTypes]);

  // Check if appointment should be treated as read-only
  // Either the appointment itself is read-only, or the associated Google account is marked as read-only
  const isAppointmentReadOnly = useCallback((appointment) => {
    // Check appointment's own flag first
    if (appointment?.is_read_only) {
      return true;
    }

    // Check if the associated Google account is marked as read-only
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
  const filteredAppointments = appointments.filter(apt =>
    visibleTypes.includes(apt.appointment_type || 'manual')
  );

  // Toggle appointment type visibility
  const toggleAppointmentType = async (type) => {
    const newVisibleTypes = visibleTypes.includes(type)
      ? visibleTypes.filter(t => t !== type)
      : [...visibleTypes, type];

    setVisibleTypes(newVisibleTypes);
    await updatePreference('calendar_visible_types', newVisibleTypes, 'calendar');
  };

  // Update appointment type color
  const updateTypeColor = async (type, color) => {
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
  const handleViewModeChange = async (newViewMode) => {
    setViewMode(newViewMode);
    await updatePreference('calendar_view_mode', newViewMode, 'calendar');
  };

  // Navigate date
  const navigateDate = (direction) => {
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
  const handleAppointmentSave = async (appointmentData) => {
    if (selectedAppointment) {
      // UPDATE: For recurring appointments, include edit_scope and occurrence_date
      const updateData = { ...appointmentData };

      if (selectedEditScope) {
        updateData.edit_scope = selectedEditScope;
      }

      // Build query params for recurring edits
      const queryParams = {};
      if (selectedEditScope && (selectedEditScope === 'this' || selectedEditScope === 'this_and_future')) {
        queryParams.occurrence_date = selectedAppointment.start_datetime;
      }

      await updateAppointment(selectedAppointment.id, updateData, queryParams);

      // Refetch appointments if this was a recurring edit
      if (selectedEditScope || appointmentData.recurrence) {
        const { startDate, endDate } = getDateRange();
        await fetchAppointmentsForDateRange(startDate, endDate);
      }
    } else {
      // CREATE: Remove status field (backend auto-sets to 'scheduled')
      const createData = { ...appointmentData };
      delete createData.status;

      await createAppointment(createData);
      // Refetch if creating a recurring appointment
      if (appointmentData.recurrence) {
        const { startDate, endDate } = getDateRange();
        await fetchAppointmentsForDateRange(startDate, endDate);
      }
    }
    setShowAppointmentModal(false);
    setSelectedAppointment(null);
    setSelectedDate(null);
    setSelectedEditScope(null); // Clear edit scope
  };

  // Handle appointment click
  const handleAppointmentClick = (appointment) => {
    const isRecurring = isRecurringAppointment(filteredAppointments, appointment.id);

    if (isRecurring) {
      // Show scope dialog for recurring appointments
      setScopeDialogAppointment(appointment);
      setScopeDialogMode('edit');
      setShowRecurringScopeDialog(true);
    } else {
      // Directly open edit modal for non-recurring appointments
      setSelectedAppointment(appointment);
      setShowAppointmentModal(true);
    }
  };

  // Handle recurring scope selection for edit
  const handleEditScopeConfirm = (scope) => {
    setShowRecurringScopeDialog(false);
    setSelectedEditScope(scope);
    setSelectedAppointment(scopeDialogAppointment);
    setShowAppointmentModal(true);
  };

  // Handle new appointment
  const handleNewAppointment = (date = null, time = null) => {
    setSelectedAppointment(null);

    // If date is provided, construct a full datetime
    if (date) {
      const appointmentDate = new Date(date);

      // If time is provided (e.g., from clicking a time slot), use it
      if (time !== null) {
        appointmentDate.setHours(time.hour, time.minute, 0, 0);
      } else {
        // Default to 9 AM if only date is provided (e.g., from month view)
        appointmentDate.setHours(9, 0, 0, 0);
      }

      setSelectedDate(appointmentDate.toISOString());
    } else {
      setSelectedDate(null);
    }

    setShowAppointmentModal(true);
  };

  // Handle appointment delete
  const handleAppointmentDelete = async (appointment) => {
    const isRecurring = isRecurringAppointment(filteredAppointments, appointment.id);

    if (isRecurring) {
      // Close the edit modal and show scope dialog for recurring appointments
      setShowAppointmentModal(false);
      setScopeDialogAppointment(appointment);
      setScopeDialogMode('delete');
      setShowRecurringScopeDialog(true);
    } else {
      // Show confirmation modal for non-recurring appointments
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
  const handleDeleteScopeConfirm = async (scope) => {
    setShowRecurringScopeDialog(false);

    // Build query params for recurring deletes
    const queryParams = {
      delete_scope: scope
    };

    if (scope === 'this' || scope === 'this_and_future') {
      queryParams.occurrence_date = scopeDialogAppointment.start_datetime;
    }

    await deleteAppointment(scopeDialogAppointment.id, queryParams);

    // Refetch appointments to get updated recurring instances
    const { startDate, endDate } = getDateRange();
    await fetchAppointmentsForDateRange(startDate, endDate);

    setScopeDialogAppointment(null);
  };

  // Handle drag start
  const handleDragStart = (appointment, event) => {
    setDraggingAppointment(appointment);
    event.dataTransfer.effectAllowed = 'move';
    // Make drag image transparent
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    event.dataTransfer.setDragImage(img, 0, 0);
  };

  // Handle drag over - calculate new time and show preview
  const handleDragOver = (day, event, timeSlots) => {
    event.preventDefault();
    if (!draggingAppointment) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;

    // Calculate which time slot we're over
    const slotHeight = 64; // Height of each hour slot
    const totalMinutes = (y / slotHeight) * 60;
    const startHour = timeSlots[0]; // First hour in the day
    const minutesFromStart = startHour * 60 + totalMinutes;

    // Snap to 15-minute intervals
    const snappedMinutes = Math.round(minutesFromStart / 15) * 15;
    const newHour = Math.floor(snappedMinutes / 60);
    const newMinute = snappedMinutes % 60;

    // Calculate appointment duration
    const originalStart = parseISO(draggingAppointment.start_datetime);
    const originalEnd = parseISO(draggingAppointment.end_datetime);
    const durationMs = originalEnd - originalStart;

    // Create new start and end times
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
  const handleDrop = async (day, event, timeSlots) => {
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

  const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 12 AM to 11 PM (full 24 hours)

  return (
    <div className="flex h-screen bg-gray-50">
      <NewSidebar />

      <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width, 280px)' }}>
        <div className="flex-1 flex gap-4 p-4 overflow-hidden max-w-[2000px] mx-auto w-full">
          {/* Left: Calendar View */}
          <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden min-w-0">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h2 className={`font-semibold text-gray-900 ${viewMode === 'daily' ? 'text-base' : 'text-xl'}`}>
                  {viewMode === 'daily' && format(currentDate, 'd MMM yyyy')}
                  {viewMode === 'weekly' && format(currentDate, 'MMM yyyy')}
                  {viewMode === 'monthly' && format(currentDate, 'MMM yyyy')}
                </h2>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Today
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleViewModeChange('daily')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'daily'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => handleViewModeChange('weekly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'weekly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => handleViewModeChange('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                <button
                  onClick={() => handleNewAppointment()}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  New Appointment
                </button>

                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Calendar Settings"
                >
                  <Cog6ToothIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Calendar View */}
            <div className="flex-1 overflow-hidden relative">
              {viewMode === 'weekly' && <WeekView
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
              />}
              {viewMode === 'monthly' && <MonthView
                currentDate={currentDate}
                appointments={filteredAppointments}
                onAppointmentClick={handleAppointmentClick}
                onNewAppointment={handleNewAppointment}
                getAppointmentColor={getAppointmentColor}
                isRecurringAppointment={isRecurringAppointment}
                isAppointmentReadOnly={isAppointmentReadOnly}
              />}
              {viewMode === 'daily' && <DayView
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
            <MiniCalendar
              currentDate={currentDate}
              onDateSelect={setCurrentDate}
              appointments={filteredAppointments}
            />

            {/* Upcoming Schedule */}
            <UpcomingSchedule
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
        onDelete={handleAppointmentDelete}
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowSettingsModal(false)}
            />

            {/* Modal */}
            <div className="inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Calendar Settings</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-4 space-y-6">
                {/* Google Calendar Integration */}
                <GoogleCalendarConnector
                  isConnected={googleConnected}
                  accounts={googleAccounts}
                  primaryAccount={primaryAccount}
                  onAddAccount={connectGoogleCalendar}
                  onSetPrimary={setAccountAsPrimary}
                  onDisconnect={disconnectAccount}
                  onRename={renameAccount}
                  onColorChange={updateAccountColor}
                  onToggleReadOnly={toggleAccountReadOnly}
                  onSync={syncAccount}
                />

                {/* Divider */}
                <div className="border-t border-gray-200"></div>

                {/* Appointment Types */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Appointment Types</h3>

                  {enumsLoading ? (
                    <div className="space-y-3">
                      <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
                      <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
                      <div className="animate-pulse h-12 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointmentTypes.map(type => (
                        <div key={type.value} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`type-${type.value}`}
                              checked={visibleTypes.includes(type.value)}
                              onChange={() => toggleAppointmentType(type.value)}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <label htmlFor={`type-${type.value}`} className="text-sm text-gray-700 cursor-pointer">
                              {type.label}
                            </label>
                          </div>
                          <input
                            type="color"
                            value={typeColors[type.value] || DEFAULT_APPOINTMENT_COLORS[type.value] || '#3b82f6'}
                            onChange={(e) => updateTypeColor(type.value, e.target.value)}
                            className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                            title={`Choose color for ${type.label.toLowerCase()}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reset Colors Button */}
                  <button
                    onClick={resetColors}
                    className="mt-4 w-full px-4 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Reset Colors to Default
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Week View Component ==========
function WeekView({ currentDate, appointments, timeSlots, onAppointmentClick, onNewAppointment, onDragStart, onDragOver, onDrop, onDragEnd, draggingAppointment, dragPreview, getAppointmentColor, isRecurringAppointment, isAppointmentReadOnly }) {
  const scrollContainerRef = useRef(null);
  const [appointmentsBelow, setAppointmentsBelow] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Generate current week only (Mon-Sun) - memoized
  const days = useMemo(() => {
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const result = [];
    for (let d = 0; d < 7; d++) {
      result.push(addDays(currentWeekStart, d));
    }
    return result;
  }, [currentDate]);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPosition = 8 * 64;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Check if there are appointments below the visible area
  useEffect(() => {
    const checkAppointmentsBelow = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const visibleBottom = container.scrollTop + container.clientHeight;
      const totalHeight = container.scrollHeight;

      // Get all timed appointments for the current week
      const weekAppointments = appointments.filter(apt => {
        const aptDate = parseISO(apt.start_datetime);
        return days.some(day => isSameDay(aptDate, day)) && !apt.all_day;
      });

      // Also check if we're not at the bottom of the scroll
      const notAtBottom = visibleBottom < totalHeight - 10;

      if (!notAtBottom) {
        setAppointmentsBelow([]);
        return;
      }

      // Get appointments that start below the visible area
      const below = weekAppointments.filter(apt => {
        const startDate = parseISO(apt.start_datetime);
        const startHour = getHours(startDate);
        const startMinute = getMinutes(startDate);
        const appointmentTop = startHour * 64 + (startMinute / 60) * 64;
        return appointmentTop > visibleBottom - 32; // 32px buffer
      });

      setAppointmentsBelow(below);
    };

    checkAppointmentsBelow();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkAppointmentsBelow);
      return () => container.removeEventListener('scroll', checkAppointmentsBelow);
    }
  }, [appointments, days]);

  // Helper to format hour display
  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  // Helper to check if a day is a weekend
  const isWeekend = (day) => {
    const dayOfWeek = day.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
  };

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.start_datetime);
      return isSameDay(aptDate, day) && !apt.all_day;
    });
  };

  const getAllDayAppointmentsForDay = (day) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.start_datetime);
      return isSameDay(aptDate, day) && apt.all_day;
    });
  };

  // Calculate layout for overlapping appointments
  const calculateAppointmentLayout = (dayAppointments) => {
    if (dayAppointments.length === 0) return [];

    const appointmentsWithLayout = dayAppointments.map(apt => {
      const startDate = parseISO(apt.start_datetime);
      const endDate = parseISO(apt.end_datetime);
      return {
        ...apt,
        startTime: getHours(startDate) * 60 + getMinutes(startDate),
        endTime: getHours(endDate) * 60 + getMinutes(endDate),
      };
    });

    // Sort by start time, then by duration (longer first)
    appointmentsWithLayout.sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime - b.startTime;
      return (b.endTime - b.startTime) - (a.endTime - a.startTime);
    });

    // Track which columns are occupied at each time
    const columns = [];

    appointmentsWithLayout.forEach(apt => {
      // Find the first available column for this appointment
      let column = 0;
      let placed = false;

      while (!placed) {
        // Check if this column is free for the entire duration of the appointment
        if (!columns[column]) {
          columns[column] = [];
        }

        const isFree = columns[column].every(existing => {
          // Check if there's no overlap
          return apt.startTime >= existing.endTime || apt.endTime <= existing.startTime;
        });

        if (isFree) {
          // Place the appointment in this column
          apt.column = column;
          columns[column].push(apt);
          placed = true;
        } else {
          column++;
        }
      }
    });

    // Calculate total columns for each appointment based on what overlaps with it
    appointmentsWithLayout.forEach(apt => {
      let maxConcurrent = 0;

      // Find all appointments that overlap with this one
      appointmentsWithLayout.forEach(other => {
        if (apt.startTime < other.endTime && apt.endTime > other.startTime) {
          maxConcurrent = Math.max(maxConcurrent, other.column + 1);
        }
      });

      apt.totalColumns = maxConcurrent;
    });

    return appointmentsWithLayout;
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Day Headers Row - Fixed */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {/* Empty corner for time column */}
        <div className="w-24 flex-shrink-0 border-r border-gray-200"></div>

        {/* Day Headers */}
        <div className="flex-1 flex">
          {days.map((day, dayIndex) => {
            const allDayAppts = getAllDayAppointmentsForDay(day);
            const weekend = isWeekend(day);
            return (
              <div key={dayIndex} className={`flex-1 min-w-[100px] border-r border-gray-200 last:border-r-0 ${weekend ? 'bg-gray-50' : ''}`}>
                  <div className={`min-h-16 flex flex-col items-center justify-start py-1 ${
                    isSameDay(day, new Date()) ? 'bg-purple-100' : ''
                  }`}>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-gray-600">{format(day, 'EEE')}</span>
                      <span className={`text-lg font-semibold ${
                        isSameDay(day, new Date()) ? 'text-purple-600' : 'text-gray-900'
                      }`}>{format(day, 'd')}</span>
                    </div>

                    {/* All-day appointments */}
                    {allDayAppts.length > 0 && (
                      <div className="w-full px-1 mt-1 space-y-1">
                        {allDayAppts.map((apt) => {
                          const color = getAppointmentColor(apt);
                          const isRecurring = isRecurringAppointment(appointments, apt.id);
                          const isReadOnly = isAppointmentReadOnly(apt);
                          return (
                            <div
                              key={getAppointmentKey(apt)}
                              onClick={() => onAppointmentClick(apt)}
                              className={`text-white text-xs px-1 py-0.5 rounded truncate flex items-center gap-0.5 cursor-pointer ${
                                isReadOnly
                                  ? 'opacity-60'
                                  : 'bg-opacity-90 hover:bg-opacity-100'
                              }`}
                              style={{ backgroundColor: color }}
                              title={isReadOnly ? 'Read-only (imported from secondary calendar)' : undefined}
                            >
                              {isReadOnly && <LockClosedIcon className="w-3 h-3 flex-shrink-0" />}
                              {isRecurring && <ArrowPathIcon className="w-3 h-3 flex-shrink-0" />}
                              <span className="truncate">{apt.title}</span>
                              {apt.status && apt.status !== 'scheduled' && (
                                <span
                                  className="text-[10px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                                  style={{ color: getStatusColor(apt.status) }}
                                  title={getStatusLabel(apt.status)}
                                >
                                  {getStatusLabel(apt.status)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Content - Time column and days scroll together */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="flex">
          {/* Time Column */}
          <div className="w-24 flex-shrink-0 border-r border-gray-200">
            {timeSlots.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-500">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          <div className="flex-1 flex relative">
            {days.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDay(day);
              const appointmentsWithLayout = calculateAppointmentLayout(dayAppointments);
              const weekend = isWeekend(day);

              return (
                <div
                  key={dayIndex}
                  className="flex-1 min-w-[100px] border-r border-gray-200 last:border-r-0 relative"
                    onDragOver={(e) => onDragOver(day, e, timeSlots)}
                    onDrop={(e) => onDrop(day, e, timeSlots)}
                  >
                    {/* Time Slots */}
                    {timeSlots.map((hour, timeIndex) => (
                      <div
                        key={timeIndex}
                        onClick={() => onNewAppointment(day, { hour, minute: 0 })}
                        className={`h-16 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                          isSameDay(day, new Date()) ? 'bg-purple-50' : weekend ? 'bg-gray-50' : ''
                        }`}
                      ></div>
                    ))}

                    {/* Appointments */}
                    {appointmentsWithLayout.map((appointment) => {
                      const startDate = parseISO(appointment.start_datetime);
                      const endDate = parseISO(appointment.end_datetime);
                      const startHour = getHours(startDate);
                      const startMinute = getMinutes(startDate);
                      const endHour = getHours(endDate);
                      const endMinute = getMinutes(endDate);
                      const duration = (endHour - startHour) + (endMinute - startMinute) / 60;
                      const startIndex = timeSlots.findIndex(t => t === startHour);

                      if (startIndex === -1) return null;

                      const color = getAppointmentColor(appointment);
                      const isRecurring = isRecurringAppointment(appointments, appointment.id);
                      const isReadOnly = isAppointmentReadOnly(appointment);

                      // Calculate width and left position based on column layout
                      const widthPercent = 100 / appointment.totalColumns;
                      const leftPercent = (appointment.column * widthPercent);

                      const isDragging = draggingAppointment?.id === appointment.id;

                      return (
                        <div
                          key={getAppointmentKey(appointment)}
                          draggable={!isReadOnly}
                          onDragStart={isReadOnly ? undefined : (e) => onDragStart(appointment, e)}
                          onDragEnd={isReadOnly ? undefined : onDragEnd}
                          onClick={() => !isDragging && onAppointmentClick(appointment)}
                          className={`absolute rounded-lg px-2 py-1 shadow-sm transition-all z-10 cursor-pointer overflow-hidden ${
                            isReadOnly
                              ? ''
                              : 'cursor-move hover:brightness-110'
                          } ${isDragging ? 'opacity-40' : ''}`}
                          style={{
                            backgroundColor: color,
                            opacity: isReadOnly ? 0.5 : (isDragging ? 0.4 : 0.9),
                            top: `${startIndex * 64 + (startMinute / 60) * 64}px`,
                            height: `${duration * 64 - 4}px`,
                            minHeight: '24px',
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                          }}
                          title={isReadOnly ? 'Read-only (imported from secondary calendar)' : (appointment.contact ? `Contact: ${appointment.contact.name}` : '')}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            {isReadOnly && <LockClosedIcon className="w-3 h-3 text-white flex-shrink-0" />}
                            {isRecurring && <ArrowPathIcon className="w-3 h-3 text-white flex-shrink-0" />}
                            <p className="text-white text-[11px] font-normal truncate min-w-0">{appointment.title}</p>
                          </div>
                          {duration >= 0.75 && (
                            <p className="text-white text-[10px] font-light opacity-90 truncate">
                              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* Drag Preview */}
                    {dragPreview && draggingAppointment && isSameDay(day, dragPreview.start) && (
                      (() => {
                        const previewStartHour = getHours(dragPreview.start);
                        const previewStartMinute = getMinutes(dragPreview.start);
                        const previewEndHour = getHours(dragPreview.end);
                        const previewEndMinute = getMinutes(dragPreview.end);
                        const previewDuration = (previewEndHour - previewStartHour) + (previewEndMinute - previewStartMinute) / 60;
                        const previewStartIndex = timeSlots.findIndex(t => t === previewStartHour);

                        if (previewStartIndex === -1) return null;

                        const color = getAppointmentColor(draggingAppointment);

                        return (
                          <div
                            className="absolute border-2 border-dashed rounded-lg p-2 pointer-events-none z-20"
                            style={{
                              backgroundColor: color,
                              opacity: 0.4,
                              borderColor: color,
                              top: `${previewStartIndex * 64 + (previewStartMinute / 60) * 64}px`,
                              height: `${previewDuration * 64 - 4}px`,
                              minHeight: '30px',
                              left: '2px',
                              right: '2px',
                            }}
                          >
                            <p className="text-white text-xs font-medium truncate">{draggingAppointment.title}</p>
                            <p className="text-white text-xs opacity-90">
                              {format(dragPreview.start, 'h:mm a')} - {format(dragPreview.end, 'h:mm a')}
                            </p>
                          </div>
                        );
                      })()
                    )}

                  </div>
                );
              })}

              {/* Current Time Indicator - spans all columns */}
              {(() => {
                const currentHour = getHours(currentTime);
                const currentMinute = getMinutes(currentTime);
                const timePosition = currentHour * 64 + (currentMinute / 60) * 64;
                return (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: `${timePosition}px` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-600 -ml-1"></div>
                    <div className="flex-1 h-0.5 bg-purple-600"></div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>

      {/* Scroll indicator for appointments below - colored bars per day */}
      {appointmentsBelow.length > 0 && (
        <div className="absolute bottom-0 left-24 right-0 h-2 flex pointer-events-none z-30">
          {days.map((day, dayIndex) => {
            // Get appointments below for this specific day
            const dayApptsBelow = appointmentsBelow.filter(apt => {
              const aptDate = parseISO(apt.start_datetime);
              return isSameDay(aptDate, day);
            });

            // Get unique colors for this day's appointments
            const colors = [...new Set(dayApptsBelow.map(apt => getAppointmentColor(apt)))];

            return (
              <div key={dayIndex} className="flex-1 min-w-[100px] flex h-full">
                {colors.length > 0 ? (
                  colors.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className="flex-1 h-full"
                      style={{ backgroundColor: color }}
                    />
                  ))
                ) : (
                  <div className="flex-1 h-full" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== Month View Component ==========
function MonthView({ currentDate, appointments, onAppointmentClick, onNewAppointment, getAppointmentColor, isRecurringAppointment, isAppointmentReadOnly }) {
  const gridRef = useRef(null);
  const [maxVisibleAppointments, setMaxVisibleAppointments] = useState(3);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Calculate number of weeks (rows) in the current month view
  const numWeeks = Math.ceil(days.length / 7);

  // Calculate how many appointments can fit based on cell height
  useEffect(() => {
    const calculateMaxAppointments = () => {
      if (!gridRef.current) return;

      const gridHeight = gridRef.current.clientHeight;
      const cellHeight = gridHeight / numWeeks;

      // Each appointment takes ~20px (12px text + 4px padding + 4px margin)
      // Date number takes ~24px, "+X more" takes ~16px, cell padding is ~16px
      const appointmentHeight = 20;
      const reservedHeight = 56; // date + more text + padding

      const availableHeight = cellHeight - reservedHeight;
      const maxAppts = Math.max(0, Math.floor(availableHeight / appointmentHeight));

      setMaxVisibleAppointments(maxAppts);
    };

    calculateMaxAppointments();

    // Use ResizeObserver to recalculate on resize
    const resizeObserver = new ResizeObserver(calculateMaxAppointments);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [numWeeks]);

  const getAppointmentsForDay = (day) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.start_datetime);
      return isSameDay(aptDate, day);
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0 pr-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto scrollbar-hover">
        <div className="grid grid-cols-7 h-full" style={{ gridTemplateRows: 'repeat(auto-fit, minmax(0, 1fr))' }}>
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const visibleAppointments = dayAppointments.slice(0, maxVisibleAppointments);
          const hiddenCount = dayAppointments.length - visibleAppointments.length;

          return (
            <div
              key={index}
              onClick={() => onNewAppointment(day)}
              className={`border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-gray-50 overflow-hidden ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${isToday ? 'bg-purple-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                !isCurrentMonth ? 'text-gray-400' : isToday ? 'text-purple-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {visibleAppointments.map((apt) => {
                  const color = getAppointmentColor(apt);
                  const isRecurring = isRecurringAppointment(appointments, apt.id);
                  const isReadOnly = isAppointmentReadOnly(apt);

                  return (
                    <div
                      key={getAppointmentKey(apt)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(apt);
                      }}
                      className={`text-xs text-white px-1 py-0.5 rounded cursor-pointer ${
                        isReadOnly
                          ? 'opacity-50'
                          : 'hover:brightness-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={isReadOnly ? 'Read-only (imported from secondary calendar)' : (apt.contact ? `Contact: ${apt.contact.name}` : '')}
                    >
                      <div className="flex items-center gap-1 truncate">
                        {isReadOnly && <LockClosedIcon className="w-3 h-3 flex-shrink-0" />}
                        {isRecurring && <ArrowPathIcon className="w-3 h-3 flex-shrink-0" />}
                        <span className="truncate">{format(parseISO(apt.start_datetime), 'h:mm a')} {apt.title}</span>
                        {apt.status && apt.status !== 'scheduled' && (
                          <span
                            className="text-[10px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                            style={{ color: getStatusColor(apt.status) }}
                            title={getStatusLabel(apt.status)}
                          >
                            {getStatusLabel(apt.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {hiddenCount > 0 && (
                  <div className="text-xs text-gray-500">
                    {visibleAppointments.length === 0
                      ? `${dayAppointments.length} Appointment${dayAppointments.length > 1 ? 's' : ''}`
                      : `+${hiddenCount} more`
                    }
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

// ========== Day View Component ==========
function DayView({ currentDate, appointments, timeSlots, onAppointmentClick, onNewAppointment, onDragStart, onDragOver, onDrop, onDragEnd, draggingAppointment, dragPreview, getAppointmentColor, isRecurringAppointment, isAppointmentReadOnly }) {
  const scrollContainerRef = useRef(null);
  const [appointmentsBelow, setAppointmentsBelow] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Each hour slot is 64px tall, 8 AM is the 8th slot (index 8)
      const scrollPosition = 8 * 64;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Get timed appointments for the current day (memoized)
  const dayAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.start_datetime);
      return isSameDay(aptDate, currentDate) && !apt.all_day;
    });
  }, [appointments, currentDate]);

  // Check if there are appointments below the visible area
  useEffect(() => {
    const checkAppointmentsBelow = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const visibleBottom = container.scrollTop + container.clientHeight;
      const totalHeight = container.scrollHeight;

      // Also check if we're not at the bottom of the scroll
      const notAtBottom = visibleBottom < totalHeight - 10;

      if (!notAtBottom) {
        setAppointmentsBelow([]);
        return;
      }

      // Get appointments that start below the visible area
      const below = dayAppointments.filter(apt => {
        const startDate = parseISO(apt.start_datetime);
        const startHour = getHours(startDate);
        const startMinute = getMinutes(startDate);
        const appointmentTop = startHour * 64 + (startMinute / 60) * 64;
        return appointmentTop > visibleBottom - 32; // 32px buffer
      });

      setAppointmentsBelow(below);
    };

    checkAppointmentsBelow();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkAppointmentsBelow);
      return () => container.removeEventListener('scroll', checkAppointmentsBelow);
    }
  }, [dayAppointments]);

  // Helper to format hour display
  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const allDayAppointments = appointments.filter(apt => {
    const aptDate = parseISO(apt.start_datetime);
    return isSameDay(aptDate, currentDate) && apt.all_day;
  });

  // Calculate layout for overlapping appointments
  const calculateAppointmentLayout = (dayAppointments) => {
    if (dayAppointments.length === 0) return [];

    const appointmentsWithLayout = dayAppointments.map(apt => {
      const startDate = parseISO(apt.start_datetime);
      const endDate = parseISO(apt.end_datetime);
      return {
        ...apt,
        startTime: getHours(startDate) * 60 + getMinutes(startDate),
        endTime: getHours(endDate) * 60 + getMinutes(endDate),
      };
    });

    // Sort by start time, then by duration (longer first)
    appointmentsWithLayout.sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime - b.startTime;
      return (b.endTime - b.startTime) - (a.endTime - a.startTime);
    });

    // Track which columns are occupied at each time
    const columns = [];

    appointmentsWithLayout.forEach(apt => {
      // Find the first available column for this appointment
      let column = 0;
      let placed = false;

      while (!placed) {
        // Check if this column is free for the entire duration of the appointment
        if (!columns[column]) {
          columns[column] = [];
        }

        const isFree = columns[column].every(existing => {
          // Check if there's no overlap
          return apt.startTime >= existing.endTime || apt.endTime <= existing.startTime;
        });

        if (isFree) {
          // Place the appointment in this column
          apt.column = column;
          columns[column].push(apt);
          placed = true;
        } else {
          column++;
        }
      }
    });

    // Calculate total columns for each appointment based on what overlaps with it
    appointmentsWithLayout.forEach(apt => {
      let maxConcurrent = 0;

      // Find all appointments that overlap with this one
      appointmentsWithLayout.forEach(other => {
        if (apt.startTime < other.endTime && apt.endTime > other.startTime) {
          maxConcurrent = Math.max(maxConcurrent, other.column + 1);
        }
      });

      apt.totalColumns = maxConcurrent;
    });

    return appointmentsWithLayout;
  };

  const appointmentsWithLayout = calculateAppointmentLayout(dayAppointments);

  return (
    <div className="flex flex-col h-full relative">
      {/* Day Header - Fixed */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <div className="w-24 flex-shrink-0 border-r border-gray-200"></div>
        <div className="flex-1 min-h-16 flex flex-col items-center justify-start bg-purple-100 py-2">
          <span className="text-lg font-semibold text-purple-600">
            {format(currentDate, 'EEEE, MMMM d')}
          </span>

          {/* All-day appointments */}
          {allDayAppointments.length > 0 && (
            <div className="w-full px-4 mt-2 space-y-1">
              {allDayAppointments.map((apt) => {
                const color = getAppointmentColor(apt);
                const isRecurring = isRecurringAppointment(appointments, apt.id);
                const isReadOnly = isAppointmentReadOnly(apt);
                return (
                  <div
                    key={getAppointmentKey(apt)}
                    onClick={() => onAppointmentClick(apt)}
                    className={`text-white text-sm px-2 py-1 rounded ${
                      isReadOnly
                        ? 'cursor-default'
                        : 'cursor-pointer hover:brightness-110'
                    }`}
                    style={{ backgroundColor: color, opacity: isReadOnly ? 0.5 : 0.9 }}
                    title={isReadOnly ? 'Read-only (imported from secondary calendar)' : (apt.contact ? `Contact: ${apt.contact.name}` : '')}
                  >
                    <div className="flex items-center gap-1 font-medium">
                      {isReadOnly && <LockClosedIcon className="w-4 h-4 flex-shrink-0" />}
                      {isRecurring && <ArrowPathIcon className="w-4 h-4 flex-shrink-0" />}
                      <span>{apt.title}</span>
                      {apt.status && apt.status !== 'scheduled' && (
                        <span
                          className="text-[10px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                          style={{ color: getStatusColor(apt.status) }}
                          title={getStatusLabel(apt.status)}
                        >
                          {getStatusLabel(apt.status)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="flex">
          {/* Time Column */}
          <div className="w-24 flex-shrink-0 border-r border-gray-200">
            {timeSlots.map((hour) => (
              <div key={hour} className="h-16 border-b border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-500">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          {/* Day Column */}
          <div
            className="flex-1 relative"
            onDragOver={(e) => onDragOver(currentDate, e, timeSlots)}
            onDrop={(e) => onDrop(currentDate, e, timeSlots)}
          >
            {timeSlots.map((hour, index) => (
              <div
                key={index}
                onClick={() => onNewAppointment(currentDate, { hour, minute: 0 })}
                className="h-16 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
              ></div>
            ))}

            {/* Appointments */}
            {appointmentsWithLayout.map((appointment) => {
              const startDate = parseISO(appointment.start_datetime);
              const endDate = parseISO(appointment.end_datetime);
              const startHour = getHours(startDate);
              const startMinute = getMinutes(startDate);
              const endHour = getHours(endDate);
              const endMinute = getMinutes(endDate);
              const duration = (endHour - startHour) + (endMinute - startMinute) / 60;
              const startIndex = timeSlots.findIndex(t => t === startHour);

              if (startIndex === -1) return null;

              const color = getAppointmentColor(appointment);
              const isRecurring = isRecurringAppointment(appointments, appointment.id);
              const isReadOnly = isAppointmentReadOnly(appointment);

              // Calculate width and left position based on column layout
              const widthPercent = 100 / appointment.totalColumns;
              const leftPercent = (appointment.column * widthPercent);

              const isDragging = draggingAppointment?.id === appointment.id;

              return (
                <div
                  key={getAppointmentKey(appointment)}
                  draggable={!isReadOnly}
                  onDragStart={isReadOnly ? undefined : (e) => onDragStart(appointment, e)}
                  onDragEnd={isReadOnly ? undefined : onDragEnd}
                  onClick={() => !isDragging && onAppointmentClick(appointment)}
                  className={`absolute rounded-lg px-2 py-1.5 shadow-md transition-all z-10 cursor-pointer ${
                    isReadOnly
                      ? ''
                      : 'cursor-move hover:brightness-110'
                  } ${isDragging ? 'opacity-40' : ''}`}
                  style={{
                    backgroundColor: color,
                    opacity: isReadOnly ? 0.5 : (isDragging ? 0.4 : 0.9),
                    top: `${startIndex * 64 + (startMinute / 60) * 64}px`,
                    height: `${duration * 64 - 4}px`,
                    minHeight: '60px',
                    left: `calc(${leftPercent}% + 8px)`,
                    width: `calc(${widthPercent}% - 16px)`,
                  }}
                  title={isReadOnly ? 'Read-only (imported from secondary calendar)' : (appointment.contact ? `Contact: ${appointment.contact.name}` : '')}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {isReadOnly && <LockClosedIcon className="w-4 h-4 text-white flex-shrink-0" />}
                    {isRecurring && <ArrowPathIcon className="w-4 h-4 text-white flex-shrink-0" />}
                    <p className="text-white text-xs font-normal truncate">{appointment.title}</p>
                    {appointment.status && appointment.status !== 'scheduled' && (
                      <span
                        className="text-[9px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                        style={{ color: getStatusColor(appointment.status) }}
                        title={getStatusLabel(appointment.status)}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-[11px] font-light opacity-90">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </p>
                  {appointment.location && (
                    <p className="text-white text-xs opacity-80 mt-1">📍 {appointment.location}</p>
                  )}
                </div>
              );
            })}

            {/* Drag Preview */}
            {dragPreview && draggingAppointment && isSameDay(currentDate, dragPreview.start) && (
              (() => {
                const previewStartHour = getHours(dragPreview.start);
                const previewStartMinute = getMinutes(dragPreview.start);
                const previewEndHour = getHours(dragPreview.end);
                const previewEndMinute = getMinutes(dragPreview.end);
                const previewDuration = (previewEndHour - previewStartHour) + (previewEndMinute - previewStartMinute) / 60;
                const previewStartIndex = timeSlots.findIndex(t => t === previewStartHour);

                if (previewStartIndex === -1) return null;

                const color = getAppointmentColor(draggingAppointment);

                return (
                  <div
                    className="absolute border-2 border-dashed rounded-lg p-3 pointer-events-none z-20"
                    style={{
                      backgroundColor: color,
                      opacity: 0.4,
                      borderColor: color,
                      top: `${previewStartIndex * 64 + (previewStartMinute / 60) * 64}px`,
                      height: `${previewDuration * 64 - 4}px`,
                      minHeight: '60px',
                      left: '8px',
                      right: '8px',
                    }}
                  >
                    <p className="text-white text-sm font-medium mb-1">{draggingAppointment.title}</p>
                    <p className="text-white text-xs opacity-90">
                      {format(dragPreview.start, 'h:mm a')} - {format(dragPreview.end, 'h:mm a')}
                    </p>
                    {draggingAppointment.location && (
                      <p className="text-white text-xs opacity-80 mt-1">📍 {draggingAppointment.location}</p>
                    )}
                  </div>
                );
              })()
            )}

            {/* Current Time Indicator - only show if viewing today */}
            {isSameDay(currentDate, new Date()) && (() => {
              const currentHour = getHours(currentTime);
              const currentMinute = getMinutes(currentTime);
              const timePosition = currentHour * 64 + (currentMinute / 60) * 64;
              return (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  style={{ top: `${timePosition}px` }}
                >
                  <div className="w-2 h-2 rounded-full bg-purple-600 -ml-1"></div>
                  <div className="flex-1 h-0.5 bg-purple-600"></div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Scroll indicator for appointments below - colored bars */}
      {appointmentsBelow.length > 0 && (
        <div className="absolute bottom-0 left-24 right-0 h-2 flex pointer-events-none z-30">
          {[...new Set(appointmentsBelow.map(apt => getAppointmentColor(apt)))].map((color, index) => (
            <div
              key={index}
              className="flex-1 h-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========== Mini Calendar Component ==========
function MiniCalendar({ currentDate, onDateSelect, appointments }) {
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const monthStart = startOfMonth(miniCalendarDate);
  const monthEnd = endOfMonth(miniCalendarDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const hasAppointments = (day) => {
    return appointments.some(apt => isSameDay(parseISO(apt.start_datetime), day));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{format(miniCalendarDate, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setMiniCalendarDate(addMonths(miniCalendarDate, -1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMiniCalendarDate(addMonths(miniCalendarDate, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, miniCalendarDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, currentDate);
          const hasApts = hasAppointments(day);

          return (
            <button
              key={index}
              onClick={() => {
                onDateSelect(day);
                setMiniCalendarDate(day);
              }}
              className={`relative text-center text-sm py-1.5 rounded cursor-pointer ${
                isSelected
                  ? 'bg-purple-600 text-white font-semibold'
                  : isToday
                  ? 'bg-purple-100 text-purple-600 font-semibold'
                  : isCurrentMonth
                  ? 'text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400'
              }`}
            >
              {format(day, 'd')}
              {hasApts && !isSelected && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ========== Google Calendar Connector Component (Multi-Account) ==========
function GoogleCalendarConnector({ isConnected, accounts, primaryAccount, onAddAccount, onSetPrimary, onDisconnect, onRename, onColorChange, onToggleReadOnly, onSync }) {
  const [syncingAccountId, setSyncingAccountId] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editName, setEditName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null); // { type: 'setPrimary' | 'disconnect', account }
  const [openMenuId, setOpenMenuId] = useState(null); // For 3-dot menu

  // Default color for accounts
  const DEFAULT_ACCOUNT_COLOR = '#3b82f6';

  const handleSync = async (accountId) => {
    setSyncingAccountId(accountId);
    setSyncResult(null);
    try {
      const result = await onSync(accountId);
      if (result.success) {
        setSyncResult({
          accountId,
          success: true,
          message: `Synced! Created: ${result.created}, Updated: ${result.updated}, Deleted: ${result.deleted}`
        });
        setTimeout(() => setSyncResult(null), 5000);
      } else {
        setSyncResult({ accountId, success: false, message: result.error });
      }
    } catch (error) {
      setSyncResult({ accountId, success: false, message: 'Sync failed' });
    } finally {
      setSyncingAccountId(null);
    }
  };

  const handleSetPrimary = async (account) => {
    setConfirmDialog(null);
    await onSetPrimary(account.id);
  };

  const handleDisconnect = async (account) => {
    setConfirmDialog(null);
    await onDisconnect(account.id);
  };

  const handleStartRename = (account) => {
    setEditingAccountId(account.id);
    setEditName(account.name || '');
  };

  const handleSaveRename = async (accountId) => {
    if (editName.trim()) {
      await onRename(accountId, editName.trim());
    }
    setEditingAccountId(null);
    setEditName('');
  };

  const handleCancelRename = () => {
    setEditingAccountId(null);
    setEditName('');
  };

  const handleAddAccount = (setAsPrimary) => {
    setShowAddModal(false);
    onAddAccount(setAsPrimary);
  };

  const formatLastSync = (lastSyncAt) => {
    if (!lastSyncAt) return null;
    try {
      return format(parseISO(lastSyncAt), 'MMM d, h:mm a');
    } catch {
      return null;
    }
  };

  // Google icon SVG
  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Google Calendar Accounts</h3>
      <p className="text-sm text-gray-500 mb-4">
        Connect your Google Calendar accounts. Primary account syncs bidirectionally, secondary accounts import events only.
      </p>

      {isConnected && accounts.length > 0 ? (
        <div className="space-y-2">
          {/* Account List */}
          {accounts.map((account) => (
            <div
              key={account.id}
              className="border border-gray-200 rounded-lg px-3 py-2"
            >
              {/* Account Row */}
              <div className="flex items-center gap-3">
                {/* Color Picker */}
                <input
                  type="color"
                  value={account.color || DEFAULT_ACCOUNT_COLOR}
                  onChange={(e) => onColorChange(account.id, e.target.value)}
                  className={`w-6 h-6 rounded border border-gray-300 cursor-pointer flex-shrink-0 ${account.is_read_only ? 'opacity-50' : ''}`}
                  title="Choose calendar color"
                />

                {/* Account Name/Email */}
                <div className="min-w-0 flex-1">
                  {editingAccountId === account.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
                        placeholder="Account name"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(account.id);
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                      />
                      <button
                        onClick={() => handleSaveRename(account.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {account.name || account.email}
                    </p>
                  )}
                </div>

                {/* Syncing indicator */}
                {syncingAccountId === account.id && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 flex-shrink-0"></div>
                )}

                {/* 3-dot Menu */}
                {editingAccountId !== account.id && (
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuId === account.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleSync(account.id);
                            }}
                            disabled={syncingAccountId === account.id}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Sync Now
                          </button>
                          {!account.is_primary && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setConfirmDialog({ type: 'setPrimary', account });
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                              </svg>
                              Set Primary
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              handleStartRename(account);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Rename
                          </button>
                          {!account.is_primary && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                onToggleReadOnly(account.id, !account.is_read_only);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              {account.is_read_only ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                              {account.is_read_only ? 'Enable Editing' : 'Read Only'}
                            </button>
                          )}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              setConfirmDialog({ type: 'disconnect', account });
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Disconnect
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Second Row - Star and Last Sync Time */}
              {editingAccountId !== account.id && (
                <div className="flex items-center gap-1.5 mt-1 ml-9">
                  <svg
                    className={`w-3.5 h-3.5 flex-shrink-0 ${account.is_primary ? 'text-purple-600' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    title={account.is_primary ? 'Primary account' : 'Import only'}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  {account.last_sync_at && (
                    <span className="text-xs text-gray-400">
                      Last Sync: {formatLastSync(account.last_sync_at)}
                    </span>
                  )}
                </div>
              )}

              {/* Sync Result Message */}
              {syncResult && syncResult.accountId === account.id && (
                <div className={`mt-2 p-2 rounded text-xs ${
                  syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {syncResult.message}
                </div>
              )}
            </div>
          ))}

          {/* Add Another Account Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-lg py-3 px-4 flex items-center justify-center gap-2 text-gray-500 hover:text-purple-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Another Account
          </button>
        </div>
      ) : (
        /* No accounts connected - show connect button */
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          Connect Google Calendar
        </button>
      )}

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Google Calendar</h3>
            <p className="text-sm text-gray-500 mb-4">
              Choose how to connect this account:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleAddAccount(true)}
                className="w-full text-left p-3 border-2 border-purple-200 hover:border-purple-400 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  </span>
                  <span className="font-medium text-gray-900">Add as Primary</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Bidirectional sync - Zenible appointments sync to this calendar
                </p>
              </button>

              <button
                onClick={() => handleAddAccount(false)}
                className="w-full text-left p-3 border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </span>
                  <span className="font-medium text-gray-900">Add as Secondary</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Import only - View calendar events in Zenible (read-only)
                </p>
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(false)}
              className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            {confirmDialog.type === 'setPrimary' ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Primary Account?</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {primaryAccount && (
                    <>Current primary: <span className="font-medium">{primaryAccount.email}</span><br /></>
                  )}
                  New primary: <span className="font-medium">{confirmDialog.account.email}</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Your Zenible appointments will now sync to {confirmDialog.account.email} instead.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSetPrimary(confirmDialog.account)}
                    className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    Change Primary
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Disconnect {confirmDialog.account.is_primary ? 'Primary ' : ''}Account?
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  You're about to disconnect <span className="font-medium">{confirmDialog.account.email}</span>.
                </p>
                {confirmDialog.account.is_primary && accounts.length > 1 && (
                  <p className="text-sm text-gray-500 mb-4">
                    {accounts.find(a => a.id !== confirmDialog.account.id)?.email} will become your new primary account.
                  </p>
                )}
                {accounts.length === 1 && (
                  <p className="text-sm text-gray-500 mb-4">
                    This is your only connected account. You will be disconnected from Google Calendar.
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDisconnect(confirmDialog.account)}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Upcoming Schedule Component ==========
function UpcomingSchedule({ appointments, onAppointmentClick }) {
  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.start_datetime) >= new Date())
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
    .slice(0, 20);

  const formatDateLabel = (date) => {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    if (isSameDay(date, today)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isSameDay(date, tomorrow)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex-1 overflow-hidden flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Schedule</h3>

      <div className="space-y-3 overflow-y-auto flex-1 scrollbar-hide">
        {upcomingAppointments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No upcoming appointments</p>
        ) : (
          upcomingAppointments.map((appointment) => {
            const startDate = parseISO(appointment.start_datetime);
            return (
              <button
                key={getAppointmentKey(appointment)}
                onClick={() => onAppointmentClick(appointment)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-900 truncate">{appointment.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateLabel(startDate)}
                </p>
                {appointment.location && (
                  <p className="text-xs text-gray-400 mt-1 truncate">📍 {appointment.location}</p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
