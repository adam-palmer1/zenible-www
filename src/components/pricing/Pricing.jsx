import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import planAPI from '../../services/planAPI';
import PricingCard from './PricingCard';

export default function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch public plans
      const plansResponse = await planAPI.getPublicPlans();
      const activePlans = (plansResponse.plans || [])
        .filter(plan => plan.is_active)
        .sort((a, b) => parseFloat(a.monthly_price) - parseFloat(b.monthly_price));

      // Fetch plan features for each plan
      const plansWithFeatures = await Promise.all(
        activePlans.map(async (plan) => {
          try {
            const featuresResponse = await planAPI.getPlanWithFeatures(plan.id);
            return {
              ...plan,
              display_features: featuresResponse.display_features || [],
              system_features: featuresResponse.system_features || [],
            };
          } catch (err) {
            // If features fail to load, just use the plan without features
            return plan;
          }
        })
      );

      setPlans(plansWithFeatures);

      // If user is authenticated, fetch their subscription
      if (user) {
        try {
          const subscription = await planAPI.getCurrentSubscription();
          setCurrentSubscription(subscription);
        } catch (err) {
          console.error('Failed to fetch subscription:', err);
        }
      }
    } catch (err) {
      setError('Failed to load pricing plans. Please try again later.');
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId, billingCycle) => {
    if (!user) {
      navigate(`/signin?redirect=/pricing&plan=${planId}&billing=${billingCycle}`);
      return;
    }

    setProcessingAction(true);
    try {
      await planAPI.createSubscription(planId, billingCycle);
      alert('Subscription created successfully!');
      await fetchData(); // Refresh data
    } catch (err) {
      alert(`Failed to create subscription: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpgrade = async (planId) => {
    if (!confirm('Are you sure you want to upgrade your plan? Changes will take effect immediately.')) {
      return;
    }

    setProcessingAction(true);
    try {
      await planAPI.upgradeSubscription(planId, true);
      alert('Plan upgraded successfully!');
      await fetchData(); // Refresh data
    } catch (err) {
      alert(`Failed to upgrade plan: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDowngrade = async (planId) => {
    if (!confirm('Are you sure you want to downgrade your plan? The change will take effect at the end of your current billing period.')) {
      return;
    }

    setProcessingAction(true);
    try {
      await planAPI.downgradeSubscription(planId, true);
      alert('Plan downgrade scheduled for the end of your billing period.');
      await fetchData(); // Refresh data
    } catch (err) {
      alert(`Failed to downgrade plan: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  // Determine which plan should be marked as popular
  const getPopularPlanIndex = () => {
    if (plans.length === 0) return -1;
    if (plans.length === 1) return 0;
    if (plans.length === 2) return 1;
    // For 3 or more plans, mark the middle one or second one as popular
    return Math.floor(plans.length / 2);
  };

  const popularPlanIndex = getPopularPlanIndex();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zenible-dark-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zenible-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-6 py-2 bg-zenible-primary text-white rounded-lg hover:bg-zenible-primary-dark"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zenible-dark-bg">
      {/* Header */}
      <div className="bg-white dark:bg-zenible-dark-card border-b border-gray-200 dark:border-zenible-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            {user && currentSubscription && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current plan: <span className="font-semibold text-zenible-primary">{currentSubscription.plan?.name}</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Select the perfect plan for your needs. Upgrade or downgrade anytime.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center mb-8">
              <span className={`mr-3 ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none bg-gray-200 dark:bg-gray-700 transition-colors"
                disabled={processingAction}
              >
                <span
                  className={`inline-block w-4 h-4 transform transition-transform bg-zenible-primary rounded-full ${
                    billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`ml-3 ${billingCycle === 'annual' ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500'}`}>
                Annual
                <span className="ml-1 text-green-600 dark:text-green-400 text-sm">(Save up to 20%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {plans.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">
            No pricing plans available at the moment.
          </div>
        ) : (
          <div className={`grid gap-8 ${
            plans.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
            plans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
            'md:grid-cols-3'
          }`}>
            {plans.map((plan, index) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                currentPlan={currentSubscription}
                isAuthenticated={!!user}
                onUpgrade={handleUpgrade}
                onDowngrade={handleDowngrade}
                onSubscribe={handleSubscribe}
                billingCycle={billingCycle}
                isPopular={index === popularPlanIndex}
              />
            ))}
          </div>
        )}
      </div>

      {/* Feature Comparison Table */}
      {plans.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-zenible-dark-card rounded-lg overflow-hidden shadow-lg">
              <thead className="bg-gray-50 dark:bg-zenible-dark-sidebar">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Feature
                  </th>
                  {plans.map(plan => (
                    <th key={plan.id} className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                      {currentSubscription?.plan_id === plan.id && (
                        <span className="ml-2 text-xs bg-zenible-primary text-white px-2 py-1 rounded-full">
                          Current
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-zenible-dark-border">
                {/* Collect all unique features */}
                {(() => {
                  const allFeatures = new Map();
                  plans.forEach(plan => {
                    if (plan.display_features) {
                      plan.display_features.forEach(df => {
                        const featureName = df.feature?.name || df.name;
                        if (featureName && !allFeatures.has(featureName)) {
                          allFeatures.set(featureName, true);
                        }
                      });
                    }
                  });

                  return Array.from(allFeatures.keys()).map(featureName => (
                    <tr key={featureName}>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {featureName}
                      </td>
                      {plans.map(plan => {
                        const feature = plan.display_features?.find(
                          df => (df.feature?.name || df.name) === featureName
                        );
                        return (
                          <td key={plan.id} className="px-6 py-4 text-center">
                            {feature ? (
                              feature.is_included ? (
                                <span className="text-green-600 dark:text-green-400">
                                  {feature.custom_value || '✓'}
                                </span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400">✗</span>
                              )
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}

                {/* API Call Limits */}
                <tr>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    API Call Limit
                  </td>
                  {plans.map(plan => (
                    <td key={plan.id} className="px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                      {plan.api_call_limit === -1 || !plan.api_call_limit
                        ? 'Unlimited'
                        : plan.api_call_limit.toLocaleString()}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="bg-white dark:bg-zenible-dark-card border-t border-gray-200 dark:border-zenible-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need help choosing?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Contact our sales team for personalized recommendations
            </p>
            <button
              onClick={() => window.location.href = 'mailto:sales@zenible.com'}
              className="px-6 py-2 border border-zenible-primary text-zenible-primary rounded-lg hover:bg-zenible-primary hover:text-white transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}