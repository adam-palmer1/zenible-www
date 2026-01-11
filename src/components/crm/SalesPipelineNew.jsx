import React, { useState, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import PipelineColumn from './PipelineColumn';
import { useCRM } from '../../contexts/CRMContext';
import { useChangeContactStatusMutation } from '../../hooks/mutations/useContactMutations';
import { CRM_ERRORS } from '../../constants/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { getNextAppointment } from '../../utils/crm/appointmentUtils';

/**
 * Calculate total value for a contact
 * Formula: (recurring_total * 12) + one_off_total
 */
const calculateContactValue = (contact) => {
  const recurringTotal = contact.recurring_total || 0;
  const oneOffTotal = contact.one_off_total || 0;
  return (recurringTotal * 12) + oneOffTotal;
};

/**
 * Sales pipeline Kanban board component (React Query version)
 *
 * SIMPLIFICATIONS vs old version:
 * - No local state management (109 lines removed)
 * - No manual optimistic updates
 * - No complex sync logic with refs
 * - React Query handles all caching and updates automatically
 */
const SalesPipelineNew = ({ contacts = [], statuses = [], globalStatuses = [], customStatuses = [], onAddContact, onContactClick, sortOrder = null, onStatusUpdate }) => {
  const { openContactModal } = useCRM();
  const { showError } = useNotification();

  const [isDragging, setIsDragging] = useState(false);
  const [dragSourceColumnId, setDragSourceColumnId] = useState(null);

  // Use React Query mutation for status changes
  const changeStatusMutation = useChangeContactStatusMutation({
    onError: (error) => {
      showError(error.message || CRM_ERRORS.UPDATE_FAILED);
    },
  });

  // Group contacts by status and sort
  const contactsByStatus = useMemo(() => {
    const grouped = {};

    statuses.forEach((status) => {
      grouped[status.id] = [];
    });

    contacts.forEach((contact) => {
      const statusId = contact.current_global_status_id || contact.current_custom_status_id;
      if (statusId && grouped[statusId]) {
        grouped[statusId].push(contact);
      }
    });

    // Sort contacts within each status column
    Object.keys(grouped).forEach((statusId) => {
      // Apply sorting based on sortOrder
      if (sortOrder === 'high_to_low' || sortOrder === 'low_to_high') {
        // Value sorting (applies to all columns)
        grouped[statusId].sort((a, b) => {
          const valueA = calculateContactValue(a);
          const valueB = calculateContactValue(b);
          return sortOrder === 'high_to_low' ? valueB - valueA : valueA - valueB;
        });
      } else if (sortOrder === 'follow_up_date') {
        // Sort by appointment date (applies to all columns)
        grouped[statusId].sort((a, b) => {
          const nextAppointmentA = getNextAppointment(a.appointments);
          const nextAppointmentB = getNextAppointment(b.appointments);

          // Contacts without appointments go to the bottom
          const hasAppointmentA = !!nextAppointmentA?.start_datetime;
          const hasAppointmentB = !!nextAppointmentB?.start_datetime;

          if (!hasAppointmentA && !hasAppointmentB) return 0; // Both without appointments
          if (!hasAppointmentA) return 1; // A without appointment goes after B
          if (!hasAppointmentB) return -1; // B without appointment goes after A

          // Both have appointments - sort by date (soonest first)
          const dateA = new Date(nextAppointmentA.start_datetime);
          const dateB = new Date(nextAppointmentB.start_datetime);
          return dateA - dateB;
        });
      } else {
        // Default sorting by sort_order
        grouped[statusId].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }
    });

    return grouped;
  }, [contacts, statuses, sortOrder]);

  // Handle drag start
  const handleDragStart = (result) => {
    setIsDragging(true);
    setDragSourceColumnId(result.source.droppableId);
  };

  // Handle drag end - simplified with React Query
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Clear drag source
    setDragSourceColumnId(null);
    setIsDragging(false);

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Prevent reordering within the same column
    if (destination.droppableId === source.droppableId) {
      return;
    }

    // Determine if destination status is global or custom
    const isGlobalStatus = globalStatuses.some(s => s.id === destination.droppableId);

    const statusData = isGlobalStatus
      ? { current_global_status_id: destination.droppableId, current_custom_status_id: null }
      : { current_custom_status_id: destination.droppableId, current_global_status_id: null };

    // Execute mutation - React Query handles optimistic updates and rollback
    try {
      await changeStatusMutation.mutateAsync({
        contactId: draggableId,
        statusData,
      });
    } catch (error) {
      // Error already handled by mutation's onError
      console.error('Failed to move contact:', error);
    }
  };

  if (statuses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p>No statuses available</p>
          <p className="text-sm mt-1">Contact your administrator</p>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-2 sm:gap-3 lg:gap-4 items-start overflow-x-auto pb-4 -mx-3 px-3 md:mx-0 md:px-0">
        {statuses.map((status) => (
          <PipelineColumn
            key={status.id}
            status={status}
            contacts={contactsByStatus[status.id] || []}
            onAddContact={() => openContactModal(null, status.id)}
            onContactClick={onContactClick}
            totalVisibleColumns={statuses.length}
            globalStatuses={globalStatuses}
            customStatuses={customStatuses}
            onStatusUpdate={onStatusUpdate}
            dragSourceColumnId={dragSourceColumnId}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default SalesPipelineNew;
