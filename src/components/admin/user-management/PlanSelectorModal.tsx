import React, { useState, useEffect } from 'react';
import { X, Check, Search, Shield } from 'lucide-react';
import { PlanSelectorModalProps, AdminPlan } from './types';

/**
 * Plan Selection Modal - Full screen centered modal
 */
const PlanSelectorModal: React.FC<PlanSelectorModalProps> = ({ isOpen, onClose, plans, selectedPlanId, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlans = [{ id: '', name: 'No Plan', monthly_price: 0 }, ...plans].filter((plan: AdminPlan) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return plan.name.toLowerCase().includes(query);
  });

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Plan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
        </div>

        {/* Plan List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPlans.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">No plans found</div>
          ) : (
            <div className="py-2">
              {filteredPlans.map((plan: AdminPlan) => (
                <button
                  key={plan.id || 'none'}
                  onClick={() => { onSelect(plan.id); onClose(); }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors ${
                    plan.id === selectedPlanId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{plan.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {plan.id ? `$${plan.monthly_price}/month` : 'Remove current plan'}
                    </div>
                  </div>
                  {plan.id === selectedPlanId && <Check className="h-5 w-5 text-purple-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanSelectorModal;
