import React, { useState, useEffect } from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import planAPI from '../../services/planAPI';
import UsageDashboard from '../UsageDashboard';
import PaymentHistory from '../PaymentHistory';

interface SubscriptionSettingsTabProps {
  currentSubscription: any;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  setShowUpdatePaymentModal: (show: boolean) => void;
  setShowCancelModal: (show: boolean) => void;
  handleReactivateSubscription: () => Promise<void>;
  formatDate: (dateString: string) => string;
  fetchUserProfile: () => Promise<void>;
}

export default function SubscriptionSettingsTab({
  currentSubscription,
  saving,
  setSaving: _setSaving,
  setError,
  setSuccessMessage,
  setShowUpdatePaymentModal,
  setShowCancelModal,
  handleReactivateSubscription,
  formatDate,
  fetchUserProfile,
}: SubscriptionSettingsTabProps) {
  const { darkMode } = usePreferences();

  // Plan selection state
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  // Fetch available plans when component mounts
  useEffect(() => {
    if (availablePlans.length === 0) {
      fetchAvailablePlans();
    }
  }, []);

  const fetchAvailablePlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await planAPI.getPublicPlans() as { plans?: any[]; items?: any[] } | any[];
      // API returns { plans: [...], total, page, ... }
      const plansArray = (Array.isArray(response) ? response : (response.plans || response.items)) || [];
      // Sort plans by price (lowest first) and filter active ones
      const sortedPlans = plansArray
        .filter(plan => plan.is_active !== false)
        .sort((a, b) => (parseFloat(a.monthly_price) || 0) - (parseFloat(b.monthly_price) || 0));
      setAvailablePlans(sortedPlans);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (subscribing) return;

    try {
      setSubscribing(true);
      setSelectedPlanId(planId);
      setError(null);

      // Check if user has an existing subscription
      if (currentSubscription && Object.keys(currentSubscription).length > 0) {
        // Find the selected plan to determine if it's an upgrade or downgrade
        const selectedPlan = availablePlans.find(p => p.id === planId);
        const currentPrice = parseFloat(currentSubscription.plan?.monthly_price) || 0;
        const newPrice = parseFloat(selectedPlan?.monthly_price) || 0;

        if (newPrice > currentPrice) {
          // Upgrade - change immediately
          await planAPI.upgradeSubscription(planId, true);
          setSuccessMessage('Subscription upgraded successfully!');
        } else {
          // Downgrade - change at period end
          await planAPI.downgradeSubscription(planId, true);
          setSuccessMessage('Subscription will be changed at the end of your billing period.');
        }
      } else {
        // New subscription
        await planAPI.createSubscription(planId, 'monthly');
        setSuccessMessage('Subscription created successfully!');
      }

      // Refresh subscription data
      await fetchUserProfile();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update subscription');
    } finally {
      setSubscribing(false);
      setSelectedPlanId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Management */}
      {currentSubscription && Object.keys(currentSubscription).length > 0 && (
        <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Current Subscription
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Subscription Details */}
            <div className={`p-4 rounded-lg border ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {currentSubscription.plan?.name || 'Current Plan'}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    {currentSubscription.plan?.description || 'Subscription plan'}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentSubscription.cancel_at_period_end
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : currentSubscription.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : currentSubscription.status === 'canceled'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {currentSubscription.cancel_at_period_end
                    ? 'Pending Cancellation'
                    : currentSubscription.status === 'active'
                    ? 'Active'
                    : currentSubscription.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Price:
                  </span>
                  <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    ${parseFloat(currentSubscription.plan?.monthly_price).toFixed(2) || 'N/A'}/month
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Started:
                  </span>
                  <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    {currentSubscription.created_at ? formatDate(currentSubscription.created_at) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    {currentSubscription.cancel_at_period_end ? 'Subscription ends:' : 'Next billing:'}
                  </span>
                  <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    {currentSubscription.current_period_end ? formatDate(currentSubscription.current_period_end) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                    Subscription ID:
                  </span>
                  <span className={`ml-2 text-xs font-mono ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    {currentSubscription.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Management */}
            {(currentSubscription.status === 'active' || currentSubscription.status === 'trialing' || currentSubscription.status === 'past_due') && (
              <div className={`p-4 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border'
                  : 'bg-purple-50 border-purple-200'
              }`}>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-purple-800'}`}>
                  Payment Method
                </h4>
                <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-purple-600'}`}>
                  Click here to update your payment card details.
                </p>
                <button
                  onClick={() => setShowUpdatePaymentModal(true)}
                  className={`px-4 py-2 border rounded-lg font-medium ${
                    darkMode
                      ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                      : 'border-purple-300 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  Update Payment Method
                </button>
              </div>
            )}

            {/* Pending Cancellation Notice */}
            {currentSubscription.cancel_at_period_end && (
              <div className={`p-4 rounded-lg border border-yellow-200 ${
                darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
              }`}>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  Subscription Scheduled for Cancellation
                </h4>
                <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  Your subscription will end on {currentSubscription.current_period_end ? formatDate(currentSubscription.current_period_end) : 'N/A'}.
                  You'll continue to have access to all features until then.
                </p>
                {currentSubscription.cancel_at && (
                  <p className={`text-sm mt-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                    Cancellation requested on {formatDate(currentSubscription.cancel_at)}
                  </p>
                )}
                <button
                  onClick={handleReactivateSubscription}
                  disabled={saving}
                  className={`mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                    saving ? 'cursor-wait' : ''
                  }`}
                >
                  {saving ? 'Processing...' : 'Reactivate Subscription'}
                </button>
              </div>
            )}

            {/* Actions */}
            {currentSubscription.status === 'active' && !currentSubscription.cancel_at_period_end && (
              <div className={`p-4 rounded-lg border border-red-200 ${
                darkMode ? 'bg-red-900/20' : 'bg-red-50'
              }`}>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                  Cancel Subscription
                </h4>
                <p className={`text-sm mb-4 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                  If you cancel your subscription, you'll continue to have access to all features until the end of your current billing period.
                </p>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            {currentSubscription && Object.keys(currentSubscription).length > 0 ? 'Change Plan' : 'Select a Plan'}
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Choose the plan that best fits your needs
          </p>
        </div>

        <div className="p-6">
          {loadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
            </div>
          ) : availablePlans.length === 0 ? (
            <p className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              No plans available at the moment.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availablePlans.map((plan) => {
                const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
                const isSelecting = subscribing && selectedPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`relative p-5 rounded-xl border-2 transition-all ${
                      isCurrentPlan
                        ? darkMode
                          ? 'border-zenible-primary bg-zenible-primary/10'
                          : 'border-zenible-primary bg-purple-50'
                        : darkMode
                          ? 'border-zenible-dark-border hover:border-zenible-primary/50 bg-zenible-dark-bg'
                          : 'border-gray-200 hover:border-zenible-primary/50 bg-gray-50'
                    }`}
                  >
                    {isCurrentPlan && (
                      <span className="absolute -top-3 left-4 px-2 py-0.5 text-xs font-medium bg-zenible-primary text-white rounded-full">
                        Current Plan
                      </span>
                    )}

                    <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>

                    <div className="mb-3">
                      <span className={`text-2xl font-bold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        ${(parseFloat(plan.monthly_price) || 0).toFixed(2)}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        /month
                      </span>
                    </div>

                    {plan.description && (
                      <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                        {plan.description}
                      </p>
                    )}

                    <button
                      onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)}
                      disabled={isCurrentPlan || subscribing}
                      className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                        isCurrentPlan
                          ? darkMode
                            ? 'bg-zenible-dark-border text-zenible-dark-text-secondary cursor-not-allowed'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-zenible-primary text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isSelecting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : currentSubscription && Object.keys(currentSubscription).length > 0 ? (
                        (parseFloat(plan.monthly_price) || 0) > (parseFloat(currentSubscription.plan?.monthly_price) || 0) ? 'Upgrade' : 'Switch Plan'
                      ) : (
                        'Select Plan'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Usage Dashboard */}
      <UsageDashboard />

      {/* Payment History */}
      <PaymentHistory />
    </div>
  );
}
