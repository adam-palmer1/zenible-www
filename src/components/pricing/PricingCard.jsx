import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PricingCard({
  plan,
  currentPlan,
  isAuthenticated,
  onUpgrade,
  onDowngrade,
  onSubscribe,
  billingCycle = 'monthly',
  isPopular = false
}) {
  const navigate = useNavigate();
  const isCurrentPlan = currentPlan?.plan_id === plan.id;
  const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
  const isFreePlan = parseFloat(price) === 0;

  // Determine if this is an upgrade or downgrade relative to current plan
  const isUpgrade = currentPlan && !isCurrentPlan && parseFloat(price) > parseFloat(
    billingCycle === 'monthly' ? currentPlan.plan?.monthly_price : currentPlan.plan?.annual_price
  );
  const isDowngrade = currentPlan && !isCurrentPlan && parseFloat(price) < parseFloat(
    billingCycle === 'monthly' ? currentPlan.plan?.monthly_price : currentPlan.plan?.annual_price
  );

  const handleAction = () => {
    if (!isAuthenticated) {
      // Redirect to sign-in with return URL
      navigate('/signin?redirect=/pricing');
    } else if (isCurrentPlan) {
      // No action for current plan
      return;
    } else if (!currentPlan) {
      // New subscription
      onSubscribe(plan.id, billingCycle);
    } else if (isUpgrade) {
      onUpgrade(plan.id);
    } else if (isDowngrade) {
      onDowngrade(plan.id);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (!isAuthenticated) return 'Get Started';
    if (!currentPlan) return 'Subscribe';
    if (isUpgrade) return 'Upgrade';
    if (isDowngrade) return 'Downgrade';
    return 'Select';
  };

  const getButtonClass = () => {
    if (isCurrentPlan) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    if (isUpgrade) {
      return 'bg-zenible-primary text-white hover:bg-zenible-primary-dark';
    }
    if (isDowngrade) {
      return 'bg-orange-500 text-white hover:bg-orange-600';
    }
    return 'bg-zenible-primary text-white hover:bg-zenible-primary-dark';
  };

  return (
    <div className={`relative rounded-2xl border-2 p-8 shadow-lg transition-all hover:shadow-xl ${
      isCurrentPlan ? 'border-zenible-primary bg-purple-50 dark:bg-purple-900/20' :
      isPopular ? 'border-purple-400' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Popular Badge */}
      {isPopular && !isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-zenible-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
            Your Current Plan
          </span>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {plan.name}
        </h3>
        {plan.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {plan.description}
          </p>
        )}
      </div>

      {/* Pricing */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center">
          {isFreePlan ? (
            <span className="text-5xl font-bold text-gray-900 dark:text-white">Free</span>
          ) : (
            <>
              <span className="text-2xl font-semibold text-gray-500 dark:text-gray-400">$</span>
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                {price ? parseFloat(price).toFixed(2).replace(/\.00$/, '') : '0'}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
            </>
          )}
        </div>
        {billingCycle === 'annual' && plan.annual_savings && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            Save ${parseFloat(plan.annual_savings).toFixed(2)} annually
          </p>
        )}
      </div>

      {/* Features List */}
      {plan.display_features && plan.display_features.length > 0 && (
        <div className="mb-8">
          <ul className="space-y-3">
            {plan.display_features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className={`mr-2 mt-0.5 ${
                  feature.is_included ? 'text-green-500' : 'text-red-500'
                }`}>
                  {feature.is_included ? '✓' : '✗'}
                </span>
                <span className={`text-sm ${
                  feature.is_included
                    ? 'text-gray-700 dark:text-gray-300'
                    : 'text-gray-400 dark:text-gray-500 line-through'
                }`}>
                  {feature.custom_value || feature.feature?.name || feature.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* API Limits */}
      {plan.api_call_limit && (
        <div className="mb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            API Calls: <span className="font-semibold text-gray-900 dark:text-white">
              {plan.api_call_limit === -1 ? 'Unlimited' : plan.api_call_limit.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleAction}
        disabled={isCurrentPlan}
        className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${getButtonClass()}`}
      >
        {getButtonText()}
      </button>

      {/* Additional Info for Current Plan */}
      {isCurrentPlan && currentPlan && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {currentPlan.status === 'active' && currentPlan.current_period_end && (
            <p>Renews on {new Date(currentPlan.current_period_end).toLocaleDateString()}</p>
          )}
          {currentPlan.status === 'canceled' && (
            <p className="text-orange-600 dark:text-orange-400">
              Cancels on {new Date(currentPlan.current_period_end).toLocaleDateString()}
            </p>
          )}
          {currentPlan.status === 'trialing' && currentPlan.trial_end && (
            <p className="text-blue-600 dark:text-blue-400">
              Trial ends on {new Date(currentPlan.trial_end).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}