import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CalendarIcon, PhoneIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Z_INDEX } from '../../constants/crm';
import { getContactDisplayName } from '../../utils/crm/contactUtils';
import { getScheduledAppointments, getNextHour } from '../../utils/crm/appointmentUtils';
import { useContactActions } from '../../contexts/ContactActionsContext';
import appointmentsAPI from '../../services/api/crm/appointments';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../common/ConfirmationModal';
import DatePickerCalendar from '../shared/DatePickerCalendar';
import TimePickerInput from '../shared/TimePickerInput';

interface AppointmentItem {
  id: string;
  start_datetime?: string | null;
  appointment_type?: string;
  deleted_at?: string | null;
  [key: string]: unknown;
}

interface AppointmentsContact {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  is_hidden_crm?: boolean;
  is_hidden_client?: boolean;
  is_hidden_vendor?: boolean;
  is_client?: boolean;
  [key: string]: unknown;
}

interface AppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: AppointmentsContact;
}

/**
 * AppointmentsModal - Manage multiple appointments for a contact
 * Allows viewing, creating, editing, and cancelling appointments
 */
const AppointmentsModal: React.FC<AppointmentsModalProps> = ({ isOpen, onClose, contact }) => {
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingAppointment, setEditingAppointment] = useState<AppointmentItem | null>(null);
  const [appointmentType, setAppointmentType] = useState('call');
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState(getNextHour());
  const { setFollowUp, refreshContacts } = useContactActions();
  const { showSuccess, showError } = useNotification();
  const [cancelConfirmModal, setCancelConfirmModal] = useState<{ isOpen: boolean; appointment: AppointmentItem | null }>({ isOpen: false, appointment: null });
  const [fetchedAppointments, setFetchedAppointments] = useState<AppointmentItem[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const displayName = getContactDisplayName(contact);
  const scheduledAppointments = getScheduledAppointments(fetchedAppointments) as AppointmentItem[];

  // Fetch appointments from API when modal opens
  const fetchAppointments = async () => {
    if (!contact?.id) return;
    try {
      setLoadingAppointments(true);
      const data = await appointmentsAPI.list({ contact_id: contact.id }) as { items?: AppointmentItem[] } | AppointmentItem[];
      const items = Array.isArray(data) ? data : (data.items || []);
      setFetchedAppointments(items);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setFetchedAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Reset to list mode and fetch appointments when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('list');
      setEditingAppointment(null);
      fetchAppointments();
    } else {
      setFetchedAppointments([]);
    }
  }, [isOpen]);

  // Initialize form when creating new appointment
  const handleCreateNew = () => {
    setMode('create');
    setEditingAppointment(null);
    setAppointmentDate(new Date().toISOString().split('T')[0]);
    setAppointmentTime(getNextHour());
    setAppointmentType('call');
  };

  // Initialize form when editing appointment
  const handleEdit = (appointment: AppointmentItem) => {
    setMode('edit');
    setEditingAppointment(appointment);

    // Parse datetime
    if (appointment.start_datetime) {
      const dateStr = appointment.start_datetime;
      if (dateStr.includes('T')) {
        const [datePart, timePart] = dateStr.split('T');
        setAppointmentDate(datePart);
        if (timePart) {
          const timeOnly = timePart.split(':').slice(0, 2).join(':');
          setAppointmentTime(timeOnly);
        }
      } else {
        setAppointmentDate(dateStr);
        setAppointmentTime(getNextHour());
      }
    }
    setAppointmentType(appointment.appointment_type || 'call');
  };

  // Handle creating new appointment
  const handleSaveNew = async () => {
    const dateTimeValue = `${appointmentDate}T${appointmentTime}:00`;
    await setFollowUp(contact, dateTimeValue, appointmentType);
    await fetchAppointments();
    setMode('list');
  };

  // Handle updating existing appointment
  const handleSaveEdit = async () => {
    if (!editingAppointment) return;

    try {
      const dateTimeValue = `${appointmentDate}T${appointmentTime}:00`;

      // Calculate end_datetime (1 hour later)
      const startDate = new Date(dateTimeValue);
      const endDate = new Date(startDate.getTime() + 60 * 60000);
      const endDateTime = endDate.toISOString().slice(0, 19);

      await appointmentsAPI.update(editingAppointment.id, {
        start_datetime: dateTimeValue,
        end_datetime: endDateTime,
        appointment_type: appointmentType
      });

      showSuccess('Appointment updated successfully');

      // Refresh appointments list and contacts
      await fetchAppointments();
      if (refreshContacts) {
        refreshContacts();
      }

      setMode('list');
    } catch (error: any) {
      console.error('Failed to update appointment:', error);
      showError(error.message || 'Failed to update appointment');
    }
  };

  // Handle cancelling appointment
  const handleCancel = (appointment: AppointmentItem) => {
    setCancelConfirmModal({ isOpen: true, appointment });
  };

  const confirmCancelAppointment = async () => {
    const appointment = cancelConfirmModal.appointment;
    if (!appointment) return;

    try {
      await appointmentsAPI.delete(appointment.id);

      showSuccess('Appointment cancelled successfully');
      setCancelConfirmModal({ isOpen: false, appointment: null });

      // Refresh appointments list and contacts
      await fetchAppointments();
      if (refreshContacts) {
        refreshContacts();
      }
    } catch (error: any) {
      console.error('Failed to cancel appointment:', error);
      showError(error.message || 'Failed to cancel appointment');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6" style={{ zIndex: Z_INDEX.MODAL }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {mode === 'list' ? 'Appointments' : mode === 'create' ? 'Schedule New Appointment' : 'Edit Appointment'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {displayName}
        </p>

        {/* List Mode */}
        {mode === 'list' && (
          <div className="space-y-4">
            {/* Existing Appointments */}
            {scheduledAppointments.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scheduled Appointments ({scheduledAppointments.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {scheduledAppointments.map((appointment) => {
                    const isCall = appointment.appointment_type === 'call';
                    const date = new Date(appointment.start_datetime ?? '');

                    return (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {isCall ? (
                            <PhoneIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          )}
                          <div className="flex-1">
                            <div className={`font-medium ${isCall ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'}`}>
                              {isCall ? 'Call' : 'Follow-up'}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {' at '}
                              {date.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(appointment)}
                            className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                            title="Edit appointment"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(appointment)}
                            className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                            title="Cancel appointment"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No scheduled appointments
              </div>
            )}

            {/* Add New Button */}
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Schedule New Appointment
            </button>
          </div>
        )}

        {/* Create/Edit Mode */}
        {(mode === 'create' || mode === 'edit') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'call', label: 'Call', icon: <PhoneIcon className="h-5 w-5" /> },
                  { value: 'follow_up', label: 'Follow Up', icon: <CalendarIcon className="h-5 w-5" /> },
                ] as const).map((option) => {
                  const isSelected = appointmentType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAppointmentType(option.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-zenible-primary bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <span className={isSelected ? 'text-zenible-primary' : 'text-gray-500 dark:text-gray-400'}>
                        {option.icon}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <DatePickerCalendar
                value={appointmentDate}
                onChange={(date) => setAppointmentDate(date)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time
              </label>
              <TimePickerInput
                value={appointmentTime}
                onChange={(time) => setAppointmentTime(time)}
              />
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setMode('list')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={mode === 'create' ? handleSaveNew : handleSaveEdit}
                disabled={!appointmentDate || !appointmentTime}
                className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mode === 'create' ? 'Schedule' : 'Update'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={cancelConfirmModal.isOpen}
        onClose={() => setCancelConfirmModal({ isOpen: false, appointment: null })}
        onConfirm={confirmCancelAppointment}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        confirmText="Cancel Appointment"
        cancelText="Keep"
        confirmColor="red"
      />
    </div>,
    document.body
  );
};

export default AppointmentsModal;
