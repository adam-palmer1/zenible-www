import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import PipelineColumn from './PipelineColumn';
import { PipelineContactCardContent } from './PipelineContactCard';
import { useCRM } from '../../contexts/CRMContext';
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
 * Sales pipeline Kanban board component using @dnd-kit
 *
 * Features:
 * - Drag contacts between columns to change status
 * - Drag columns to reorder them
 * - Excellent scroll handling
 * - Accessible keyboard navigation
 */
const SalesPipelineNew = ({
  contacts = [],
  statuses = [],
  globalStatuses = [],
  customStatuses = [],
  onAddContact,
  onContactClick,
  onUpdateContact,
  sortOrder = null,
  onStatusUpdate,
  onColumnReorder,
}) => {
  const { openContactModal } = useCRM();
  const { showError } = useNotification();

  // Track active dragging item
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null); // 'contact' or 'column'

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before starting drag
      },
    }),
    useSensor(KeyboardSensor)
  );

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
      if (sortOrder === 'high_to_low' || sortOrder === 'low_to_high') {
        grouped[statusId].sort((a, b) => {
          const valueA = calculateContactValue(a);
          const valueB = calculateContactValue(b);
          return sortOrder === 'high_to_low' ? valueB - valueA : valueA - valueB;
        });
      } else if (sortOrder === 'follow_up_date') {
        grouped[statusId].sort((a, b) => {
          const nextAppointmentA = getNextAppointment(a.appointments);
          const nextAppointmentB = getNextAppointment(b.appointments);

          const hasAppointmentA = !!nextAppointmentA?.start_datetime;
          const hasAppointmentB = !!nextAppointmentB?.start_datetime;

          if (!hasAppointmentA && !hasAppointmentB) return 0;
          if (!hasAppointmentA) return 1;
          if (!hasAppointmentB) return -1;

          const dateA = new Date(nextAppointmentA.start_datetime);
          const dateB = new Date(nextAppointmentB.start_datetime);
          return dateA - dateB;
        });
      } else {
        grouped[statusId].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }
    });

    return grouped;
  }, [contacts, statuses, sortOrder]);

  // Get the active contact being dragged (for overlay)
  const activeContact = useMemo(() => {
    if (!activeId || activeType !== 'contact') return null;
    return contacts.find((c) => c.id === activeId);
  }, [activeId, activeType, contacts]);

  // Find which column a contact belongs to
  const findColumnForContact = useCallback(
    (contactId) => {
      for (const [statusId, columnContacts] of Object.entries(contactsByStatus)) {
        if (columnContacts.some((c) => c.id === contactId)) {
          return statusId;
        }
      }
      return null;
    },
    [contactsByStatus]
  );

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const id = active.id;

    // Determine if dragging a column or a contact
    if (typeof id === 'string' && id.startsWith('column-')) {
      setActiveType('column');
      setActiveId(id.replace('column-', ''));
    } else {
      setActiveType('contact');
      setActiveId(id);
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;

      setActiveId(null);
      setActiveType(null);

      if (!over) return;

      // Handle column reordering
      if (activeType === 'column') {
        const activeColumnId = active.id.replace('column-', '');
        const overColumnId = over.id.replace('column-', '');

        if (activeColumnId !== overColumnId) {
          const oldIndex = statuses.findIndex((s) => s.id === activeColumnId);
          const newIndex = statuses.findIndex((s) => s.id === overColumnId);

          if (oldIndex !== -1 && newIndex !== -1 && onColumnReorder) {
            const newOrder = arrayMove(
              statuses.map((s) => s.id),
              oldIndex,
              newIndex
            );
            onColumnReorder(newOrder);
          }
        }
        return;
      }

      // Handle contact movement between columns
      const contactId = active.id;
      let destinationColumnId = null;

      // Determine destination column
      if (over.id.startsWith('column-')) {
        // Dropped directly on a column
        destinationColumnId = over.id.replace('column-', '');
      } else if (over.id.startsWith('droppable-')) {
        // Dropped on a droppable area
        destinationColumnId = over.id.replace('droppable-', '');
      } else {
        // Dropped on another contact - find its column
        destinationColumnId = findColumnForContact(over.id);
      }

      if (!destinationColumnId) return;

      const sourceColumnId = findColumnForContact(contactId);

      // Only update if moving to a different column
      if (sourceColumnId === destinationColumnId) return;

      // Determine if destination status is global or custom
      const isGlobalStatus = globalStatuses.some((s) => s.id === destinationColumnId);

      const statusData = isGlobalStatus
        ? { current_global_status_id: destinationColumnId, current_custom_status_id: null }
        : { current_custom_status_id: destinationColumnId, current_global_status_id: null };

      try {
        // Use onUpdateContact to update local state in useContacts hook
        if (onUpdateContact) {
          await onUpdateContact(contactId, statusData, { skipLoading: true });
        }
      } catch (error) {
        console.error('Failed to move contact:', error);
        showError('Failed to move contact. Please try again.');
      }
    },
    [
      activeType,
      statuses,
      onColumnReorder,
      findColumnForContact,
      globalStatuses,
      onUpdateContact,
      showError,
    ]
  );

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
  }, []);

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

  // Column IDs for sortable context
  const columnIds = statuses.map((s) => `column-${s.id}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
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
              isDraggingContact={activeType === 'contact'}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag overlay - renders the dragged item */}
      <DragOverlay dropAnimation={null}>
        {activeContact && (
          <div style={{ width: '280px' }}>
            <PipelineContactCardContent contact={activeContact} isDragging={true} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

export default SalesPipelineNew;
