import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import PipelineColumn from './PipelineColumn';
import { useCRM } from '../../contexts/CRMContext';
import { useChangeContactStatusMutation } from '../../hooks/mutations/useContactMutations';
import { CRM_ERRORS } from '../../constants/crm';
import { useNotification } from '../../contexts/NotificationContext';
import { getNextAppointment } from '../../utils/crm/appointmentUtils';

/**
 * Calculate total value for a contact
 * Formula: (confirmed_recurring + active_recurring) + (confirmed_one_off + active_one_off)
 * Note: recurring totals from API are already annualized
 */
const calculateContactValue = (contact) => {
  const confirmedRecurring = parseFloat(contact?.confirmed_recurring_total) || 0;
  const activeRecurring = parseFloat(contact?.active_recurring_total) || 0;
  const confirmedOneOff = parseFloat(contact?.confirmed_one_off_total) || 0;
  const activeOneOff = parseFloat(contact?.active_one_off_total) || 0;
  return confirmedRecurring + activeRecurring + confirmedOneOff + activeOneOff;
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
const SalesPipelineNew = ({ contacts = [], statuses = [], globalStatuses = [], customStatuses = [], onAddContact, onContactClick, sortOrder = null, onStatusUpdate, onColumnReorder }) => {
  const { openContactModal } = useCRM();
  const { showError } = useNotification();

  const [isDragging, setIsDragging] = useState(false);
  const [dragSourceColumnId, setDragSourceColumnId] = useState(null);
  const [draggingContact, setDraggingContact] = useState(null);

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
    // Only set contact drag state for CONTACT type drags
    if (result.type === 'CONTACT') {
      setIsDragging(true);
      setDragSourceColumnId(result.source.droppableId);
      // Find and store the dragging contact for portal rendering in renderClone
      const contact = contacts.find(c => c.id === result.draggableId);
      setDraggingContact(contact);
    }
  };

  // Handle drag end - handles both contact moves and column reordering
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    // Clear drag state
    setDragSourceColumnId(null);
    setIsDragging(false);
    setDraggingContact(null);

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Handle column reordering
    if (type === 'COLUMN') {
      if (destination.index === source.index) {
        return; // No change
      }

      // Create new order array
      const newOrder = statuses.map(s => s.id);
      const [movedId] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, movedId);

      // Call the reorder handler
      if (onColumnReorder) {
        onColumnReorder(newOrder);
      }
      return;
    }

    // Handle contact move between columns (type === 'CONTACT')
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
      <Droppable droppableId="columns" type="COLUMN" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex gap-2 sm:gap-3 lg:gap-4 items-start overflow-x-auto pb-4 -mx-3 px-3 md:mx-0 md:px-0"
          >
            {statuses.map((status, index) => (
              <Draggable key={status.id} draggableId={`column-${status.id}`} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`flex-1 min-w-[252px] sm:min-w-[288px] lg:min-w-0 transition-all duration-200 ${
                      snapshot.isDragging ? 'opacity-90 shadow-lg z-50' : ''
                    }`}
                  >
                    <PipelineColumn
                      status={status}
                      contacts={contactsByStatus[status.id] || []}
                      onAddContact={() => openContactModal(null, status.id)}
                      onContactClick={onContactClick}
                      totalVisibleColumns={statuses.length}
                      globalStatuses={globalStatuses}
                      customStatuses={customStatuses}
                      onStatusUpdate={onStatusUpdate}
                      dragSourceColumnId={dragSourceColumnId}
                      draggingContact={draggingContact}
                      columnDragHandleProps={provided.dragHandleProps}
                      isColumnDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default SalesPipelineNew;
