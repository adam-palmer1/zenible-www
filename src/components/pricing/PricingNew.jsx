import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../../contexts/PreferencesContext';
import planAPI from '../../services/planAPI';
import StripePaymentModal from '../StripePaymentModal';
import SubscriptionSuccessModal from '../SubscriptionSuccessModal';
import tickSquare from '../../assets/icons/tick-square-purple.svg';
import crossSquare from '../../assets/icons/cross-square-gray.svg';

export default function PricingNew() {
  const { user, checkAuth } = useAuth();
  const { darkMode } = usePreferences();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [hasAnnualPricing, setHasAnnualPricing] = useState(false);
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    planId: null,
    planName: '',
    price: '',
    billingCycle: 'monthly'
  });
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    planName: '',
    price: '',
    billingCycle: 'monthly'
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch public plans
      const plansResponse = await planAPI.getPublicPlans();
      const activePlans = (plansResponse.plans || plansResponse.items || [])
        .filter(plan => plan.is_active && plan.monthly_price !== null)
        .sort((a, b) => parseFloat(a.monthly_price) - parseFloat(b.monthly_price));

      // Fetch plan features for each plan
      const plansWithFeatures = await Promise.all(
        activePlans.map(async (plan) => {
          try {
            const featuresResponse = await planAPI.getPlanWithFeatures(plan.id);
            return {
              ...plan,
              display_features: featuresResponse.display_features || plan.display_features || [],
              system_features: featuresResponse.system_features || plan.system_features || [],
            };
          } catch (err) {
            // If features endpoint fails, use features from plan if available
            return {
              ...plan,
              display_features: plan.display_features || [],
              system_features: plan.system_features || [],
            };
          }
        })
      );

      setPlans(plansWithFeatures);

      // Check if any plan has annual pricing
      const anyAnnualPricing = plansWithFeatures.some(plan => plan.annual_price !== null);
      setHasAnnualPricing(anyAnnualPricing);

      // If no annual pricing, ensure we're on monthly
      if (!anyAnnualPricing) {
        setBillingCycle('monthly');
      }

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

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate(`/signin?redirect=/pricing&plan=${planId}&billing=${billingCycle}`);
      return;
    }

    // Find the plan to get details for the payment modal
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const price = billingCycle === 'monthly'
      ? parseFloat(plan.monthly_price).toFixed(2).replace(/\.00$/, '')
      : parseFloat(plan.annual_price || plan.monthly_price * 12).toFixed(2).replace(/\.00$/, '');

    setPaymentModal({
      isOpen: true,
      planId,
      planName: plan.name,
      price,
      billingCycle
    });
  };

  const handlePaymentSuccess = async (paymentMethodId) => {
    try {
      await planAPI.createSubscription(paymentModal.planId, paymentModal.billingCycle, paymentMethodId);

      // Close payment modal and show success modal
      setPaymentModal({ isOpen: false, planId: null, planName: '', price: '', billingCycle: 'monthly' });
      setSuccessModal({
        isOpen: true,
        planName: paymentModal.planName,
        price: paymentModal.price,
        billingCycle: paymentModal.billingCycle
      });

      // Refresh subscription data and user context
      await Promise.all([
        fetchData(), // Refresh subscription and plan data
        checkAuth()  // Refresh user data to get updated subscription status
      ]);
    } catch (err) {
      throw new Error(err.message || 'Failed to create subscription');
    }
  };

  const handlePaymentError = (error) => {
    alert(`Payment failed: ${error.message || error}`);
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, planId: null, planName: '', price: '', billingCycle: 'monthly' });
  };

  const handleContinueToDashboard = () => {
    setSuccessModal({ isOpen: false, planName: '', price: '', billingCycle: 'monthly' });
    navigate('/dashboard');
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, planName: '', price: '', billingCycle: 'monthly' });
  };

  const handleUpgrade = async (planId) => {
    if (!confirm('Are you sure you want to upgrade your plan? Changes will take effect immediately.')) {
      return;
    }

    setProcessingAction(true);
    try {
      await planAPI.upgradeSubscription(planId, true);
      alert('Plan upgraded successfully!');
      await fetchData();
    } catch (err) {
      alert(`Failed to upgrade plan: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleDowngrade = async (planId) => {
    if (!confirm('Are you sure you want to downgrade your plan? Changes will take effect at the end of your current billing period.')) {
      return;
    }

    setProcessingAction(true);
    try {
      await planAPI.downgradeSubscription(planId);
      alert('Plan will be downgraded at the end of your billing period.');
      await fetchData();
    } catch (err) {
      alert(`Failed to downgrade plan: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const isCurrentPlan = (planId) => {
    return currentSubscription?.plan_id === planId;
  };

  const getButtonAction = (plan) => {
    if (isCurrentPlan(plan.id)) return null;

    const currentPrice = currentSubscription?.plan ?
      (billingCycle === 'monthly' ?
        parseFloat(currentSubscription.plan.monthly_price) :
        parseFloat(currentSubscription.plan.annual_price)
      ) : 0;

    const planPrice = billingCycle === 'monthly' ?
      parseFloat(plan.monthly_price) :
      parseFloat(plan.annual_price);

    if (!currentSubscription) return () => handleSubscribe(plan.id);
    if (planPrice > currentPrice) return () => handleUpgrade(plan.id);
    if (planPrice < currentPrice) return () => handleDowngrade(plan.id);
    return null;
  };

  const getButtonText = (plan) => {
    if (isCurrentPlan(plan.id)) return 'Current Plan';

    const currentPrice = currentSubscription?.plan ?
      (billingCycle === 'monthly' ?
        parseFloat(currentSubscription.plan.monthly_price) :
        parseFloat(currentSubscription.plan.annual_price)
      ) : 0;

    const planPrice = billingCycle === 'monthly' ?
      parseFloat(plan.monthly_price) :
      parseFloat(plan.annual_price);

    if (!currentSubscription) return 'Subscribe';
    if (planPrice > currentPrice) return 'Upgrade';
    if (planPrice < currentPrice) return 'Downgrade';
    return 'Subscribe';
  };

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-zenible-dark-bg' : 'bg-neutral-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary mx-auto"></div>
          <p className={`mt-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
            Loading pricing plans...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-zenible-dark-bg' : 'bg-neutral-50'}`}>
        <div className="text-center">
          <p className={`text-red-500 mb-4`}>{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No longer needed - we'll use is_recommended from the API
  // const getPopularPlan = () => { ... };

  const formatFeatureText = (feature) => {
    // If feature is an object with name/description
    if (typeof feature === 'object') {
      if (feature.custom_value) return feature.custom_value;
      if (feature.feature?.name) return feature.feature.name;
      if (feature.name) return feature.name;
      return '';
    }
    // If feature is a string
    return feature;
  };


  const getFeaturesList = (plan) => {
    // If plan has display_features, use those (including excluded ones)
    if (plan.display_features && plan.display_features.length > 0) {
      return plan.display_features.map(f => ({
        text: formatFeatureText(f),
        isIncluded: f.is_included !== false
      }));
    }

    // Fall back to features array if available
    if (plan.features && Array.isArray(plan.features)) {
      return plan.features.map(f => ({
        text: typeof f === 'string' ? f : formatFeatureText(f),
        isIncluded: true
      }));
    }

    // Default features based on plan type
    const planName = plan.name.toLowerCase();
    let defaultFeatures = [];

    if (planName.includes('free') || planName.includes('starter')) {
      defaultFeatures = [
        '5 proposal analyses per month',
        'Basic AI feedback',
        'Score breakdown',
        'Email support'
      ];
    } else if (planName.includes('pro')) {
      defaultFeatures = [
        'Unlimited proposal analyses',
        'Advanced AI insights',
        'Win rate tracking',
        'Premium templates library',
        'Export & sharing',
        'Priority email support'
      ];
    } else if (planName.includes('enterprise')) {
      defaultFeatures = [
        'Everything in Pro',
        'Team collaboration (up to 10 users)',
        'Custom branding',
        'Advanced analytics',
        'API access',
        'Dedicated account manager',
        'Phone & chat support',
        'Custom integrations'
      ];
    }

    return defaultFeatures.map(text => ({ text, isIncluded: true }));
  };

  return (
    <div className={`flex-1 flex flex-col ${darkMode ? 'bg-zenible-dark-bg' : 'bg-neutral-50'}`}>
      {/* Top Bar */}
      <div className={`h-[64px] relative border-b ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'border-neutral-200 bg-white'}`}>
        <div className="flex items-center gap-4 h-full px-4 py-[10px]">
          <button
            onClick={() => navigate(-1)}
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center border ${
              darkMode ? 'border-zenible-dark-border hover:bg-zenible-dark-bg' : 'bg-white border-neutral-200 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Pricing
          </h1>
        </div>
      </div>

      {/* Page Header */}
      <div className={`flex items-center justify-between px-[156px] py-4 ${darkMode ? 'bg-zenible-dark-bg' : 'bg-white'}`}>
        <h2 className={`text-[18px] font-semibold leading-[26px] ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Upgrade to unleash everything
        </h2>

        {/* Billing Toggle - only show if there are annual pricing plans */}
        {hasAnnualPricing ? (
          <div className={`flex gap-[2px] p-0 rounded-lg border ${darkMode ? 'border-zenible-dark-border bg-zenible-dark-card' : 'bg-white border-neutral-200'}`}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? darkMode
                    ? 'bg-zenible-dark-bg text-zenible-dark-text border border-zenible-dark-border shadow-sm'
                    : 'bg-white text-zinc-950 border border-neutral-200 shadow-sm'
                  : darkMode
                    ? 'text-zenible-dark-text-secondary'
                    : 'text-zinc-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === 'annually'
                  ? darkMode
                    ? 'bg-zenible-dark-bg text-zenible-dark-text border border-zenible-dark-border shadow-sm'
                    : 'bg-white text-zinc-950 border border-neutral-200 shadow-sm'
                  : darkMode
                    ? 'text-zenible-dark-text-secondary'
                    : 'text-zinc-500'
              }`}
            >
              Annually
            </button>
          </div>
        ) : (
          // Show just a label when only monthly pricing is available
          <div className={`px-3 py-2 text-sm font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Monthly Pricing
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex items-start justify-center gap-[14px] px-4 pb-4">
        {plans.filter(plan =>
          billingCycle === 'monthly' ? plan.monthly_price !== null : plan.annual_price !== null
        ).length === 0 && !loading && (
          <div className="text-center py-8">
            <p className={`${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              No {billingCycle} pricing plans available at this time.
            </p>
          </div>
        )}
        {plans.map((plan) => {
          // Skip plans that don't have any pricing
          if (plan.monthly_price === null && plan.annual_price === null) {
            return null;
          }
          // For annual view, if no annual price but has monthly, calculate it
          const hasAnnualPrice = plan.annual_price !== null || plan.monthly_price !== null;

          const isPopular = plan.is_recommended === true;
          const currentPlan = isCurrentPlan(plan.id);

          // Calculate displayed price
          let price;
          if (billingCycle === 'monthly') {
            price = plan.monthly_price ? parseFloat(plan.monthly_price).toFixed(2).replace(/\.00$/, '') : '0';
          } else {
            // Use annual price if available, otherwise calculate from monthly
            if (plan.annual_price !== null) {
              price = parseFloat(plan.annual_price).toFixed(2).replace(/\.00$/, '');
            } else if (plan.monthly_price !== null) {
              price = (parseFloat(plan.monthly_price) * 12).toFixed(2).replace(/\.00$/, '');
            } else {
              return null; // Skip if no pricing available
            }
          }
          const features = getFeaturesList(plan);

          // Use actual old prices from API
          let originalPrice;
          if (billingCycle === 'monthly') {
            originalPrice = plan.old_monthly_price;
          } else {
            // For annual, use old_annual_price if available, or calculate from old_monthly_price
            if (plan.old_annual_price !== null) {
              originalPrice = plan.old_annual_price;
            } else if (plan.old_monthly_price !== null && plan.annual_price === null) {
              // If showing calculated annual price, also calculate old annual price
              originalPrice = parseFloat(plan.old_monthly_price) * 12;
            } else {
              originalPrice = null;
            }
          }

          return (
            <div
              key={plan.id || plan.name}
              className={`relative bg-white rounded-xl p-6 w-[366.667px] h-[586px] flex flex-col border-2 ${
                isPopular
                  ? 'border-zenible-primary'
                  : darkMode
                    ? 'border-zenible-dark-border'
                    : 'border-neutral-200'
              } shadow-sm`}
            >
              {/* Header */}
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-medium text-zinc-950">{plan.name}</h3>
                    {isPopular && (
                      <span className="bg-zenible-primary text-white px-2 py-0.5 rounded-md text-sm font-medium">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{plan.description || 'Perfect for getting started'}</p>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3">
                  {originalPrice && (
                    <span className="text-2xl font-medium text-zinc-400 line-through">
                      ${typeof originalPrice === 'number' ? originalPrice.toFixed(2).replace(/\.00$/, '') : parseFloat(originalPrice).toFixed(2).replace(/\.00$/, '')}
                    </span>
                  )}
                  <span className="text-[32px] font-bold text-zinc-950">
                    ${price}
                  </span>
                  <span className="text-base text-zinc-500">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-neutral-200 mb-6"></div>

              {/* Button */}
              <button
                onClick={getButtonAction(plan)}
                disabled={currentPlan || processingAction}
                className={`w-full py-3 rounded-xl font-medium text-base transition-all mb-6 ${
                  currentPlan
                    ? darkMode
                      ? 'border border-zenible-dark-border text-zenible-dark-text-secondary bg-zenible-dark-card cursor-not-allowed'
                      : 'border border-neutral-200 text-zinc-500 bg-white cursor-not-allowed'
                    : isPopular
                      ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                      : darkMode
                        ? 'border border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                        : 'border border-neutral-200 text-zinc-950 hover:bg-gray-50'
                }`}
              >
                {getButtonText(plan)}
              </button>

              {/* Features */}
              <div className="flex-1 flex flex-col gap-4">
                {features.length > 0 ? features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <img
                      src={feature.isIncluded ? tickSquare : crossSquare}
                      alt=""
                      className="w-6 h-6 flex-shrink-0"
                    />
                    <span className={`text-base font-medium ${
                      feature.isIncluded ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>
                      {feature.text}
                    </span>
                  </div>
                )) : (
                  <div className="text-sm text-gray-500">
                    No features available
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      <StripePaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        planName={paymentModal.planName}
        planId={paymentModal.planId}
        price={paymentModal.price}
        billingCycle={paymentModal.billingCycle}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />

      {/* Success Modal */}
      <SubscriptionSuccessModal
        isOpen={successModal.isOpen}
        onClose={closeSuccessModal}
        planName={successModal.planName}
        price={successModal.price}
        billingCycle={successModal.billingCycle}
        onContinue={handleContinueToDashboard}
      />
    </div>
  );
}