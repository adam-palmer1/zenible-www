import React from 'react';
import { getIconPath } from '../../../utils/iconUtils';
import { QuizTag, Plan, BulkUpdateFormState, BulkUpdateResult } from './types';

interface BulkUpdateModalProps {
  darkMode: boolean;
  selectedTagIds: string[];
  tags: QuizTag[];
  plans: Plan[];
  applyStatusChange: boolean;
  setApplyStatusChange: (value: boolean) => void;
  applyPlanChange: boolean;
  setApplyPlanChange: (value: boolean) => void;
  bulkUpdateForm: BulkUpdateFormState;
  setBulkUpdateForm: (form: BulkUpdateFormState) => void;
  bulkUpdateResult: BulkUpdateResult | null;
  onBulkUpdate: () => void;
  onClose: () => void;
}

export default function BulkUpdateModal({
  darkMode,
  selectedTagIds,
  tags,
  plans,
  applyStatusChange,
  setApplyStatusChange,
  applyPlanChange,
  setApplyPlanChange,
  bulkUpdateForm,
  setBulkUpdateForm,
  bulkUpdateResult,
  onBulkUpdate,
  onClose,
}: BulkUpdateModalProps) {
  const getSelectedTags = () => {
    return tags.filter((tag: QuizTag) => selectedTagIds.includes(tag.id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className={`w-full max-w-2xl mx-4 my-8 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Bulk Update Quiz Tags ({selectedTagIds.length} selected)
          </h3>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status Update Section */}
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="apply_status"
                checked={applyStatusChange}
                onChange={(e) => setApplyStatusChange(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="apply_status" className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Update Status
              </label>
            </div>
            {applyStatusChange && (
              <div className="flex gap-4 ml-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    checked={bulkUpdateForm.is_active === true}
                    onChange={() => setBulkUpdateForm({ ...bulkUpdateForm, is_active: true })}
                    className="rounded-full"
                  />
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    checked={bulkUpdateForm.is_active === false}
                    onChange={() => setBulkUpdateForm({ ...bulkUpdateForm, is_active: false })}
                    className="rounded-full"
                  />
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>Inactive</span>
                </label>
              </div>
            )}
          </div>

          {/* Plans Update Section */}
          <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="apply_plans"
                checked={applyPlanChange}
                onChange={(e) => setApplyPlanChange(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="apply_plans" className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Update Associated Plans
              </label>
            </div>
            {applyPlanChange && (
              <div className="ml-6 space-y-2">
                <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Hold Ctrl (Cmd on Mac) to select multiple plans. This will replace existing plan assignments.
                </p>
                <select
                  multiple
                  size={5}
                  value={bulkUpdateForm.subscription_plan_ids}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setBulkUpdateForm({ ...bulkUpdateForm, subscription_plan_ids: selected });
                  }}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-gray-300'}`}
                >
                  {plans.map((plan: Plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Selected Tags Preview */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Selected Tags ({selectedTagIds.length}):
            </label>
            <div className={`p-3 rounded-lg border max-h-40 overflow-y-auto ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'}`}>
              <ul className="space-y-1">
                {getSelectedTags().slice(0, 10).map((tag: QuizTag) => (
                  <li key={tag.id} className={`text-sm flex items-center gap-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon ?? 'book-open')} />
                    </svg>
                    {tag.name}
                  </li>
                ))}
                {selectedTagIds.length > 10 && (
                  <li className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    + {selectedTagIds.length - 10} more
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Bulk Update Results */}
          {bulkUpdateResult && (
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-white border-gray-300'}`}>
              <h5 className={`font-medium text-sm mb-3 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Update Results
              </h5>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Total:
                  </p>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {bulkUpdateResult.total_submitted}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Successful:
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    {bulkUpdateResult.successful}
                  </p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Failed:
                  </p>
                  <p className="text-lg font-semibold text-red-600">
                    {bulkUpdateResult.failed}
                  </p>
                </div>
              </div>

              {/* Failed Tags */}
              {bulkUpdateResult.failed > 0 && (
                <div className={`p-3 rounded border ${darkMode ? 'bg-red-900 bg-opacity-20 border-red-800' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-xs font-medium mb-2 ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                    Failed Updates:
                  </p>
                  <ul className="space-y-1">
                    {bulkUpdateResult.results
                      .filter((r: { tag_id: string; success: boolean; error?: string }) => !r.success)
                      .map((result: { tag_id: string; success: boolean; error?: string }) => {
                        const tag = tags.find((t: QuizTag) => t.id === result.tag_id);
                        return (
                          <li key={result.tag_id} className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                            {tag ? tag.name : result.tag_id}: {result.error}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}

              {/* Success Message */}
              {bulkUpdateResult.failed === 0 && (
                <div className={`p-3 rounded border ${darkMode ? 'bg-green-900 bg-opacity-20 border-green-800' : 'bg-green-50 border-green-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-800'}`}>
                    All tags updated successfully! Closing...
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <button
            onClick={onBulkUpdate}
            disabled={(!applyStatusChange && !applyPlanChange) || bulkUpdateResult?.failed === 0}
            className={`px-4 py-2 rounded-lg ${
              (applyStatusChange || applyPlanChange) && bulkUpdateResult?.failed !== 0
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Update Tags
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            {bulkUpdateResult ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
