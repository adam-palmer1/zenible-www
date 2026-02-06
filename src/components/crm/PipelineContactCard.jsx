import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PhoneIcon, CalendarIcon } from '@heroicons/react/24/outline';
import ServiceValueDisplay from './ServiceValueDisplay';
import ContactActionMenu from './ContactActionMenu';
import AppointmentsModal from './AppointmentsModal';
import { getContactDisplayName } from '../../utils/crm/contactUtils';

/**
 * Card content component - exported for use in DragOverlay
 * This renders the visual content of the contact card
 */
export const PipelineContactCardContent = ({
  contact,
  isDragging = false,
  onClick,
  onAppointmentClick,
}) => {
  // Use the next_appointment field from the backend (already computed)
  const nextAppointment = contact.next_appointment;

  // Get display name using shared utility
  const displayName = getContactDisplayName(contact);

  // Check if appointment is overdue
  const isAppointmentOverdue =
    nextAppointment?.start_datetime && new Date(nextAppointment.start_datetime) <= new Date();

  // Determine if this is a call appointment
  const isCallAppointment = nextAppointment?.appointment_type === 'call';

  return (
    <div
      className={`w-full border rounded-[12px] shadow-sm cursor-move select-none overflow-hidden transition-all duration-200 ${
        isAppointmentOverdue
          ? 'bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700'
          : 'bg-white dark:bg-gray-800 border-[#e5e5e5] dark:border-gray-700'
      } ${isDragging ? 'shadow-[0_0_0_3px_rgba(138,43,225,0.5)] scale-105' : 'hover:shadow-md'}`}
      onClick={onClick}
    >
      {/* Header: Badges/Name + Action Menu - Figma Design */}
      {contact.is_client || contact.is_vendor ? (
        <>
          {/* If has badges: Show badges row, then name below */}
          <div className="flex items-center justify-between p-4 w-full">
            {/* Client/Vendor Badges - Top Left */}
            <div className="flex gap-2 items-center">
              {contact.is_client && (
                <div className="bg-zenible-primary px-2 py-0.5 rounded-md h-6 flex items-center justify-center">
                  <p className="font-medium text-xs leading-5 text-white whitespace-nowrap">
                    Client
                  </p>
                </div>
              )}
              {contact.is_vendor && (
                <div className="bg-[#dff2fe] px-2 py-0.5 rounded-md h-6 flex items-center justify-center">
                  <p className="font-medium text-xs leading-5 text-[#09090b] whitespace-nowrap">
                    Vendor
                  </p>
                </div>
              )}
            </div>

            {/* Action Menu - Top Right */}
            <div
              className="flex items-center justify-center px-1 py-0.5 rounded-md h-6"
              onClick={(e) => e.stopPropagation()}
            >
              <ContactActionMenu contact={contact} />
            </div>
          </div>

          {/* Name below badges */}
          <div className="px-4 pb-0 w-full">
            <p
              className={`font-medium text-base leading-6 text-[#09090b] dark:text-white truncate w-full ${contact.is_hidden ? 'line-through opacity-60' : ''}`}
            >
              {displayName}
            </p>
          </div>
        </>
      ) : (
        <>
          {/* If no badges: Show name and action menu in same row */}
          <div className="flex items-center justify-between p-4 pb-2 w-full">
            {/* Name - Top Left */}
            <div className="flex flex-col items-start flex-1 min-w-0">
              <p
                className={`font-medium text-base leading-6 text-[#09090b] dark:text-white truncate w-full ${contact.is_hidden ? 'line-through opacity-60' : ''}`}
              >
                {displayName}
              </p>
            </div>

            {/* Action Menu - Top Right */}
            <div
              className="flex items-center justify-center px-1 py-0.5 rounded-md h-6 ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              <ContactActionMenu contact={contact} />
            </div>
          </div>
        </>
      )}

      {/* Contact Info - Plain Text */}
      <div className={`px-4 pb-3 w-full ${contact.is_client || contact.is_vendor ? 'pt-1' : ''}`}>
        <div className="flex flex-col gap-1 items-start w-full">
          {contact.business_name && contact.first_name && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate w-full">
              {contact.business_name}
            </p>
          )}

          {contact.email && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-full">
              {contact.email}
            </p>
          )}

          {contact.phone && (
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-full">
              {contact.phone}
            </p>
          )}
        </div>
      </div>

      {/* Services Value */}
      {(contact.pending_services_count > 0 ||
        (contact.confirmed_services_count > 0 &&
          (contact.confirmed_one_off_total || contact.confirmed_recurring_total)) ||
        (contact.active_services_count > 0 &&
          (contact.active_one_off_total || contact.active_recurring_total))) && (
        <div className="px-4 pt-3 pb-3 border-t border-[#e5e5e5] dark:border-gray-700 space-y-2">
          {/* Pending Services */}
          {contact.pending_services_count > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {contact.pending_services_count} pending{' '}
                {contact.pending_services_count === 1 ? 'service' : 'services'}
              </span>
              <ServiceValueDisplay
                oneOffTotal={contact.pending_one_off_total}
                recurringTotal={contact.pending_recurring_total}
                currency={contact.total_value_currency}
                variant="pending"
              />
            </div>
          )}
          {/* Confirmed Services - ready to start */}
          {contact.confirmed_services_count > 0 &&
            (contact.confirmed_one_off_total || contact.confirmed_recurring_total) && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-zenible-primary">
                  {contact.confirmed_services_count} confirmed{' '}
                  {contact.confirmed_services_count === 1 ? 'service' : 'services'}
                </span>
                <ServiceValueDisplay
                  oneOffTotal={contact.confirmed_one_off_total}
                  recurringTotal={contact.confirmed_recurring_total}
                  currency={contact.total_value_currency}
                  variant="confirmed"
                />
              </div>
            )}
          {/* Active Services - being worked on */}
          {contact.active_services_count > 0 &&
            (contact.active_one_off_total || contact.active_recurring_total) && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {contact.active_services_count} active{' '}
                  {contact.active_services_count === 1 ? 'service' : 'services'}
                </span>
                <ServiceValueDisplay
                  oneOffTotal={contact.active_one_off_total}
                  recurringTotal={contact.active_recurring_total}
                  currency={contact.total_value_currency}
                />
              </div>
            )}
        </div>
      )}

      {/* Appointment Section - Figma Design */}
      <div
        className={`flex gap-1 items-center pb-4 pt-3 px-4 border-t border-[#e5e5e5] dark:border-gray-700 ${
          contact.pending_services_count > 0 ||
          (contact.confirmed_services_count > 0 &&
            (contact.confirmed_one_off_total || contact.confirmed_recurring_total)) ||
          (contact.active_services_count > 0 &&
            (contact.active_one_off_total || contact.active_recurring_total))
            ? ''
            : 'mt-3'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onAppointmentClick) onAppointmentClick();
          }}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label={
            nextAppointment
              ? `${isCallAppointment ? 'Call' : 'Appointment'}: ${new Date(nextAppointment.start_datetime).toLocaleDateString()}`
              : 'Add appointment'
          }
          title={
            nextAppointment
              ? `${isCallAppointment ? 'Call' : 'Appointment'}: ${new Date(nextAppointment.start_datetime).toLocaleDateString()}`
              : 'Add appointment'
          }
        >
          {isCallAppointment ? (
            <PhoneIcon
              className={`h-4 w-4 ${nextAppointment ? 'text-zenible-primary' : 'text-[#71717a] dark:text-gray-400'}`}
            />
          ) : (
            <CalendarIcon
              className={`h-4 w-4 ${nextAppointment ? 'text-zenible-primary' : 'text-[#71717a] dark:text-gray-400'}`}
            />
          )}
          {nextAppointment ? (
            <span className="text-xs leading-5 font-normal text-zenible-primary">
              {new Date(nextAppointment.start_datetime).toLocaleDateString()}
              {nextAppointment.start_datetime.includes('T') && (
                <span className="ml-1">
                  {new Date(nextAppointment.start_datetime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs leading-5 font-normal text-[#71717a] dark:text-gray-400">
              Add Appointment
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Contact card component for pipeline view using @dnd-kit
 * Uses useSortable for drag functionality
 */
const PipelineContactCard = ({ contact, onClick, status }) => {
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);

  // Sortable hook for drag functionality
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: contact.id,
    data: {
      type: 'contact',
      contact,
      statusId: status?.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <PipelineContactCardContent
          contact={contact}
          isDragging={isDragging}
          onClick={onClick}
          onAppointmentClick={() => setShowAppointmentsModal(true)}
        />
      </div>

      {/* Appointments Modal */}
      <AppointmentsModal
        isOpen={showAppointmentsModal}
        onClose={() => setShowAppointmentsModal(false)}
        contact={contact}
      />
    </>
  );
};

export default PipelineContactCard;
