export interface FeatureBlockItem {
  title: string;
  description: string;
}

export interface FeatureBlock {
  id: string;
  badge: string;
  headline: string;
  description: string;
  ctaText: string;
  image?: string;
  items: FeatureBlockItem[];
}

export const crmFeatures: FeatureBlock = {
  id: 'crm',
  badge: 'CRM',
  headline: 'Manage your clients and relationships',
  description:
    'Track leads, manage services, organize projects, and collaborate with clients in one connected workspace.',
  ctaText: 'Get started free now',
  image: '/landing/sections/crm-projects.png',
  items: [
    {
      title: 'Contacts',
      description:
        'Track leads, manage clients, and keep every conversation organized in a simple pipeline.',
    },
    {
      title: 'Services',
      description:
        'Define the services you offer and connect them to projects, proposals, and invoices.',
    },
    {
      title: 'Projects',
      description:
        'Organize client work, track progress, and manage deliverables from one project dashboard.',
    },
  ],
};

export const meetingsFeatures: FeatureBlock = {
  id: 'meetings',
  badge: 'Smart Meetings',
  headline: 'Schedule and manage client meetings effortlessly',
  description:
    'Keep your schedule organized and let clients book meetings directly through Zenible.',
  ctaText: 'Get started free now',
  image: '/landing/sections/meeting-calendar.png',
  items: [
    {
      title: 'Meeting Intelligence',
      description:
        'AI-powered meeting intelligence that records calls, generates summaries, and highlights key insights automatically.',
    },
    {
      title: 'Google Calendar Integration',
      description:
        'Sync Zenible with Google Calendar to keep all your meetings and events in one place.',
    },
    {
      title: 'Meeting Calendar',
      description:
        'View your meetings, appointments, and client calls in one organized calendar.',
    },
    {
      title: 'Call Booking Widget',
      description:
        'Let clients book meetings with you directly using a customizable scheduling widget.',
    },
  ],
};

export const financeFeatures: FeatureBlock = {
  id: 'finance',
  badge: 'Finance',
  headline: 'Manage your business finances in one place',
  description:
    'Create invoices, send quotes, track payments, and monitor your financial performance — all inside Zenible.',
  ctaText: 'Get started free now',
  image: '/landing/sections/finance-reports.png',
  items: [
    {
      title: 'Multi-Currency Conversion',
      description:
        'Automatically convert payments, invoices, and quotes into your preferred currency for clear financial tracking.',
    },
    {
      title: 'Invoices',
      description:
        'Create professional invoices and send them to clients in seconds.',
    },
    {
      title: 'Quotes',
      description:
        'Send project quotes to clients and convert them into invoices when approved.',
    },
    {
      title: 'Credit Notes',
      description:
        'Issue credit notes to adjust invoices and manage client refunds easily.',
    },
    {
      title: 'Expenses',
      description:
        'Track your business expenses and understand where your money goes.',
    },
    {
      title: 'Payments',
      description:
        'Track incoming payments and monitor your revenue in real time.',
    },
    {
      title: 'Reports',
      description:
        'Analyze your business performance with financial reports and insights.',
    },
  ],
};
