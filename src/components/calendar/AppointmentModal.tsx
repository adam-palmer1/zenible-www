import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ContactSelectorModal from './ContactSelectorModal';
import DatePickerCalendar from '../shared/DatePickerCalendar';
import TimePickerInput from '../shared/TimePickerInput';
import Combobox from '../ui/combobox/Combobox';
import contactsAPI from '../../services/api/crm/contacts';
import appointmentsAPI from '../../services/api/crm/appointments';
import { useCRMReferenceData } from '../../contexts/CRMReferenceDataContext';
import type { AppointmentResponse, ContactResponse } from '../../types';
import type { EnumItem } from '../../contexts/CRMReferenceDataContext';

/** Extended appointment data that may include a nested recurrence config from the API. */
interface AppointmentWithRecurrence extends AppointmentResponse {
  recurrence?: {
    recurring_type?: string | null;
    recurring_interval?: number | null;
    recurring_count?: number | null;
    recurring_until?: string | null;
    recurring_weekdays?: string[];
    recurring_monthly_type?: string | null;
    recurring_monthly_day?: number | null;
    recurring_monthly_week?: number | null;
    recurring_monthly_weekday?: string | null;
  } | null;
}

/** Data shape for saving (creating/updating) an appointment. */
interface AppointmentSaveData extends Record<string, unknown> {
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string;
  contact_id: string | null;
  timezone: string;
  appointment_type: string;
  location: string | null;
  meeting_link: string | null;
  all_day: boolean;
  recurrence?: Record<string, unknown> | null;
}

/** Minimal appointment data needed to open the modal. Full data is fetched from the API. */
type AppointmentInput = {
  id: string;
  start_datetime: string;
  end_datetime: string;
} & Partial<AppointmentWithRecurrence>;

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AppointmentSaveData) => Promise<void>;
  onDelete?: (appointment: AppointmentInput) => void;
  appointment?: AppointmentInput | null;
  initialDate?: string | null;
  isReadOnly?: boolean;
}

/**
 * Modal for creating/editing appointments
 */
const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave, onDelete, appointment = null, initialDate = null, isReadOnly = false }) => {
  // Get enum metadata from context
  const {
    appointmentTypes,
    recurringTypes
  } = useCRMReferenceData();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    contact_id: null as string | null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    appointment_type: 'manual',
    location: '',
    meeting_link: '',
    all_day: false,
  });

  // Recurring appointment state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState('weekly');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringEndType, setRecurringEndType] = useState('count'); // 'count' or 'until'
  const [recurringCount, setRecurringCount] = useState(10);
  const [recurringUntil, setRecurringUntil] = useState('');
  const [recurringWeekdays, setRecurringWeekdays] = useState<string[]>(['MO']);
  const [recurringMonthlyType, setRecurringMonthlyType] = useState('day_of_month');
  const [recurringMonthlyDay, setRecurringMonthlyDay] = useState(1);
  const [recurringMonthlyWeek, setRecurringMonthlyWeek] = useState(1);
  const [recurringMonthlyWeekday, setRecurringMonthlyWeekday] = useState('MO');

  const [selectedContact, setSelectedContact] = useState<ContactResponse | null>(null);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const contactButtonRef = React.useRef<HTMLButtonElement>(null);

  // Initialize form data when editing
  useEffect(() => {
    const initializeForm = async () => {
      if (appointment) {
        // Fetch full appointment details to get recurrence config
        let fullAppointment = appointment;
        try {
          fullAppointment = await appointmentsAPI.get<AppointmentWithRecurrence>(appointment.id);
        } catch (error) {
          console.error('Failed to fetch full appointment details:', error);
          // Fall back to the passed appointment data
        }

        setFormData({
          title: fullAppointment.title || '',
          description: fullAppointment.description || '',
          start_datetime: formatDateTimeLocal(appointment.start_datetime), // Use passed datetime for recurring instances
          end_datetime: formatDateTimeLocal(appointment.end_datetime),
          contact_id: fullAppointment.contact_id || null,
          timezone: fullAppointment.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          appointment_type: fullAppointment.appointment_type || 'manual',
          location: fullAppointment.location || '',
          meeting_link: fullAppointment.meeting_link || '',
          all_day: fullAppointment.all_day || false,
        });

        // Initialize recurrence state from full appointment
        if (fullAppointment.recurrence || fullAppointment.recurring_type) {
          const rec = fullAppointment.recurrence || fullAppointment;
          setIsRecurring(true);
          setRecurringType(rec.recurring_type || 'weekly');
          setRecurringInterval(rec.recurring_interval || 1);

          if (rec.recurring_until) {
            setRecurringEndType('until');
            setRecurringUntil(rec.recurring_until.split('T')[0]);
          } else {
            setRecurringEndType('count');
            setRecurringCount(rec.recurring_count || 10);
          }

          if (rec.recurring_weekdays) {
            setRecurringWeekdays(rec.recurring_weekdays as string[]);
          }

          if (rec.recurring_monthly_type) {
            setRecurringMonthlyType(rec.recurring_monthly_type);
            setRecurringMonthlyDay(rec.recurring_monthly_day || 1);
            setRecurringMonthlyWeek(rec.recurring_monthly_week || 1);
            setRecurringMonthlyWeekday(rec.recurring_monthly_weekday || 'MO');
          }
        } else {
          // Reset recurring state for non-recurring appointments
          setIsRecurring(false);
          setRecurringType('weekly');
          setRecurringInterval(1);
          setRecurringEndType('count');
          setRecurringCount(10);
          setRecurringUntil('');
          setRecurringWeekdays(['MO']);
          setRecurringMonthlyType('day_of_month');
          setRecurringMonthlyDay(1);
          setRecurringMonthlyWeek(1);
          setRecurringMonthlyWeekday('MO');
        }

        // Fetch contact details if appointment has a contact_id
        if (fullAppointment.contact_id) {
          try {
            const contact = await contactsAPI.get(fullAppointment.contact_id);
            setSelectedContact(contact);
          } catch (error) {
            console.error('Failed to fetch contact:', error);
            setSelectedContact(null);
          }
        } else {
          setSelectedContact(null);
        }
      } else {
        // Reset form for new appointment
        let startDateTime = '';
        let endDateTime = '';

        // If initialDate is provided, use it to prefill start/end times
        if (initialDate) {
          const start = new Date(initialDate);
          const end = new Date(start.getTime() + 60 * 60 * 1000); // Default to 1 hour duration
          startDateTime = formatDateTimeLocal(start.toISOString());
          endDateTime = formatDateTimeLocal(end.toISOString());
        }

        setFormData({
          title: '',
          description: '',
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          contact_id: null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          appointment_type: 'manual',
          location: '',
          meeting_link: '',
          all_day: false,
        });
        setSelectedContact(null);

        // Reset recurring state for new appointments
        setIsRecurring(false);
        setRecurringType('weekly');
        setRecurringInterval(1);
        setRecurringEndType('count');
        setRecurringCount(10);
        setRecurringUntil('');
        setRecurringWeekdays(['MO']);
        setRecurringMonthlyType('day_of_month');
        setRecurringMonthlyDay(1);
        setRecurringMonthlyWeek(1);
        setRecurringMonthlyWeekday('MO');
      }
      setErrors({});
    };

    if (isOpen) {
      initializeForm();
    }
  }, [appointment, isOpen, initialDate]);

  // Convert ISO string to datetime-local format
  const formatDateTimeLocal = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Build recurrence config from form state
  const buildRecurrenceConfig = () => {
    if (!isRecurring) return null;

    const config: Record<string, unknown> = {
      recurring_type: recurringType,
      recurring_interval: recurringInterval,
    };

    // Set end condition
    if (recurringEndType === 'count') {
      config.recurring_count = recurringCount;
    } else {
      config.recurring_until = recurringUntil;
    }

    // Weekly pattern
    if (recurringType === 'weekly') {
      config.recurring_weekdays = recurringWeekdays;
    }

    // Monthly pattern
    if (recurringType === 'monthly') {
      config.recurring_monthly_type = recurringMonthlyType;
      if (recurringMonthlyType === 'day_of_month') {
        config.recurring_monthly_day = recurringMonthlyDay;
      } else {
        config.recurring_monthly_week = recurringMonthlyWeek;
        config.recurring_monthly_weekday = recurringMonthlyWeekday;
      }
    }

    return config;
  };

  // Validate form
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }

    if (!formData.start_datetime) {
      newErrors.start_datetime = 'Start time is required';
    }

    if (!formData.end_datetime) {
      newErrors.end_datetime = 'End time is required';
    }

    if (formData.start_datetime && formData.end_datetime) {
      const start = new Date(formData.start_datetime);
      const end = new Date(formData.end_datetime);
      if (end <= start) {
        newErrors.end_datetime = 'End time must be after start time';
      }
    }

    if (formData.meeting_link && formData.meeting_link.trim()) {
      try {
        new URL(formData.meeting_link);
      } catch {
        newErrors.meeting_link = 'Invalid URL format';
      }
    }

    // Validate recurring fields
    if (isRecurring) {
      if (recurringType === 'weekly' && recurringWeekdays.length === 0) {
        newErrors.recurring = 'Select at least one day for weekly recurrence';
      }
      if (recurringEndType === 'count' && recurringCount < 1) {
        newErrors.recurring = 'Count must be at least 1';
      }
      if (recurringEndType === 'until' && !recurringUntil) {
        newErrors.recurring = 'End date is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // Convert datetime-local to ISO 8601 format
      const submitData: AppointmentSaveData = {
        ...formData,
        start_datetime: new Date(formData.start_datetime).toISOString(),
        end_datetime: new Date(formData.end_datetime).toISOString(),
        description: formData.description,
        contact_id: formData.contact_id,
        location: formData.location,
        meeting_link: formData.meeting_link,
      };

      // Convert empty strings to null for optional fields
      if (!submitData.description || !submitData.description.trim()) {
        submitData.description = null;
      }
      if (!submitData.contact_id) {
        submitData.contact_id = null;
      }
      if (!submitData.location || !submitData.location.trim()) {
        submitData.location = null;
      }
      if (!submitData.meeting_link || !submitData.meeting_link.trim()) {
        submitData.meeting_link = null;
      }

      // Add recurrence configuration if recurring
      const recurrenceConfig = buildRecurrenceConfig();
      if (recurrenceConfig) {
        submitData.recurrence = recurrenceConfig;
      }

      await onSave(submitData);
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save appointment:', error);
      setErrors({ general: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = (contact: ContactResponse | null) => {
    setSelectedContact(contact);
    setFormData(prev => ({ ...prev, contact_id: contact?.id || null }));
  };

  const getContactDisplayName = () => {
    if (!selectedContact) return 'Select Contact';
    // Show full name if available, otherwise business_name, otherwise email
    const fullName = `${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim();
    if (fullName) return fullName;
    if (selectedContact.business_name) return selectedContact.business_name;
    if (selectedContact.email) return selectedContact.email;
    return 'No Name';
  };

  // Format date/time for display
  const formatDateTime = (dateTimeStr: string, allDay = false) => {
    if (!dateTimeStr) return '-';
    const date = new Date(dateTimeStr);
    if (allDay) {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  // Get label for a type value
  const getTypeLabel = (value: string) => appointmentTypes.find((t: EnumItem) => t.value === value)?.label || value;

  // Read-only view component
  const ReadOnlyView = () => (
    <div className="px-6 py-4">
      {/* Read-only Banner */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-start gap-3">
        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-700">Read-only appointment</p>
          <p className="text-xs text-gray-500 mt-0.5">
            This appointment is from a read-only calendar and cannot be edited.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
          <p className="text-gray-900">{formData.title || '-'}</p>
        </div>

        {/* Description */}
        {formData.description && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
            <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
          <p className="text-gray-900">{getTypeLabel(formData.appointment_type)}</p>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Start</label>
            <p className="text-gray-900">{formatDateTime(formData.start_datetime, formData.all_day)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">End</label>
            <p className="text-gray-900">{formatDateTime(formData.end_datetime, formData.all_day)}</p>
          </div>
        </div>

        {/* All Day */}
        {formData.all_day && (
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              All-day event
            </span>
          </div>
        )}

        {/* Contact */}
        {selectedContact && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Contact</label>
            <p className="text-gray-900">{getContactDisplayName()}</p>
          </div>
        )}

        {/* Location */}
        {formData.location && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
            <p className="text-gray-900">{formData.location}</p>
          </div>
        )}

        {/* Meeting Link */}
        {formData.meeting_link && (
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Meeting Link</label>
            <a href={formData.meeting_link} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 underline break-all">
              {formData.meeting_link}
            </a>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
        >
          Close
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Backdrop */}
          <div
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {isReadOnly ? 'View Appointment' : (appointment ? 'Edit Appointment' : 'New Appointment')}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content - Read-only view or Form */}
            {isReadOnly ? (
              <ReadOnlyView />
            ) : (
            <form onSubmit={handleSubmit} className="px-6 py-4">
              {/* General Error */}
              {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    disabled={isReadOnly}
                    maxLength={255}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Client Meeting"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isReadOnly}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Optional notes about this appointment"
                  />
                </div>

                {/* Type & Contact Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Appointment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type <span className="text-red-500">*</span>
                    </label>
                    <Combobox
                      options={appointmentTypes.map((type: EnumItem) => ({ id: type.value, label: type.label }))}
                      value={formData.appointment_type || ''}
                      onChange={(value: string) => setFormData({ ...formData, appointment_type: value })}
                      placeholder="Select type..."
                      searchPlaceholder="Search types..."
                      disabled={isReadOnly}
                      allowClear={false}
                    />
                    {!!appointmentTypes.find((t: EnumItem) => t.value === formData.appointment_type)?.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {String(appointmentTypes.find((t: EnumItem) => t.value === formData.appointment_type)?.description)}
                      </p>
                    )}
                  </div>

                  {/* Contact Selection */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact
                    </label>
                    <button
                      ref={contactButtonRef}
                      type="button"
                      onClick={() => setShowContactSelector(true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                    >
                      <span className={selectedContact ? 'text-gray-900' : 'text-gray-400'}>
                        {getContactDisplayName()}
                      </span>
                    </button>

                    {/* Contact Selector Dropdown */}
                    <ContactSelectorModal
                      isOpen={showContactSelector}
                      onClose={() => setShowContactSelector(false)}
                      onSelect={handleContactSelect}
                      selectedContactId={formData.contact_id}
                      anchorRef={contactButtonRef as React.RefObject<HTMLElement>}
                    />
                  </div>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Start DateTime */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start <span className="text-red-500">*</span>
                    </label>
                    {formData.all_day ? (
                      <DatePickerCalendar
                        value={formData.start_datetime ? formData.start_datetime.split('T')[0] : ''}
                        onChange={(date) => {
                          setFormData({ ...formData, start_datetime: `${date}T00:00` });
                        }}
                        error={!!errors.start_datetime}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <DatePickerCalendar
                          value={formData.start_datetime ? formData.start_datetime.split('T')[0] : ''}
                          onChange={(date) => {
                            const time = formData.start_datetime ? formData.start_datetime.split('T')[1] : '09:00';
                            setFormData({ ...formData, start_datetime: `${date}T${time}` });
                          }}
                          error={!!errors.start_datetime}
                          className="flex-1"
                        />
                        <TimePickerInput
                          value={formData.start_datetime ? formData.start_datetime.split('T')[1] : ''}
                          onChange={(time: string) => {
                            const date = formData.start_datetime ? formData.start_datetime.split('T')[0] : '';
                            setFormData({ ...formData, start_datetime: `${date}T${time}` });
                          }}
                          error={!!errors.start_datetime}
                          className="flex-1"
                        />
                      </div>
                    )}
                    {errors.start_datetime && (
                      <p className="mt-1 text-sm text-red-600">{errors.start_datetime}</p>
                    )}
                  </div>

                  {/* End DateTime */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End <span className="text-red-500">*</span>
                    </label>
                    {formData.all_day ? (
                      <DatePickerCalendar
                        value={formData.end_datetime ? formData.end_datetime.split('T')[0] : ''}
                        onChange={(date) => {
                          setFormData({ ...formData, end_datetime: `${date}T23:59` });
                        }}
                        error={!!errors.end_datetime}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <DatePickerCalendar
                          value={formData.end_datetime ? formData.end_datetime.split('T')[0] : ''}
                          onChange={(date) => {
                            const time = formData.end_datetime ? formData.end_datetime.split('T')[1] : '10:00';
                            setFormData({ ...formData, end_datetime: `${date}T${time}` });
                          }}
                          error={!!errors.end_datetime}
                          className="flex-1"
                        />
                        <TimePickerInput
                          value={formData.end_datetime ? formData.end_datetime.split('T')[1] : ''}
                          onChange={(time: string) => {
                            const date = formData.end_datetime ? formData.end_datetime.split('T')[0] : '';
                            setFormData({ ...formData, end_datetime: `${date}T${time}` });
                          }}
                          error={!!errors.end_datetime}
                          className="flex-1"
                        />
                      </div>
                    )}
                    {errors.end_datetime && (
                      <p className="mt-1 text-sm text-red-600">{errors.end_datetime}</p>
                    )}
                  </div>
                </div>

                {/* All Day */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="all_day"
                    checked={formData.all_day}
                    onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="all_day" className="ml-2 text-sm text-gray-700">
                    All-day event
                  </label>
                </div>

                {/* Location & Meeting Link Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Office - Room 3"
                    />
                  </div>

                  {/* Meeting Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        errors.meeting_link ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="https://meet.google.com/..."
                    />
                    {errors.meeting_link && (
                      <p className="mt-1 text-sm text-red-600">{errors.meeting_link}</p>
                    )}
                  </div>
                </div>

                {/* Recurring Section */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="is_recurring" className="ml-2 text-sm font-medium text-gray-700">
                      Repeat
                    </label>
                  </div>

                  {isRecurring && (
                    <div className="space-y-4 pl-6 border-l-2 border-purple-200">
                      {/* Pattern Type & Interval Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Pattern Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repeat Pattern
                          </label>
                          <Combobox
                            options={recurringTypes.map((type: EnumItem) => ({ id: type.value, label: type.label }))}
                            value={recurringType}
                            onChange={(value: string) => setRecurringType(value)}
                            placeholder="Select pattern..."
                            searchPlaceholder="Search patterns..."
                            allowClear={false}
                          />
                        </div>

                        {/* Interval */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Repeat Every
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={recurringInterval}
                              onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-600">
                              {recurringType === 'daily' && 'day(s)'}
                              {recurringType === 'weekly' && 'week(s)'}
                              {recurringType === 'monthly' && 'month(s)'}
                              {recurringType === 'yearly' && 'year(s)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Weekly: Day Selector */}
                      {recurringType === 'weekly' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Repeat On
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { label: 'Mon', value: 'MO' },
                              { label: 'Tue', value: 'TU' },
                              { label: 'Wed', value: 'WE' },
                              { label: 'Thu', value: 'TH' },
                              { label: 'Fri', value: 'FR' },
                              { label: 'Sat', value: 'SA' },
                              { label: 'Sun', value: 'SU' },
                            ].map((day) => (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => {
                                  if (recurringWeekdays.includes(day.value)) {
                                    setRecurringWeekdays(recurringWeekdays.filter(d => d !== day.value));
                                  } else {
                                    setRecurringWeekdays([...recurringWeekdays, day.value]);
                                  }
                                }}
                                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                                  recurringWeekdays.includes(day.value)
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                                }`}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Monthly: Pattern Type */}
                      {recurringType === 'monthly' && (
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            Monthly Pattern
                          </label>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={recurringMonthlyType === 'day_of_month'}
                                onChange={() => setRecurringMonthlyType('day_of_month')}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-sm text-gray-700">Day of month</span>
                            </label>
                            {recurringMonthlyType === 'day_of_month' && (
                              <div className="ml-6 flex items-center gap-2">
                                <span className="text-sm text-gray-600">Day</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={recurringMonthlyDay}
                                  onChange={(e) => setRecurringMonthlyDay(parseInt(e.target.value) || 1)}
                                  className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={recurringMonthlyType === 'day_of_week'}
                                onChange={() => setRecurringMonthlyType('day_of_week')}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-sm text-gray-700">Day of week</span>
                            </label>
                            {recurringMonthlyType === 'day_of_week' && (
                              <div className="ml-6 flex items-center gap-2">
                                <select
                                  value={recurringMonthlyWeek}
                                  onChange={(e) => setRecurringMonthlyWeek(parseInt(e.target.value))}
                                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="1">1st</option>
                                  <option value="2">2nd</option>
                                  <option value="3">3rd</option>
                                  <option value="4">4th</option>
                                  <option value="-1">Last</option>
                                </select>
                                <select
                                  value={recurringMonthlyWeekday}
                                  onChange={(e) => setRecurringMonthlyWeekday(e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                >
                                  <option value="MO">Monday</option>
                                  <option value="TU">Tuesday</option>
                                  <option value="WE">Wednesday</option>
                                  <option value="TH">Thursday</option>
                                  <option value="FR">Friday</option>
                                  <option value="SA">Saturday</option>
                                  <option value="SU">Sunday</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* End Condition */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ends
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={recurringEndType === 'count'}
                              onChange={() => setRecurringEndType('count')}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="text-sm text-gray-700">After</span>
                          </label>
                          {recurringEndType === 'count' && (
                            <div className="ml-6 flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                value={recurringCount}
                                onChange={(e) => setRecurringCount(parseInt(e.target.value) || 1)}
                                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-600">occurrence(s)</span>
                            </div>
                          )}

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={recurringEndType === 'until'}
                              onChange={() => setRecurringEndType('until')}
                              className="w-4 h-4 text-purple-600"
                            />
                            <span className="text-sm text-gray-700">On date</span>
                          </label>
                          {recurringEndType === 'until' && (
                            <div className="ml-6">
                              <DatePickerCalendar
                                value={recurringUntil}
                                onChange={(date) => setRecurringUntil(date)}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recurring Error */}
                      {errors.recurring && (
                        <p className="text-sm text-red-600">{errors.recurring}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3">
                {/* Delete button (only shown when editing and not read-only) */}
                {appointment && onDelete && !isReadOnly && (
                  <button
                    type="button"
                    onClick={() => onDelete(appointment)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 mr-auto"
                  >
                    Delete
                  </button>
                )}
                {isReadOnly ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Close
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : appointment ? 'Update' : 'Create'}
                    </button>
                  </>
                )}
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentModal;
