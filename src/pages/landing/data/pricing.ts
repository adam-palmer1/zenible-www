export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaLink: string;
  isRecommended?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$19.90',
    period: '/month',
    description: 'Everything you need to get started as a freelancer.',
    features: [
      'CRM with pipeline management',
      'Invoicing & quotes',
      'Google Calendar sync',
      'AI meeting summaries',
      '2 AI advisors',
      'Booking page',
    ],
    ctaText: 'Start Free',
    ctaLink: '/register',
  },
  {
    name: 'Growth',
    price: '$34.90',
    period: '/month',
    description: 'For growing freelancers and small agencies.',
    features: [
      'Everything in Starter',
      'All 8 AI advisors',
      'Unlimited AI messages',
      'Expense tracking',
      'Financial reports',
      'Credit notes',
      'Priority support',
    ],
    ctaText: 'Start Free',
    ctaLink: '/register',
    isRecommended: true,
  },
  {
    name: 'Professional',
    price: '$79.90',
    period: '/month',
    description: 'For agencies and teams that need everything.',
    features: [
      'Everything in Growth',
      'Team collaboration',
      'Custom branding',
      'API access',
      'Advanced analytics',
      'Dedicated support',
    ],
    ctaText: 'Start Free',
    ctaLink: '/register',
  },
];
