import React, { useState, useEffect } from 'react';
import Modal from '../../ui/modal/Modal';
import {
  WIDGET_REGISTRY,
  WIDGET_CATEGORIES,
  getWidgetDefaults,
  getWidgetsByCategory,
} from './WidgetRegistry';
import { usePreferences } from '../../../contexts/PreferencesContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface WidgetItem {
  id: string;
  visible: boolean;
}

interface WidgetCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * WidgetCustomizer - Modal for managing dashboard widget visibility
 *
 * Features:
 * - Toggle widget visibility
 * - Widgets grouped by category
 * - Reset to defaults option
 */
const WidgetCustomizer = ({ open, onOpenChange }: WidgetCustomizerProps) => {
  const { getPreference, updatePreference } = usePreferences() as any;
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [saving, setSaving] = useState(false);

  // Load current widget layout when modal opens
  useEffect(() => {
    if (open) {
      const layout = getPreference('dashboard_widgets', {
        widgets: getWidgetDefaults(),
        version: 1,
      });
      setWidgets(layout.widgets || getWidgetDefaults());
    }
  }, [open, getPreference]);

  // Get visibility state for a widget
  const isWidgetVisible = (widgetId: string): boolean => {
    const widget = widgets.find(w => w.id === widgetId);
    return widget?.visible ?? WIDGET_REGISTRY[widgetId]?.defaultVisible ?? false;
  };

  // Toggle widget visibility
  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => {
      const exists = prev.find(w => w.id === widgetId);
      if (exists) {
        return prev.map(w =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w
        );
      }
      // Widget not in array yet, add it
      return [...prev, { id: widgetId, visible: true }];
    });
  };

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreference('dashboard_widgets', {
        widgets,
        version: 1,
      }, 'dashboard');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save widget preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setWidgets(getWidgetDefaults());
  };

  // Get widgets by category
  const widgetsByCategory = getWidgetsByCategory();

  // Sort categories by order
  const sortedCategories = Object.entries(WIDGET_CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key]) => key);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Customize Dashboard"
      description="Choose which widgets to display on your dashboard"
      size="lg"
    >
      <div className="space-y-6">
        {sortedCategories.map(categoryKey => {
          const category = WIDGET_CATEGORIES[categoryKey];
          const categoryWidgets = widgetsByCategory[categoryKey] || [];

          if (categoryWidgets.length === 0) return null;

          return (
            <div key={categoryKey}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {category.name}
              </h3>
              <div className="space-y-2">
                {categoryWidgets.map(widget => {
                  const isVisible = isWidgetVisible(widget.id);

                  return (
                    <button
                      key={widget.id}
                      onClick={() => toggleWidget(widget.id)}
                      className={`
                        w-full flex items-center justify-between p-3 rounded-lg border transition-all
                        ${isVisible
                          ? 'bg-purple-50 border-[#8e51ff] text-gray-900'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isVisible ? 'text-gray-900' : 'text-gray-700'}`}>
                          {widget.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {widget.description}
                        </p>
                      </div>

                      <div className={`
                        ml-4 p-2 rounded-lg transition-colors
                        ${isVisible
                          ? 'bg-[#8e51ff] text-white'
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}>
                        {isVisible ? (
                          <EyeIcon className="w-5 h-5" />
                        ) : (
                          <EyeSlashIcon className="w-5 h-5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Reset to defaults
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7b3ff0] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default WidgetCustomizer;
