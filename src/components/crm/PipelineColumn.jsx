import React, { useState, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { PlusIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PipelineContactCard from './PipelineContactCard';
import ServiceValueDisplay from './ServiceValueDisplay';
import statusesAPI from '../../services/api/crm/statuses';
import { getStatusColor } from '../../utils/crm/statusUtils';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * Pipeline column component for Kanban view
 * Simplified - no longer needs action props (uses ContactActionsContext)
 */
const PipelineColumn = ({ status, contacts = [], onAddContact, onContactClick, totalVisibleColumns = 1, globalStatuses = [], customStatuses = [], onStatusUpdate, dragSourceColumnId = null }) => {
  const { showSuccess, showError } = useNotification();

  // Determine if this is a global or custom status
  const isGlobal = globalStatuses.some(s => s.id === status.id);

  // Use status friendly_name directly
  const displayName = status.friendly_name || status.name;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(displayName);
  const inputRef = useRef(null);

  // Calculate total value in this stage (separated one-off and recurring)
  const columnTotals = contacts.reduce((acc, contact) => {
    acc.oneOff += parseFloat(contact.one_off_total || 0);
    acc.recurring += parseFloat(contact.recurring_total || 0);
    return acc;
  }, { oneOff: 0, recurring: 0 });

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
    <div className="flex-1 min-w-[280px] sm:min-w-[320px] lg:min-w-0 transition-all duration-200">
      {/* Column Header - Figma Design */}
      <div className="p-3 w-full rounded-2xl bg-white border border-[#f4f4f5] transition-all duration-200">
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
          {/* Amount */}
          <div className="flex items-center justify-start text-xs sm:text-sm min-h-[20px]">
            {(columnTotals.oneOff > 0 || columnTotals.recurring > 0) ? (
              <ServiceValueDisplay
                oneOffTotal={columnTotals.oneOff}
                recurringTotal={columnTotals.recurring}
                currency={totalCurrency}
              />
            ) : (
              <span className="text-transparent select-none">-</span>
            )}
          </div>
        </>
      </div>

      {/* Contacts List */}
      <Droppable droppableId={status.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`mt-3 sm:mt-4 min-h-[100px] sm:min-h-32 transition-all duration-200 rounded-lg ${
              snapshot.isDraggingOver ? 'bg-brand-purple/10 shadow-[0_0_0_3px_rgba(138,43,225,0.3)]' : ''
            }`}
          >
            <div className="flex flex-col gap-2 sm:gap-3 w-full">
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-design-text-muted">
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
