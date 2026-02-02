import React, { useState, useCallback } from 'react';
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
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { usePreferences } from '../../../contexts/PreferencesContext';
import WidgetWrapper from './WidgetWrapper';
import WidgetSettingsModal from './WidgetSettingsModal';
import { WIDGET_REGISTRY, getWidgetDefaults } from './WidgetRegistry';

/**
 * SortableWidgetGrid - Drag-and-drop enabled widget grid
 *
 * Uses @dnd-kit for drag and drop functionality
 * Persists widget order and visibility to user preferences
 */
const SortableWidgetGrid = ({ onOpenCustomizer }) => {
  const { getPreference, updatePreference, initialized } = usePreferences();

  // State for active drag
  const [activeId, setActiveId] = useState(null);

  // State for settings modal
  const [settingsWidgetId, setSettingsWidgetId] = useState(null);

  // Get widget layout from preferences
  const widgetLayout = getPreference('dashboard_widgets', {
    widgets: getWidgetDefaults(),
    version: 1,
  });

  // Configure sensors - require 8px movement before drag starts
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get visible widgets with their config
  const visibleWidgets = (widgetLayout.widgets || [])
    .filter(w => w.visible && WIDGET_REGISTRY[w.id])
    .map(w => ({
      ...w,
      config: WIDGET_REGISTRY[w.id],
    }));

  // Widget IDs for sortable context
  const widgetIds = visibleWidgets.map(w => w.id);

  // Handle drag start
  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

  // Handle drag end - reorder widgets
  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Get current widgets array
    const currentWidgets = [...(widgetLayout.widgets || [])];

    // Find indices
    const oldIndex = currentWidgets.findIndex(w => w.id === active.id);
    const newIndex = currentWidgets.findIndex(w => w.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(currentWidgets, oldIndex, newIndex);

      await updatePreference('dashboard_widgets', {
        widgets: reordered,
        version: 1,
      }, 'dashboard');
    }
  }, [widgetLayout, updatePreference]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

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

  // Active widget for drag overlay
  const activeWidget = activeId
    ? visibleWidgets.find(w => w.id === activeId)
    : null;

  // Don't render until preferences are initialized
  if (!initialized) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[246px] bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 pb-4">
            {visibleWidgets.map(widget => (
              <WidgetWrapper
                key={widget.id}
                widgetId={widget.id}
                onHide={handleHideWidget}
                onOpenSettings={handleOpenSettings}
              />
            ))}

            {/* Empty state when no widgets visible */}
            {visibleWidgets.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
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
            )}
          </div>
        </SortableContext>

        {/* Drag overlay for visual feedback */}
        <DragOverlay dropAnimation={null}>
          {activeWidget && (
            <WidgetWrapper
              widgetId={activeWidget.id}
              isDragOverlay
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Widget Settings Modal */}
      <WidgetSettingsModal
        widgetId={settingsWidgetId}
        open={!!settingsWidgetId}
        onOpenChange={(open) => !open && setSettingsWidgetId(null)}
      />
    </>
  );
};

export default SortableWidgetGrid;
