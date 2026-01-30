import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Droppable } from '@hello-pangea/dnd';
import { PlusIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PipelineContactCard, { PipelineContactCardContent } from './PipelineContactCard';
import ServiceValueDisplay from './ServiceValueDisplay';
import statusesAPI from '../../services/api/crm/statuses';
import { getStatusColor } from '../../utils/crm/statusUtils';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * Pipeline column component for Kanban view
 * Simplified - no longer needs action props (uses ContactActionsContext)
 */
const PipelineColumn = ({ status, contacts = [], onAddContact, onContactClick, totalVisibleColumns = 1, globalStatuses = [], customStatuses = [], onStatusUpdate, dragSourceColumnId = null, draggingContact = null, columnDragHandleProps = null, isColumnDragging = false }) => {
  const { showSuccess, showError } = useNotification();

  // Determine if this is a global or custom status
  const isGlobal = globalStatuses.some(s => s.id === status.id);

  // Use status friendly_name directly
  const displayName = status.friendly_name || status.name;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(displayName);
  const inputRef = useRef(null);

  // Calculate total value in this stage (separated by status: pending, confirmed, active)
  const columnTotals = contacts.reduce((acc, contact) => {
    // Pending totals
    acc.pendingOneOff += parseFloat(contact.pending_one_off_total || 0);
    acc.pendingRecurring += parseFloat(contact.pending_recurring_total || 0);
    // Confirmed totals (ready to start)
    acc.confirmedOneOff += parseFloat(contact.confirmed_one_off_total || 0);
    acc.confirmedRecurring += parseFloat(contact.confirmed_recurring_total || 0);
    // Active totals (being worked on)
    acc.activeOneOff += parseFloat(contact.active_one_off_total || 0);
    acc.activeRecurring += parseFloat(contact.active_recurring_total || 0);
    return acc;
  }, { pendingOneOff: 0, pendingRecurring: 0, confirmedOneOff: 0, confirmedRecurring: 0, activeOneOff: 0, activeRecurring: 0 });

  // Check if we have any values to display
  const hasPendingValues = columnTotals.pendingOneOff > 0 || columnTotals.pendingRecurring > 0;
  const hasConfirmedValues = columnTotals.confirmedOneOff > 0 || columnTotals.confirmedRecurring > 0;
  const hasActiveValues = columnTotals.activeOneOff > 0 || columnTotals.activeRecurring > 0;

  // Get currency from first contact (all should be in default currency)
  const totalCurrency = contacts[0]?.total_value_currency || 'GBP';

  // Get status color
  const statusColor = getStatusColor(status);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditedTitle(displayName);
  };

  const handleSaveEdit = async () => {
    if (!editedTitle.trim()) {
      handleCancelEdit();
      return;
    }

    if (editedTitle === displayName) {
      setIsEditingTitle(false);
      return;
    }

    try {
      // Update status friendly_name via API
      const updateData = {
        friendly_name: editedTitle,
      };

      if (isGlobal) {
        await statusesAPI.updateGlobal(status.id, updateData);
      } else {
        await statusesAPI.updateCustom(status.id, updateData);
      }

      showSuccess('Column renamed successfully');
      setIsEditingTitle(false);

      // Notify parent to refresh statuses
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Failed to save column name:', error);
      showError(error.message || 'Failed to rename column. Please try again.');
      handleCancelEdit();
    }
  };

  // Update edited title when display name changes
  useEffect(() => {
    setEditedTitle(displayName);
  }, [displayName]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="w-full transition-all duration-200">
      {/* Column Header - Figma Design (drag handle for column reordering) */}
      <div
        {...columnDragHandleProps}
        className={`p-3 w-full rounded-2xl bg-white border transition-all duration-200 ${
          isColumnDragging ? 'border-zenible-primary shadow-md' : 'border-[#f4f4f5]'
        } ${columnDragHandleProps ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex items-center gap-0.5 w-full">
          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 px-2 py-1 text-sm font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenible-primary"
                maxLength={50}
              />
              <button
                onClick={handleSaveEdit}
                className="flex-shrink-0 p-1 text-zenible-primary hover:bg-purple-50 rounded transition-colors"
                title="Save"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-shrink-0 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Cancel"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Title Chip with nested count chip - Figma design with dynamic color */}
              <div
                className="rounded-[10px] pl-2 pr-[5px] py-1 flex items-center gap-2 shrink-0 group relative border-2"
                style={{
                  backgroundColor: statusColor,
                  borderColor: statusColor,
                }}
              >
                <p className="font-medium text-sm leading-[22px] text-gray-900 dark:text-white whitespace-nowrap">
                  {displayName}
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-md px-1.5 py-[3px] flex items-center justify-center min-w-[20px] h-5">
                  <p className="font-medium text-[10px] leading-[14px] text-gray-900 dark:text-white text-center">
                    {contacts.length}
                  </p>
                </div>
                {/* Edit button - shows on hover */}
                <button
                  onClick={handleStartEdit}
                  className="absolute -right-6 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-zenible-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                  title="Rename column"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Info Icon - removed as it's not functional in current implementation */}

              {/* Spacer */}
              <div className="flex-1 min-w-0" />

              {/* Actions */}
              <div className="flex items-center gap-0">
                <button
                  onClick={onAddContact}
                  className="p-[7px] text-gray-900 hover:bg-gray-100 rounded-[10px] transition-colors"
                  title="Add contact"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Always show divider and amount area for consistent column height */}
        <>
          {/* Horizontal divider line */}
          <div className="border-t border-[#e5e5e5] my-2" />
          {/* Amount - show pending, confirmed and active separately */}
          <div className="flex flex-col gap-1 text-xs sm:text-sm min-h-[20px]">
            {(hasPendingValues || hasConfirmedValues || hasActiveValues) ? (
              <>
                {hasPendingValues && (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-amber-600 dark:text-amber-400 text-xs shrink-0">Pending:</span>
                    <div className="truncate min-w-0">
                      <ServiceValueDisplay
                        oneOffTotal={columnTotals.pendingOneOff}
                        recurringTotal={columnTotals.pendingRecurring}
                        currency={totalCurrency}
                        variant="pending"
                      />
                    </div>
                  </div>
                )}
                {hasConfirmedValues && (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-zenible-primary text-xs shrink-0">Confirmed:</span>
                    <div className="truncate min-w-0">
                      <ServiceValueDisplay
                        oneOffTotal={columnTotals.confirmedOneOff}
                        recurringTotal={columnTotals.confirmedRecurring}
                        currency={totalCurrency}
                        variant="confirmed"
                      />
                    </div>
                  </div>
                )}
                {hasActiveValues && (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-gray-500 dark:text-gray-400 text-xs shrink-0">Active:</span>
                    <div className="truncate min-w-0">
                      <ServiceValueDisplay
                        oneOffTotal={columnTotals.activeOneOff}
                        recurringTotal={columnTotals.activeRecurring}
                        currency={totalCurrency}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <span className="text-transparent select-none">-</span>
            )}
          </div>
        </>
      </div>

      {/* Contacts List */}
      <Droppable
        droppableId={status.id}
        type="CONTACT"
        renderClone={(provided, snapshot, rubric) => {
          // Find the contact being dragged - check local contacts first, then fallback to draggingContact
          const contact = contacts.find(c => c.id === rubric.draggableId) || draggingContact;
          if (!contact) return null;

          // Render in a portal at document.body to fix scroll position tracking
          return createPortal(
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className="w-[252px]"
              style={provided.draggableProps.style}
            >
              <PipelineContactCardContent
                contact={contact}
                isDragging={true}
              />
            </div>,
            document.body
          );
        }}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`mt-3 sm:mt-4 min-h-[100px] sm:min-h-32 transition-all duration-200 rounded-lg ${
              snapshot.isDraggingOver ? 'bg-brand-purple/10 shadow-[0_0_0_3px_rgba(138,43,225,0.3)]' : ''
            }`}
          >
            {/* Use auto-fill grid when fewer columns - allows up to 10% compression (280px -> 252px) */}
            <div
              className="w-full gap-2 sm:gap-3"
              style={{
                display: 'grid',
                gridTemplateColumns: totalVisibleColumns <= 4
                  ? 'repeat(auto-fill, minmax(min(252px, 100%), 1fr))'
                  : '1fr'
              }}
            >
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-design-text-muted col-span-full">
                  <p className="text-sm">No contacts</p>
                </div>
              ) : (
                contacts.map((contact, index) => (
                  <PipelineContactCard
                    key={contact.id}
                    contact={contact}
                    status={status}
                    index={index}
                    onClick={() => onContactClick(contact)}
                  />
                ))
              )}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default PipelineColumn;
