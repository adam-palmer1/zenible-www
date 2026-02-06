import React, { useState, useCallback, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePreferences } from '../../../contexts/PreferencesContext';
import WidgetWrapper from './WidgetWrapper';
import WidgetSettingsModal from './WidgetSettingsModal';
import {
  WIDGET_REGISTRY,
  getWidgetDefaults,
  getDefaultWidgetSettings,
} from './WidgetRegistry';

// Item type for drag and drop
const WIDGET_ITEM_TYPE = 'DASHBOARD_WIDGET';

/**
 * DraggableWidget - Individual widget that can be dragged
 */
const DraggableWidget = ({ widget, index, moveWidget, onHide, onOpenSettings, getWidgetSize }) => {
  const ref = useRef(null);
  const config = WIDGET_REGISTRY[widget.id];
  const { width, height } = getWidgetSize(widget.id);

  // Drag source
  const [{ isDragging }, drag, preview] = useDrag({
    type: WIDGET_ITEM_TYPE,
    item: () => ({ id: widget.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Drop target
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: WIDGET_ITEM_TYPE,
    hover: (item, monitor) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Time to actually perform the action
      moveWidget(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  drag(drop(ref));

  // Determine grid span based on widget settings
  const getGridClass = () => {
    if (width >= 3) return 'col-span-1 md:col-span-2 lg:col-span-3';
    if (width >= 2) return 'col-span-1 md:col-span-2';
    return 'col-span-1';
  };

  // Determine row span based on widget height
  const getRowSpan = () => {
    if (height >= 3) return 'row-span-3';
    if (height >= 2) return 'row-span-2';
    return 'row-span-1';
  };

  // Get height class based on widget size
  const getHeightClass = () => {
    if (height >= 3) return 'min-h-[420px]';
    if (height >= 2) return 'min-h-[296px]';
    return 'min-h-[140px]';
  };

  return (
    <div
      ref={ref}
      className={`${getGridClass()} ${getRowSpan()} ${getHeightClass()} transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${isOver && canDrop ? 'ring-2 ring-[#8e51ff] ring-offset-2 rounded-xl' : ''}`}
    >
      <WidgetWrapper
        widgetId={widget.id}
        onHide={onHide}
        onOpenSettings={onOpenSettings}
        isDragging={isDragging}
      />
    </div>
  );
};

/**
 * WidgetGrid - The actual grid container
 */
const WidgetGrid = ({ onOpenCustomizer }) => {
  const { getPreference, updatePreference, initialized } = usePreferences();

  // State for settings modal
  const [settingsWidgetId, setSettingsWidgetId] = useState(null);

  // Get widget layout from preferences (v1 format without grid positions)
  const widgetLayout = getPreference('dashboard_widgets', {
    widgets: getWidgetDefaults(),
    version: 1,
  });

  // Get visible widgets
  const visibleWidgets = (widgetLayout.widgets || [])
    .filter(w => w.visible && WIDGET_REGISTRY[w.id]);

  // Get widget size from settings
  const getWidgetSize = useCallback((widgetId) => {
    const config = WIDGET_REGISTRY[widgetId];
    const defaults = getDefaultWidgetSettings(widgetId);
    const settings = getPreference(
      `dashboard_widget_settings_${widgetId}`,
      defaults
    );

    return {
      width: settings.widgetWidth ?? config?.defaultSize?.w ?? 1,
      height: settings.widgetHeight ?? config?.defaultSize?.h ?? 1,
    };
  }, [getPreference]);

  // Move widget to new position
  const moveWidget = useCallback((dragIndex, hoverIndex) => {
    const allWidgets = [...(widgetLayout.widgets || [])];
    const visibleIds = visibleWidgets.map(w => w.id);

    // Get the actual indices in the full widgets array
    const dragWidgetId = visibleIds[dragIndex];
    const hoverWidgetId = visibleIds[hoverIndex];

    const dragRealIndex = allWidgets.findIndex(w => w.id === dragWidgetId);
    const hoverRealIndex = allWidgets.findIndex(w => w.id === hoverWidgetId);

    if (dragRealIndex === -1 || hoverRealIndex === -1) return;

    // Remove the dragged item and insert it at the new position
    const [draggedItem] = allWidgets.splice(dragRealIndex, 1);

    // Adjust the insert index if we removed an item before it
    const adjustedHoverIndex = dragRealIndex < hoverRealIndex
      ? hoverRealIndex - 1
      : hoverRealIndex;

    allWidgets.splice(adjustedHoverIndex, 0, draggedItem);

    updatePreference('dashboard_widgets', {
      widgets: allWidgets,
      version: 1,
    }, 'dashboard');
  }, [widgetLayout, visibleWidgets, updatePreference]);

  // Handle hide widget
  const handleHideWidget = useCallback(async (widgetId) => {
    const updated = (widgetLayout.widgets || []).map(w =>
      w.id === widgetId ? { ...w, visible: false } : w
    );

    await updatePreference('dashboard_widgets', {
      widgets: updated,
      version: 1,
    }, 'dashboard');
  }, [widgetLayout, updatePreference]);

  // Handle open settings
  const handleOpenSettings = useCallback((widgetId) => {
    setSettingsWidgetId(widgetId);
  }, []);

  // Don't render until preferences are initialized
  if (!initialized) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[280px] bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (visibleWidgets.length === 0) {
    return (
      <div className="px-4 pb-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
          </div>
          <p className="text-gray-500 mb-2">No widgets to display</p>
          <button
            onClick={onOpenCustomizer}
            className="text-sm text-[#8e51ff] hover:text-[#7b3ff0] font-medium"
          >
            Customize your dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[140px]">
          {visibleWidgets.map((widget, index) => (
            <DraggableWidget
              key={widget.id}
              widget={widget}
              index={index}
              moveWidget={moveWidget}
              onHide={handleHideWidget}
              onOpenSettings={handleOpenSettings}
              getWidgetSize={getWidgetSize}
            />
          ))}
        </div>
      </div>

      {/* Widget Settings Modal */}
      <WidgetSettingsModal
        widgetId={settingsWidgetId}
        open={!!settingsWidgetId}
        onOpenChange={(open) => !open && setSettingsWidgetId(null)}
      />
    </>
  );
};

/**
 * SortableWidgetGrid - Wrapper with DndProvider
 */
const SortableWidgetGrid = ({ onOpenCustomizer }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <WidgetGrid onOpenCustomizer={onOpenCustomizer} />
    </DndProvider>
  );
};

export default SortableWidgetGrid;
