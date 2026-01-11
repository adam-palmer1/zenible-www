import React, { useState, useMemo } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import PipelineColumn from './PipelineColumn';
import { useCRM } from '../../contexts/CRMContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getNextAppointment } from '../../utils/crm/appointmentUtils';
import { calculateContactValue } from '../../utils/crm/valueCalculations';
import contactsAPI from '../../services/api/crm/contacts';

/**
 * Sales pipeline Kanban board component
 */
const SalesPipeline = ({ contacts = [], statuses = [], globalStatuses = [], customStatuses = [], onAddContact, onContactClick, sortOrder = null, onStatusUpdate, onRefresh }) => {
  const { openContactModal } = useCRM();
  const { showError } = useNotification();
  const [dragSourceColumnId, setDragSourceColumnId] = useState(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState({});

  // Group contacts by status and sort by sort_order
  const contactsByStatus = useMemo(() => {
    const grouped = {};

    statuses.forEach((status) => {
      grouped[status.id] = [];
    });

    // Apply optimistic updates to contacts
    const contactsWithUpdates = contacts.map(contact => {
      const update = optimisticUpdates[contact.id];
      return update ? { ...contact, ...update } : contact;
    });

    contactsWithUpdates.forEach((contact) => {
      const statusId = contact.current_global_status_id || contact.current_custom_status_id;
      if (statusId && grouped[statusId]) {
        grouped[statusId].push(contact);
      }
    });

    // Sort contacts within each status column
    Object.keys(grouped).forEach((statusId) => {
      const status = statuses.find(s => s.id === statusId);

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

      console.log(`Status ${statusId} has ${grouped[statusId].length} contacts`);
    });

    console.log('Grouped contacts by status:', Object.keys(grouped).map(key => ({
      statusId: key,
      count: grouped[key].length,
      contacts: grouped[key].map(c => `${c.first_name} ${c.last_name} (${c.sort_order})`)
    })));

    return grouped;
  }, [contacts, statuses, sortOrder, optimisticUpdates]);

  // Handle drag start
  const handleDragStart = (result) => {
    setDragSourceColumnId(result.source.droppableId);
  };

  // Handle drag end - only allow moving between columns
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Clear drag source
    setDragSourceColumnId(null);

    // Dropped outside the list or same column
    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    // Determine if destination status is global or custom
    const isGlobalStatus = globalStatuses.some(s => s.id === destination.droppableId);

    const statusData = isGlobalStatus
      ? { current_global_status_id: destination.droppableId, current_custom_status_id: null }
      : { current_custom_status_id: destination.droppableId, current_global_status_id: null };

    // Apply optimistic update immediately
    setOptimisticUpdates(prev => ({
      ...prev,
      [draggableId]: statusData
    }));

    // Update in background
    try {
      await contactsAPI.update(draggableId, statusData);

      // Keep optimistic update in place - don't trigger re-fetch
      // The update is already visible and parent will get fresh data on next natural refresh
    } catch (error) {
      console.error('Failed to update contact status:', error);
      showError(error.message || 'Failed to update contact status');

      // Rollback optimistic update on error
      setOptimisticUpdates(prev => {
        const { [draggableId]: _, ...rest } = prev;
        return rest;
      });
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

export default SalesPipeline;
