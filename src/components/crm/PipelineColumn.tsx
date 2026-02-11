import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PipelineContactCard from './PipelineContactCard';
import ServiceValueDisplay from './ServiceValueDisplay';
import statusesAPI from '../../services/api/crm/statuses';
import { getStatusColor } from '../../utils/crm/statusUtils';
import { useNotification } from '../../contexts/NotificationContext';

interface PipelineColumnProps {
  status: any;
  contacts?: any[];
  onAddContact?: () => void;
  onContactClick?: (contact: any) => void;
  totalVisibleColumns?: number;
  globalStatuses?: any[];
  customStatuses?: any[];
  onStatusUpdate?: () => void;
  isDraggingContact?: boolean;
}

const PipelineColumn: React.FC<PipelineColumnProps> = ({
  status,
  contacts = [],
  onAddContact,
  onContactClick,
  totalVisibleColumns: _totalVisibleColumns = 1,
  globalStatuses = [],
  customStatuses: _customStatuses = [],
  onStatusUpdate,
  isDraggingContact = false,
}) => {
  const { showSuccess, showError } = useNotification();

  // Determine if this is a global or custom status
  const isGlobal = globalStatuses.some((s: any) => s.id === status.id);

  // Use status friendly_name directly
  const displayName = status.friendly_name || status.name;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(displayName);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sortable hook for column reordering
  const {
    attributes: columnAttributes,
    listeners: columnListeners,
    setNodeRef: setColumnNodeRef,
    transform: columnTransform,
    transition: columnTransition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: `column-${status.id}`,
    data: {
      type: 'column',
      status,
    },
  });

  // Droppable hook for the contact drop zone
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${status.id}`,
    data: {
      type: 'column',
      statusId: status.id,
    },
  });

  const columnStyle = {
    transform: CSS.Transform.toString(columnTransform),
    transition: columnTransition,
  };

  // Calculate total value in this stage (separated by status: pending, confirmed, active)
  const columnTotals = contacts.reduce(
    (acc: any, contact: any) => {
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
    },
    {
      pendingOneOff: 0,
      pendingRecurring: 0,
      confirmedOneOff: 0,
      confirmedRecurring: 0,
      activeOneOff: 0,
      activeRecurring: 0,
    }
  );

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

  const handleStartEdit = (e: React.MouseEvent) => {
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
        await (statusesAPI as Record<string, Function>).updateGlobal(status.id, updateData);
      } else {
        await (statusesAPI as Record<string, Function>).updateCustom(status.id, updateData);
      }

      showSuccess('Column renamed successfully');
      setIsEditingTitle(false);

      // Notify parent to refresh statuses
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error: any) {
      console.error('Failed to save column name:', error);
      showError(error.message || 'Failed to rename column. Please try again.');
      handleCancelEdit();
    }
  };

  // Update edited title when display name changes
  useEffect(() => {
    setEditedTitle(displayName);
  }, [displayName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent dnd-kit from capturing keys (especially Space)
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Contact IDs for sortable context
  const contactIds = contacts.map((c: any) => c.id);

  return (
    <div
      ref={(node) => {
        // Combine column sortable ref and droppable ref
        setColumnNodeRef(node);
        setDroppableRef(node);
      }}
      style={columnStyle}
      className={`flex-1 min-w-[140px] sm:min-w-[160px] h-full min-h-[400px] rounded-xl transition-all duration-200 ${
        isColumnDragging ? 'opacity-50 z-50' : ''
      } ${
        isOver && isDraggingContact
          ? 'bg-zenible-primary/10 ring-3 ring-zenible-primary shadow-lg shadow-zenible-primary/20'
          : ''
      }`}
    >
      {/* Column Header - drag handle for column reordering */}
      <div
        {...columnAttributes}
        {...columnListeners}
        className={`p-3 w-full rounded-2xl bg-white border ${
          isColumnDragging ? 'border-zenible-primary shadow-md' : 'border-[#f4f4f5]'
        } cursor-grab active:cursor-grabbing`}
      >
        <div className="flex items-center gap-0.5 w-full group">
          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 px-2 py-1 text-sm font-semibold border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-zenible-primary"
                maxLength={16}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
              />
              <button
                onClick={handleSaveEdit}
                onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                className="flex-shrink-0 p-1 text-zenible-primary hover:bg-purple-50 rounded transition-colors"
                title="Save"
              >
                <CheckIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
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
                className="rounded-[10px] pl-2 pr-[5px] py-1 flex items-center gap-2 min-w-0 border-2"
                style={{
                  backgroundColor: statusColor,
                  borderColor: statusColor,
                }}
              >
                <p className="font-medium text-sm leading-[22px] text-gray-900 dark:text-white truncate">
                  {displayName}
                </p>
                {/* Count badge — hidden on hover, replaced by pencil */}
                <div className="bg-white dark:bg-gray-800 rounded-md px-1.5 py-[3px] flex items-center justify-center min-w-[20px] h-5 shrink-0 group-hover:hidden">
                  <p className="font-medium text-[10px] leading-[14px] text-gray-900 dark:text-white text-center">
                    {contacts.length}
                  </p>
                </div>
                {/* Edit pencil — replaces count badge on hover */}
                <button
                  onClick={handleStartEdit}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
                  className="hidden group-hover:flex items-center justify-center min-w-[20px] h-5 shrink-0 text-gray-600 hover:text-zenible-primary transition-colors"
                  title="Rename column"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Spacer */}
              <div className="flex-1 min-w-0" />

              {/* Actions */}
              <div className="flex items-center gap-0">
                <button
                  onClick={onAddContact}
                  onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
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
            {hasPendingValues || hasConfirmedValues || hasActiveValues ? (
              <>
                {hasPendingValues && (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-amber-600 dark:text-amber-400 text-xs shrink-0">
                      Pending:
                    </span>
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
                    <span className="text-gray-500 dark:text-gray-400 text-xs shrink-0">
                      Active:
                    </span>
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
      <div className="mt-3 sm:mt-4 min-h-[200px] flex-1">
        <SortableContext items={contactIds} strategy={verticalListSortingStrategy}>
          <div className="w-full flex flex-col gap-2 sm:gap-3">
            {contacts.length === 0 ? (
              <div className="text-center py-8 text-design-text-muted">
                <p className="text-sm">No contacts</p>
              </div>
            ) : (
              contacts.map((contact: any) => (
                <PipelineContactCard
                  key={contact.id}
                  contact={contact}
                  status={status}
                  onClick={() => onContactClick && onContactClick(contact)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default React.memo(PipelineColumn);
