import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { adminSubscriptionsAPI } from '../../../services/adminAPI';
import Combobox from '../../ui/combobox/Combobox';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface ChangePlanModalProps {
  subscription: {
    id: string;
    plan?: { id: string; name: string; monthly_price?: number } | null;
    billing_cycle: string;
    user_name?: string | null;
    user_email?: string | null;
  };
  plans: { id: string; name: string; monthly_price?: number }[];
  onClose: () => void;
  onSuccess: () => void;
}

const ChangePlanModal: React.FC<ChangePlanModalProps> = ({
  subscription,
  plans,
  onClose,
  onSuccess,
}) => {
  useEscapeKey(onClose);

  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availablePlans = plans.filter(p => p.id !== subscription.plan?.id);
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const handleConfirm = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    setError(null);
    try {
      await adminSubscriptionsAPI.changeSubscription(subscription.id, { new_plan_id: selectedPlanId });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to change plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="w-full max-w-md mx-2 sm:mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Change Plan</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Current Plan Info */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Current Plan</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {subscription.plan?.name || 'N/A'} — ${subscription.plan?.monthly_price || 'N/A'}/mo ({subscription.billing_cycle})
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {subscription.user_name || subscription.user_email || ''}
            </p>
          </div>

          {/* Plan Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Plan
            </label>
            <Combobox
              options={availablePlans.map((plan) => ({ id: plan.id, label: `${plan.name} — $${plan.monthly_price || 0}/mo` }))}
              value={selectedPlanId}
              onChange={(value) => setSelectedPlanId(value)}
              disabled={loading}
              placeholder="Select a plan..."
              allowClear={false}
            />
          </div>

          {selectedPlan && (
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Changing to <strong>{selectedPlan.name}</strong> at ${selectedPlan.monthly_price || 0}/mo. This takes effect immediately.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedPlanId}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Changing...
              </>
            ) : (
              'Confirm Change'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePlanModal;
