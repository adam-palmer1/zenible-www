import React from 'react';
import { ICON_OPTIONS, getIconPath } from '../../../utils/iconUtils';
import { QuizTag, Plan, TagFormState } from './types';

interface TagFormModalProps {
  darkMode: boolean;
  editingTag: QuizTag | null;
  tagForm: TagFormState;
  setTagForm: (form: TagFormState) => void;
  showIconDropdown: boolean;
  setShowIconDropdown: (show: boolean) => void;
  plans: Plan[];
  onSave: () => void;
  onClose: () => void;
}

export default function TagFormModal({
  darkMode,
  editingTag,
  tagForm,
  setTagForm,
  showIconDropdown,
  setShowIconDropdown,
  plans,
  onSave,
  onClose,
}: TagFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-2xl mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            {editingTag ? 'Edit Quiz Tag' : 'Create Quiz Tag'}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Name *
            </label>
            <input
              type="text"
              value={tagForm.name}
              onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder="Enter tag name..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              value={tagForm.description}
              onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder="Enter tag description..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Icon *
            </label>
            <div className="relative icon-dropdown-container">
              <button
                type="button"
                onClick={() => setShowIconDropdown(!showIconDropdown)}
                className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              >
                <div className="flex items-center gap-2">
                  {tagForm.icon ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tagForm.icon)} />
                      </svg>
                      <span>{ICON_OPTIONS.find((opt: { value: string; label: string }) => opt.value === tagForm.icon)?.label || 'Selected icon'}</span>
                    </>
                  ) : (
                    <span className={darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}>Select an icon...</span>
                  )}
                </div>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showIconDropdown && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-64 overflow-y-auto ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  {ICON_OPTIONS.map((option: { value: string; label: string }) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setTagForm({ ...tagForm, icon: option.value });
                        setShowIconDropdown(false);
                      }}
                      className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-opacity-50 transition-colors ${
                        tagForm.icon === option.value
                          ? darkMode ? 'bg-zenible-primary bg-opacity-20' : 'bg-blue-50'
                          : darkMode ? 'hover:bg-zenible-dark-border' : 'hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(option.value)} />
                      </svg>
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Choose a Heroicon for this quiz tag
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Associated Plans
            </label>
            <p className={`text-xs mb-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Hold Ctrl (Cmd on Mac) to select multiple plans
            </p>
            <select
              multiple
              size={5}
              value={tagForm.subscription_plan_ids}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setTagForm({ ...tagForm, subscription_plan_ids: selected });
              }}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
            >
              {plans.map((plan: Plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={tagForm.is_active}
              onChange={(e) => setTagForm({ ...tagForm, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Active
            </label>
          </div>
        </div>
        <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <button
            onClick={onSave}
            disabled={!tagForm.name || !tagForm.icon}
            className={`px-4 py-2 rounded-lg ${
              tagForm.name && tagForm.icon
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {editingTag ? 'Update' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
