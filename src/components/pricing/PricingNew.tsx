import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../../contexts/PreferencesContext';
import planAPI from '../../services/planAPI';
import StripePaymentModal from '../StripePaymentModal';
import SubscriptionSuccessModal from '../SubscriptionSuccessModal';
import PlanChangeConfirmModal from '../user-settings/PlanChangeConfirmModal';
import type { ChangePlanPreview } from '../user-settings/PlanChangeConfirmModal';
import tickSquare from '../../assets/icons/tick-square-purple.svg';
import crossSquare from '../../assets/icons/cross-square-gray.svg';

export default function PricingNew() {
  const { user, checkAuth } = useAuth();
  const { darkMode } = usePreferences();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [hasAnnualPricing, setHasAnnualPricing] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    planId: string | null;
    planName: string;
    price: string;
    billingCycle: string;
  }>({
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
  const [planChangeModal, setPlanChangeModal] = useState<{
    isOpen: boolean;
    planId: string | null;
    preview: ChangePlanPreview | null;
    loading: boolean;
    confirming: boolean;
    error: string | null;
  }>({
    isOpen: false,
    planId: null,
    preview: null,
    loading: false,
    confirming: false,
    error: null,
  });
  const [pendingUpgrade, setPendingUpgrade] = useState<{
    planId: string;
    planName: string;
    price: string;
    billingCycle: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch public plans
      const plansResponse = await planAPI.getPublicPlans() as { plans?: any[]; items?: any[]; [key: string]: unknown };
      const activePlans = (plansResponse.plans || plansResponse.items || [])
        .filter(plan => plan.is_active && plan.monthly_price !== null)
        .sort((a, b) => parseFloat(a.monthly_price) - parseFloat(b.monthly_price));

      // Fetch plan features for each plan
      const plansWithFeatures = await Promise.all(
        activePlans.map(async (plan) => {
          try {
            const featuresResponse = await planAPI.getPlanWithFeatures(plan.id) as { display_features?: any[]; system_features?: any[]; [key: string]: unknown };
            return {
              ...plan,
              display_features: featuresResponse.display_features || plan.display_features || [],
              system_features: featuresResponse.system_features || plan.system_features || [],
            };
          } catch (_err) {
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

      // Check if any plan has explicit annual pricing
      const anyAnnualPricing = plansWithFeatures.some(plan => plan.annual_price != null && parseFloat(plan.annual_price) > 0);
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

  const handleSubscribe = async (planId: string) => {
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

  const handlePaymentSuccess = async (paymentMethodId: string) => {
    try {
      if (pendingUpgrade) {
        // Free-to-paid upgrade: use changeSubscription with payment method
        await planAPI.changeSubscription(pendingUpgrade.planId, {
          billingCycle: pendingUpgrade.billingCycle,
          paymentMethodId,
        });
      } else {
        // New subscription (no existing subscription record)
        await planAPI.createSubscription(paymentModal.planId!, paymentModal.billingCycle, paymentMethodId);
      }

      // Close payment modal and show success modal
      const planName = pendingUpgrade?.planName || paymentModal.planName;
      const price = pendingUpgrade?.price || paymentModal.price;
      const cycle = pendingUpgrade?.billingCycle || paymentModal.billingCycle;
      setPaymentModal({ isOpen: false, planId: null, planName: '', price: '', billingCycle: 'monthly' });
      setPendingUpgrade(null);
      setSuccessModal({ isOpen: true, planName, price, billingCycle: cycle });

      // Refresh subscription data and user context
      await Promise.all([
        fetchData(), // Refresh subscription and plan data
        checkAuth()  // Refresh user data to get updated subscription status
      ]);
    } catch (err: unknown) {
      throw new Error((err as Error).message || 'Failed to create subscription');
    }
  };

  const handlePaymentError = (_error: any) => {
    setError(`Payment failed: ${_error?.message || _error}`);
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, planId: null, planName: '', price: '', billingCycle: 'monthly' });
    setPendingUpgrade(null);
  };

  const handleContinueToDashboard = () => {
    setSuccessModal({ isOpen: false, planName: '', price: '', billingCycle: 'monthly' });
    navigate('/dashboard');
  };

  const closeSuccessModal = () => {
    setSuccessModal({ isOpen: false, planName: '', price: '', billingCycle: 'monthly' });
  };

  const handleChangePlan = async (planId: string) => {
    // Open modal in loading state and fetch preview
    setPlanChangeModal({
      isOpen: true,
      planId,
      preview: null,
      loading: true,
      confirming: false,
      error: null,
    });

    try {
      const preview = await planAPI.previewPlanChange(planId, { billingCycle }) as ChangePlanPreview;
      setPlanChangeModal(prev => ({ ...prev, preview, loading: false }));
    } catch (err: unknown) {
      const errorMessage = (err as Error).message || 'Failed to load preview';
      // If same-price error (422), show a friendly message in the modal
      const isSamePriceError = errorMessage.toLowerCase().includes('same price');
      setPlanChangeModal(prev => ({
        ...prev,
        loading: false,
        error: isSamePriceError
          ? 'This plan has the same price as your current plan. No change is needed.'
          : errorMessage,
      }));
    }
  };

  const handleConfirmPlanChange = async () => {
    if (!planChangeModal.planId) return;

    // Free-to-paid upgrade: need to collect payment first
    if (!currentSubscription?.stripe_subscription_id && planChangeModal.preview?.direction === 'upgrade') {
      const planName = planChangeModal.preview?.new_plan_name || 'New Plan';
      const price = String(planChangeModal.preview?.new_price || '');
      // Close preview modal and save pending upgrade info
      setPlanChangeModal({ isOpen: false, planId: null, preview: null, loading: false, confirming: false, error: null });
      setPendingUpgrade({ planId: planChangeModal.planId, planName, price, billingCycle });
      // Open payment modal to collect card details
      setPaymentModal({ isOpen: true, planId: planChangeModal.planId, planName, price, billingCycle });
      return;
    }

    setPlanChangeModal(prev => ({ ...prev, confirming: true, error: null }));

    try {
      await planAPI.changeSubscription(planChangeModal.planId, { billingCycle });
      // Close modal and show success
      const planName = planChangeModal.preview?.new_plan_name || 'New Plan';
      const price = String(planChangeModal.preview?.new_price || '');
      setPlanChangeModal({ isOpen: false, planId: null, preview: null, loading: false, confirming: false, error: null });
      setSuccessModal({ isOpen: true, planName, price, billingCycle });
      await Promise.all([fetchData(), checkAuth()]);
    } catch (err: unknown) {
      setPlanChangeModal(prev => ({
        ...prev,
        confirming: false,
        error: (err as Error).message || 'Failed to change plan',
      }));
    }
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  const isFreePlan = (plan: any) => {
    return parseFloat(plan.monthly_price) === 0;
  };

  const handleFreeSubscribe = async (planId: string) => {
    if (!user) {
      navigate(`/signin?redirect=/pricing&plan=${planId}`);
      return;
    }

    setProcessingAction(true);
    try {
      await planAPI.createSubscription(planId, 'monthly', null);
      const plan = plans.find(p => p.id === planId);
      setSuccessModal({
        isOpen: true,
        planName: plan?.name || 'Free',
        price: '0',
        billingCycle: 'monthly'
      });
      await Promise.all([fetchData(), checkAuth()]);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to activate free plan');
    } finally {
      setProcessingAction(false);
    }
  };

  const getButtonAction = (plan: any) => {
    if (isCurrentPlan(plan.id)) return null;
    if (isFreePlan(plan) && !currentSubscription) return () => handleFreeSubscribe(plan.id);
    if (!currentSubscription) return () => handleSubscribe(plan.id);
    return () => handleChangePlan(plan.id);
  };

  const getButtonText = (plan: any) => {
    if (isCurrentPlan(plan.id)) return 'Current Plan';
    if (isFreePlan(plan)) return 'Go with Free for Now';
    if (!currentSubscription) return 'Subscribe';

    const currentPrice = billingCycle === 'monthly'
      ? (parseFloat(currentSubscription.plan?.monthly_price) || 0)
      : (parseFloat(currentSubscription.plan?.annual_price) || 0);

    const planPrice = billingCycle === 'monthly'
      ? (parseFloat(plan.monthly_price) || 0)
      : (parseFloat(plan.annual_price) || 0);

    if (planPrice > currentPrice) return 'Upgrade';
    if (planPrice < currentPrice) return 'Downgrade';
    return 'Change Plan';
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

  const formatFeatureText = (feature: Record<string, unknown> | string): React.ReactNode => {
    // If feature is an object with name/description
    if (typeof feature === 'object') {
      if (feature.custom_value) return String(feature.custom_value);
      const nestedFeature = feature.feature as Record<string, unknown> | undefined;
      if (nestedFeature?.name) return String(nestedFeature.name);
      if (feature.name) return String(feature.name);
      return '';
    }
    // If feature is a string
    return feature;
  };


  const getFeaturesList = (plan: Record<string, unknown> & { display_features?: Record<string, unknown>[]; features?: unknown[]; name: string }) => {
    // If plan has display_features, use those (including excluded ones)
    if (plan.display_features && plan.display_features.length > 0) {
      return plan.display_features.map((f: Record<string, unknown>) => ({
        text: formatFeatureText(f),
        isIncluded: f.is_included !== false
      }));
    }

    // Fall back to features array if available
    if (plan.features && Array.isArray(plan.features)) {
      return plan.features.map((f: unknown) => ({
        text: typeof f === 'string' ? f : formatFeatureText(f as Record<string, unknown>),
        isIncluded: true
      }));
    }

    // Default features based on plan type
    const planName = plan.name.toLowerCase();
    let defaultFeatures: string[] = [];

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
      <div className={`flex items-center justify-between px-4 md:px-12 lg:px-[156px] py-4 ${darkMode ? 'bg-zenible-dark-bg' : 'bg-white'}`}>
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
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                billingCycle === 'annual'
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
        ) : null}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-wrap items-start justify-center gap-[14px] px-4 pb-4">
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
          // Skip plans that don't have pricing for the selected billing cycle
          if (billingCycle === 'monthly' && plan.monthly_price === null) return null;
          if (billingCycle === 'annual' && plan.annual_price === null) return null;

          const isPopular = plan.is_recommended === true;
          const currentPlan = isCurrentPlan(plan.id);

          // Calculate displayed price
          let price;
          if (billingCycle === 'monthly') {
            price = plan.monthly_price ? parseFloat(plan.monthly_price).toFixed(2).replace(/\.00$/, '') : '0';
          } else {
            price = parseFloat(plan.annual_price).toFixed(2).replace(/\.00$/, '');
          }
          const features = getFeaturesList(plan);

          // Use actual old prices from API
          let originalPrice;
          if (billingCycle === 'monthly') {
            originalPrice = plan.old_monthly_price;
          } else {
            originalPrice = plan.old_annual_price ?? null;
          }

          return (
            <div
              key={plan.id || plan.name}
              className={`relative bg-white rounded-xl p-6 w-full sm:w-[366.667px] h-[586px] flex flex-col border-2 ${
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
                  <div className="flex items-center gap-2.5 min-w-0">
                    <h3 className="text-xl font-medium text-zinc-950 truncate" title={plan.name}>{plan.name}</h3>
                    {isPopular && (
                      <span className="bg-zenible-primary text-white px-2 py-0.5 rounded-md text-sm font-medium shrink-0">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-2">{plan.description || 'Perfect for getting started'}</p>
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1">
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
                  {/* Show the alternative billing cycle price when annual pricing is set */}
                  {!isFreePlan(plan) && plan.annual_price !== null && (() => {
                    const altPrice = billingCycle === 'monthly'
                      ? parseFloat(plan.annual_price).toFixed(2).replace(/\.00$/, '')
                      : parseFloat(plan.monthly_price).toFixed(2).replace(/\.00$/, '');
                    const altLabel = billingCycle === 'monthly' ? '/yr' : '/mo';
                    const savingsText = billingCycle === 'monthly'
                      ? (plan.annual_savings_percentage
                          ? ` (Save ${Math.round(plan.annual_savings_percentage)}%)`
                          : (() => {
                              const monthlyAnnual = parseFloat(plan.monthly_price) * 12;
                              const annual = parseFloat(plan.annual_price);
                              const pct = Math.round(((monthlyAnnual - annual) / monthlyAnnual) * 100);
                              return pct > 0 ? ` (Save ${pct}%)` : '';
                            })())
                      : '';
                    return (
                      <span className="text-sm text-zinc-400">
                        or ${altPrice}{altLabel}{savingsText}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-neutral-200 mb-6"></div>

              {/* Button */}
              <button
                onClick={getButtonAction(plan) ?? undefined}
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
                {features.length > 0 ? features.map((feature: { text: React.ReactNode; isIncluded: boolean }, index: number) => (
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
        planId={paymentModal.planId ?? ''}
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

      {/* Plan Change Confirmation Modal */}
      <PlanChangeConfirmModal
        isOpen={planChangeModal.isOpen}
        onClose={() => setPlanChangeModal({ isOpen: false, planId: null, preview: null, loading: false, confirming: false, error: null })}
        onConfirm={handleConfirmPlanChange}
        loading={planChangeModal.loading}
        confirming={planChangeModal.confirming}
        preview={planChangeModal.preview}
        error={planChangeModal.error}
      />
    </div>
  );
}