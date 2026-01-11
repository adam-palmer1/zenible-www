import React, { useState, useEffect, useRef, useMemo } from 'react';
import NewSidebar from '../sidebar/NewSidebar';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, Cog6ToothIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCalendar } from '../../hooks/useCalendar';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useCRMReferenceData } from '../../contexts/CRMReferenceDataContext';
import AppointmentModal from './AppointmentModal';
import RecurringScopeDialog from './RecurringScopeDialog';
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

  const {
    appointments,
    loading,
    error,
    googleConnected,
    googleCalendarId,
    lastSync,
    fetchAppointmentsForDateRange,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    syncGoogleCalendar,
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

  // Get color for appointment type (3-tier priority: user > backend > fallback)
  const getAppointmentColor = (appointmentType) => {
    // 1. Check user preference first
    if (typeColors[appointmentType]) {
      return typeColors[appointmentType];
    }

    // 2. Check backend default
    const typeObj = appointmentTypes.find(t => t.value === appointmentType);
    if (typeObj?.color || typeObj?.default_color) {
      return typeObj.color || typeObj.default_color;
    }

    // 3. Hardcoded fallback
    return '#3b82f6';
  };

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
      // Simple confirm for non-recurring appointments
      if (window.confirm('Are you sure you want to delete this appointment?')) {
        await deleteAppointment(appointment.id);
        setShowAppointmentModal(false);
        setSelectedAppointment(null);
      }
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
                <h2 className="text-xl font-semibold text-gray-900">
                  {viewMode === 'daily' && format(currentDate, 'MMM d, yyyy')}
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
              />}
              {viewMode === 'monthly' && <MonthView
                currentDate={currentDate}
                appointments={filteredAppointments}
                onAppointmentClick={handleAppointmentClick}
                onNewAppointment={handleNewAppointment}
                getAppointmentColor={getAppointmentColor}
                isRecurringAppointment={isRecurringAppointment}
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
                  calendarId={googleCalendarId}
                  lastSync={lastSync}
                  onConnect={connectGoogleCalendar}
                  onDisconnect={disconnectGoogleCalendar}
                  onSync={syncGoogleCalendar}
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
function WeekView({ currentDate, appointments, timeSlots, onAppointmentClick, onNewAppointment, onDragStart, onDragOver, onDrop, onDragEnd, draggingAppointment, dragPreview, getAppointmentColor, isRecurringAppointment }) {
  const scrollContainerRef = useRef(null);

  // Generate current week only (Mon-Sun)
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = [];
  for (let d = 0; d < 7; d++) {
    days.push(addDays(currentWeekStart, d));
  }

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollPosition = 8 * 64;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

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
    <div className="flex flex-col h-full">
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
                          const color = getAppointmentColor(apt.appointment_type || 'manual');
                          const isRecurring = isRecurringAppointment(appointments, apt.id);
                          return (
                            <div
                              key={getAppointmentKey(apt)}
                              onClick={() => onAppointmentClick(apt)}
                              className="bg-opacity-90 text-white text-xs px-1 py-0.5 rounded cursor-pointer hover:bg-opacity-100 truncate flex items-center gap-0.5"
                              style={{ backgroundColor: color }}
                            >
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
          <div className="flex-1 flex">
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

                      const color = getAppointmentColor(appointment.appointment_type || 'manual');
                      const isRecurring = isRecurringAppointment(appointments, appointment.id);

                      // Calculate width and left position based on column layout
                      const widthPercent = 100 / appointment.totalColumns;
                      const leftPercent = (appointment.column * widthPercent);

                      const isDragging = draggingAppointment?.id === appointment.id;

                      return (
                        <div
                          key={getAppointmentKey(appointment)}
                          draggable
                          onDragStart={(e) => onDragStart(appointment, e)}
                          onDragEnd={onDragEnd}
                          onClick={() => !isDragging && onAppointmentClick(appointment)}
                          className={`absolute ${isDragging ? 'opacity-40' : ''} rounded-lg p-2 shadow-sm cursor-move hover:brightness-110 transition-all z-10`}
                          style={{
                            backgroundColor: color,
                            opacity: isDragging ? 0.4 : 0.9,
                            top: `${startIndex * 64 + (startMinute / 60) * 64}px`,
                            height: `${duration * 64 - 4}px`,
                            minHeight: '30px',
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                          }}
                          title={appointment.contact ? `Contact: ${appointment.contact.name}` : ''}
                        >
                          <div className="flex items-center gap-1">
                            {isRecurring && <ArrowPathIcon className="w-3 h-3 text-white flex-shrink-0" />}
                            <p className="text-white text-xs font-medium truncate">{appointment.title}</p>
                            {appointment.status && appointment.status !== 'scheduled' && (
                              <span
                                className="text-[10px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                                style={{ color: getStatusColor(appointment.status) }}
                                title={getStatusLabel(appointment.status)}
                              >
                                {getStatusLabel(appointment.status)}
                              </span>
                            )}
                          </div>
                          <p className="text-white text-xs opacity-90">
                            {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                          </p>
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

                        const color = getAppointmentColor(draggingAppointment.appointment_type || 'manual');

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
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== Month View Component ==========
function MonthView({ currentDate, appointments, onAppointmentClick, onNewAppointment, getAppointmentColor, isRecurringAppointment }) {
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
      <div className="flex-1 overflow-y-auto scrollbar-hover">
        <div className="grid grid-cols-7 h-full" style={{ gridTemplateRows: 'repeat(auto-fit, minmax(0, 1fr))' }}>
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={index}
              onClick={() => onNewAppointment(day)}
              className={`border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${isToday ? 'bg-purple-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                !isCurrentMonth ? 'text-gray-400' : isToday ? 'text-purple-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => {
                  const color = getAppointmentColor(apt.appointment_type || 'manual');
                  const isRecurring = isRecurringAppointment(appointments, apt.id);

                  return (
                    <div
                      key={getAppointmentKey(apt)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(apt);
                      }}
                      className="text-xs text-white px-1 py-0.5 rounded cursor-pointer hover:brightness-110"
                      style={{ backgroundColor: color }}
                      title={apt.contact ? `Contact: ${apt.contact.name}` : ''}
                    >
                      <div className="flex items-center gap-1 truncate">
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
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500">+{dayAppointments.length - 3} more</div>
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
function DayView({ currentDate, appointments, timeSlots, onAppointmentClick, onNewAppointment, onDragStart, onDragOver, onDrop, onDragEnd, draggingAppointment, dragPreview, getAppointmentColor, isRecurringAppointment }) {
  const scrollContainerRef = useRef(null);

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Each hour slot is 64px tall, 8 AM is the 8th slot (index 8)
      const scrollPosition = 8 * 64;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Helper to format hour display
  const formatHour = (hour) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour > 12) return `${hour - 12} PM`;
    return `${hour} AM`;
  };

  const dayAppointments = appointments.filter(apt => {
    const aptDate = parseISO(apt.start_datetime);
    return isSameDay(aptDate, currentDate) && !apt.all_day;
  });

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
    <div className="flex flex-col h-full">
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
                const color = getAppointmentColor(apt.appointment_type || 'manual');
                const isRecurring = isRecurringAppointment(appointments, apt.id);
                return (
                  <div
                    key={getAppointmentKey(apt)}
                    onClick={() => onAppointmentClick(apt)}
                    className="text-white text-sm px-2 py-1 rounded cursor-pointer hover:brightness-110"
                    style={{ backgroundColor: color, opacity: 0.9 }}
                    title={apt.contact ? `Contact: ${apt.contact.name}` : ''}
                  >
                    <div className="flex items-center gap-1 font-medium">
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

              const color = getAppointmentColor(appointment.appointment_type || 'manual');
              const isRecurring = isRecurringAppointment(appointments, appointment.id);

              // Calculate width and left position based on column layout
              const widthPercent = 100 / appointment.totalColumns;
              const leftPercent = (appointment.column * widthPercent);

              const isDragging = draggingAppointment?.id === appointment.id;

              return (
                <div
                  key={getAppointmentKey(appointment)}
                  draggable
                  onDragStart={(e) => onDragStart(appointment, e)}
                  onDragEnd={onDragEnd}
                  onClick={() => !isDragging && onAppointmentClick(appointment)}
                  className={`absolute ${isDragging ? 'opacity-40' : ''} rounded-lg p-3 shadow-md cursor-move hover:brightness-110 transition-all z-10`}
                  style={{
                    backgroundColor: color,
                    opacity: isDragging ? 0.4 : 0.9,
                    top: `${startIndex * 64 + (startMinute / 60) * 64}px`,
                    height: `${duration * 64 - 4}px`,
                    minHeight: '60px',
                    left: `calc(${leftPercent}% + 8px)`,
                    width: `calc(${widthPercent}% - 16px)`,
                  }}
                  title={appointment.contact ? `Contact: ${appointment.contact.name}` : ''}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {isRecurring && <ArrowPathIcon className="w-4 h-4 text-white flex-shrink-0" />}
                    <p className="text-white text-sm font-medium truncate">{appointment.title}</p>
                    {appointment.status && appointment.status !== 'scheduled' && (
                      <span
                        className="text-[10px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                        style={{ color: getStatusColor(appointment.status) }}
                        title={getStatusLabel(appointment.status)}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-xs opacity-90">
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

                const color = getAppointmentColor(draggingAppointment.appointment_type || 'manual');

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
          </div>
        </div>
      </div>
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

// ========== Google Calendar Connector Component ==========
function GoogleCalendarConnector({ isConnected, calendarId, lastSync, onConnect, onDisconnect, onSync }) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await onSync();
      if (result.success) {
        setSyncResult({
          success: true,
          message: `Synced! Created: ${result.created}, Updated: ${result.updated}, Deleted: ${result.deleted}`
        });
        setTimeout(() => setSyncResult(null), 5000);
      } else {
        setSyncResult({ success: false, message: result.error });
      }
    } catch (error) {
      setSyncResult({ success: false, message: 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Calendar?')) {
      await onDisconnect();
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Google Calendar Integration</h3>

      {isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Connected to Google Calendar
          </div>
          {calendarId && (
            <p className="text-xs text-gray-500">{calendarId}</p>
          )}
          {lastSync && (
            <p className="text-xs text-gray-400">
              Last synced: {format(parseISO(lastSync), 'MMM d, h:mm a')}
            </p>
          )}

          {/* Sync Result Message */}
          {syncResult && (
            <div className={`p-2 rounded text-xs ${
              syncResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {syncResult.message}
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg py-2 px-4 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              </>
            )}
          </button>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-2 px-4 text-sm font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google Calendar
        </button>
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
