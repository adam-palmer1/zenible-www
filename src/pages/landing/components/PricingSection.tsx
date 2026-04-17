import React from 'react';
import { usePlans } from '../hooks/usePlans';
import type { LandingPlan } from '../hooks/usePlans';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { APP_URL } from '../../../utils/hostname';

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (num === 0) return 'Free';
  return `$${num % 1 === 0 ? num.toFixed(0) : num.toFixed(2)}`;
}

function getFeatureName(f: Record<string, unknown>): string {
  if (f.custom_value) return String(f.custom_value);
  const nested = f.feature as Record<string, unknown> | undefined;
  if (nested?.name) return String(nested.name);
  if (f.name) return String(f.name);
  return '';
}

function getSystemFeaturesList(plan: LandingPlan): { text: string; included: boolean }[] {
  const features: { text: string; included: boolean }[] = [];
  const sf = plan.system_features || [];

  // Helper to find a system feature
  const find = (name: string) => sf.find((f) => {
    const n = (f.feature as Record<string, unknown>)?.name || f.name;
    return n === name;
  });

  // AI messages
  const aiMessages = find('Monthly Total AI Messages');
  if (aiMessages) {
    const limit = aiMessages.limit_value;
    features.push({
      text: limit === -1 || limit === 0 ? 'Unlimited AI messages' : `${limit} AI messages per month`,
      included: aiMessages.is_enabled !== false,
    });
  }

  // Meeting intelligence
  const mi = find('Meeting Intelligence');
  const miMinutes = find('Monthly Meeting Bot Minutes');
  if (mi) {
    const mins = miMinutes?.limit_value;
    let label = 'Meeting intelligence';
    if (mi.is_enabled && mins && mins > 0) {
      label = `Meeting intelligence (${mins >= 1000 ? `${(mins / 1000).toFixed(0)}k` : mins} min/mo)`;
    }
    features.push({ text: label, included: mi.is_enabled !== false });
  }

  // CRM
  const crm = find('CRM Access');
  if (crm) features.push({ text: 'CRM & contact pipeline', included: crm.is_enabled !== false });

  // Finance
  const finance = find('Finance Features');
  if (finance) features.push({ text: 'Invoicing, quotes & expenses', included: finance.is_enabled !== false });

  // Calendar
  const cal = find('Calendar Integrations');
  if (cal) features.push({ text: 'Google Calendar sync', included: cal.is_enabled !== false });

  // Call booking
  const booking = find('Call Booking');
  if (booking) features.push({ text: 'Call booking page', included: booking.is_enabled !== false });

  // Payments
  const payments = find('Payment Integrations');
  if (payments) features.push({ text: 'Payment integrations (Stripe/PayPal)', included: payments.is_enabled !== false });

  // Boardroom
  const boardroom = find('The Boardroom');
  if (boardroom) features.push({ text: 'The Boardroom', included: boardroom.is_enabled !== false });

  // Viral post
  const viral = find('Viral Post Generator');
  if (viral) features.push({ text: 'Viral Post Generator', included: viral.is_enabled !== false });

  // Training
  const training = find('Training Library');
  if (training) features.push({ text: 'Training Library & Quizzes', included: training.is_enabled !== false });

  // Team members
  const team = find('Active Company Users');
  if (team && team.limit_value) {
    const limit = team.limit_value;
    features.push({
      text: limit === -1 ? 'Unlimited team members' : `Up to ${limit} team members`,
      included: team.is_enabled !== false,
    });
  }

  // Contacts limit
  const contacts = find('Active CRM Contacts');
  if (contacts && contacts.limit_value) {
    const limit = contacts.limit_value;
    if (limit !== -1) {
      features.push({ text: `Up to ${limit} CRM contacts`, included: true });
    } else {
      features.push({ text: 'Unlimited CRM contacts', included: true });
    }
  }

  return features;
}

function PlanCard({ plan }: { plan: LandingPlan }) {
  const displayFeatures = (plan.display_features || []).map((f) => ({
    text: getFeatureName(f as Record<string, unknown>),
    included: (f as Record<string, unknown>).is_included !== false,
  })).filter((f) => f.text);

  const systemFeatures = getSystemFeaturesList(plan);

  // Merge: show system features (more meaningful), then display features not already covered
  const displayNames = new Set(displayFeatures.map((f) => f.text.toLowerCase()));
  const allFeatures = [
    ...systemFeatures,
    ...displayFeatures.filter((f) => !displayNames.has(f.text.toLowerCase()) || !systemFeatures.length),
  ];

  return (
    <div
      className={`relative rounded-2xl p-8 flex flex-col ${
        plan.is_recommended
          ? 'bg-white border-2 border-[#8e51ff] shadow-xl shadow-purple-100/50'
          : 'bg-white border border-gray-200'
      }`}
    >
      {plan.is_recommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1.5 bg-[#8e51ff] text-white text-xs font-semibold rounded-full whitespace-nowrap">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">{formatPrice(plan.monthly_price)}</span>
          {parseFloat(plan.monthly_price) > 0 && <span className="text-gray-500">/month</span>}
        </div>
        {plan.description && (
          <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
        )}
      </div>

      <a
        href={`${APP_URL}/register`}
        className={`block w-full py-3 text-center text-sm font-semibold rounded-xl transition-colors mb-8 ${
          plan.is_recommended
            ? 'bg-[#8e51ff] text-white hover:bg-[#7a3de6] shadow-lg shadow-purple-200'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        Get Started
      </a>

      <ul className="space-y-3 flex-1">
        {allFeatures.map((feature) => (
          <li key={feature.text} className="flex items-start gap-3">
            {feature.included ? (
              <svg className="w-5 h-5 text-[#8e51ff] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PricingSection() {
  const { plans, loading, error } = usePlans();
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gray-50">
      <div
        ref={ref}
        className={`max-w-[1440px] mx-auto px-5 md:px-20 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 bg-purple-50 text-[#8e51ff] text-sm font-semibold rounded-full mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 animate-pulse h-[500px]" />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-gray-500">{error}</p>
        ) : (
          <div className={`grid grid-cols-1 ${plans.length === 2 ? 'md:grid-cols-2 max-w-3xl' : plans.length >= 3 ? 'md:grid-cols-3 max-w-5xl' : 'max-w-md'} gap-6 mx-auto`}>
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-8">
          Free forever plan also available. No credit card required to start.
        </p>
      </div>
    </section>
  );
}
