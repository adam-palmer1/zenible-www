import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  setError: _setError,
  setSuccessMessage: _setSuccessMessage,
  setShowUpdatePaymentModal,
  setShowCancelModal,
  handleReactivateSubscription,
  formatDate,
  fetchUserProfile: _fetchUserProfile,
}: SubscriptionSettingsTabProps) {
  const { darkMode } = usePreferences();
  const navigate = useNavigate();

  // Plan features state
  const [planFeatures, setPlanFeatures] = useState<any[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  // Fetch display features for the current plan
  useEffect(() => {
    const planId = currentSubscription?.plan?.id;
    if (planId) {
      fetchPlanFeatures(planId);
    }
  }, [currentSubscription?.plan?.id]);

  const fetchPlanFeatures = async (planId: string) => {
    try {
      setLoadingFeatures(true);
      const response = await planAPI.getPublicPlanDetails(planId) as { display_features?: any[] };
      setPlanFeatures(response.display_features || []);
    } catch (err) {
      console.error('Failed to fetch plan features:', err);
    } finally {
      setLoadingFeatures(false);
    }
  };

  const getFeatureText = (feature: any): string => {
    if (feature.custom_value) return String(feature.custom_value);
    if (feature.name) return String(feature.name);
    return '';
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

      {/* Your Plan */}
      <div className={`rounded-xl shadow-sm border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Your Plan
          </h2>
        </div>

        <div className="p-6">
          {currentSubscription && Object.keys(currentSubscription).length > 0 ? (
            <div>
              {/* Plan name and price */}
              <div className="flex items-baseline gap-3 mb-2">
                <h3 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                  {currentSubscription.plan?.name || 'Current Plan'}
                </h3>
                <span className={`text-lg font-medium ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                  ${parseFloat(currentSubscription.plan?.monthly_price).toFixed(2) || 'N/A'}/month
                </span>
              </div>

              {currentSubscription.plan?.description && (
                <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                  {currentSubscription.plan.description}
                </p>
              )}

              {/* Benefits list */}
              {loadingFeatures ? (
                <div className="flex items-center gap-2 py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zenible-primary"></div>
                  <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Loading features...</span>
                </div>
              ) : planFeatures.length > 0 ? (
                <ul className="space-y-2 mb-6">
                  {planFeatures
                    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                    .map((feature: any, index: number) => (
                      <li key={feature.id || index} className="flex items-start gap-2">
                        {feature.is_included !== false ? (
                          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        <span className={`text-sm ${
                          feature.is_included !== false
                            ? darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
                            : darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'
                        }`}>
                          {getFeatureText(feature)}
                        </span>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="mb-6" />
              )}

              {/* Change Plan link */}
              <button
                onClick={() => navigate('/pricing')}
                className={`text-sm font-medium ${
                  darkMode
                    ? 'text-zenible-primary hover:text-zenible-primary/80'
                    : 'text-zenible-primary hover:text-zenible-primary/80'
                } transition-colors`}
              >
                Change Plan &rarr;
              </button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className={`mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                You don't have an active plan yet.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="px-6 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 font-medium text-sm transition-colors"
              >
                View Plans
              </button>
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
