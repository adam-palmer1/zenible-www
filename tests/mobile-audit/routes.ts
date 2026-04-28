export type Priority = 'P0' | 'P1' | 'P2';
export type Auth = 'public' | 'authed';

export interface Route {
  path: string;
  group: string;
  priority: Priority;
  auth: Auth;
  /** Optional source-file hint for the report. */
  source?: string;
  /** Optional note shown in findings, e.g. known concern. */
  note?: string;
  /** Skip this route on flaky/long pages. */
  skip?: boolean;
  /** Wait selector to confirm the page rendered (best-effort). */
  waitFor?: string;
  /** If set, expect 4xx/redirect — skip overflow assertions but still screenshot. */
  expectError?: boolean;
}

export const ROUTES: Route[] = [
  // PUBLIC AUTH (P0)
  { path: '/signin', group: 'auth-public', priority: 'P0', auth: 'public', source: 'src/pages/signin/SignIn.tsx' },
  { path: '/register', group: 'auth-public', priority: 'P0', auth: 'public', source: 'src/pages/signup/SignUp.tsx' },
  { path: '/verify-email', group: 'auth-public', priority: 'P0', auth: 'public', source: 'src/pages/signup/VerifyEmail.tsx' },
  { path: '/forgot-password', group: 'auth-public', priority: 'P0', auth: 'public', source: 'src/pages/forgot-password/ForgotPassword.tsx' },
  { path: '/auth/reset-password?token=demo', group: 'auth-public', priority: 'P0', auth: 'public', source: 'src/pages/forgot-password/ResetPassword.tsx', expectError: true },
  { path: '/email-confirmed', group: 'auth-public', priority: 'P1', auth: 'public' },
  { path: '/pricing', group: 'auth-public', priority: 'P0', auth: 'public', source: 'src/components/pricing/PricingNew.tsx' },

  // PUBLIC SHARE LINKS (P1) — synthetic tokens; expect error states but layout must hold
  { path: '/book/demo', group: 'public-share', priority: 'P1', auth: 'public', expectError: true },
  { path: '/booking/confirm/demo', group: 'public-share', priority: 'P1', auth: 'public', expectError: true },
  { path: '/booking/cancel/demo', group: 'public-share', priority: 'P1', auth: 'public', expectError: true },
  { path: '/invoices/public/demo', group: 'public-share', priority: 'P1', auth: 'public', expectError: true },
  { path: '/quotes/public/demo', group: 'public-share', priority: 'P1', auth: 'public', expectError: true },
  { path: '/credit-notes/public/demo', group: 'public-share', priority: 'P1', auth: 'public', expectError: true },
  { path: '/pay/demo', group: 'public-share', priority: 'P1', auth: 'public', expectError: true },
  { path: '/recording/demo', group: 'public-share', priority: 'P1', auth: 'public', expectError: true },

  // AUTHENTICATED CORE (P0)
  { path: '/dashboard', group: 'dashboard', priority: 'P0', auth: 'authed', source: 'src/components/zenible-dashboard/NewZenibleDashboard.tsx', note: 'SortableWidgetGrid uses react-dnd HTML5Backend (touch unsupported)' },

  // CRM
  { path: '/crm', group: 'crm', priority: 'P0', auth: 'authed' },
  { path: '/crm/contacts', group: 'crm', priority: 'P0', auth: 'authed', source: 'src/components/crm/ContactsListView.tsx' },
  { path: '/crm/projects', group: 'crm', priority: 'P0', auth: 'authed', source: 'src/components/crm/ProjectsTable.tsx' },
  { path: '/crm/services', group: 'crm', priority: 'P0', auth: 'authed', source: 'src/components/crm/ContactServicesTable.tsx' },
  { path: '/crm/pipeline', group: 'crm', priority: 'P0', auth: 'authed', source: 'src/components/crm/SalesPipelineNew.tsx', note: 'Horizontal Kanban; columns may not reflow on mobile' },
  { path: '/crm/meetings', group: 'crm', priority: 'P0', auth: 'authed' },

  // FINANCE
  { path: '/finance/invoices', group: 'finance', priority: 'P0', auth: 'authed', source: 'src/components/finance/invoices/InvoiceListTable.tsx' },
  { path: '/finance/invoices/new', group: 'finance', priority: 'P0', auth: 'authed' },
  { path: '/finance/invoices/recurring', group: 'finance', priority: 'P1', auth: 'authed' },
  { path: '/finance/quotes', group: 'finance', priority: 'P0', auth: 'authed' },
  { path: '/finance/quotes/new', group: 'finance', priority: 'P1', auth: 'authed' },
  { path: '/finance/expenses', group: 'finance', priority: 'P0', auth: 'authed' },
  { path: '/finance/expenses/new', group: 'finance', priority: 'P1', auth: 'authed' },
  { path: '/finance/expenses/recurring', group: 'finance', priority: 'P1', auth: 'authed' },
  { path: '/finance/expenses/categories', group: 'finance', priority: 'P1', auth: 'authed' },
  { path: '/finance/credit-notes', group: 'finance', priority: 'P1', auth: 'authed' },
  { path: '/finance/payments', group: 'finance', priority: 'P0', auth: 'authed' },
  { path: '/finance/reports', group: 'finance', priority: 'P0', auth: 'authed' },
  { path: '/finance/clients', group: 'finance', priority: 'P1', auth: 'authed' },

  // CALENDAR
  { path: '/calendar', group: 'calendar', priority: 'P0', auth: 'authed', source: 'src/components/calendar/Calendar.tsx', note: 'min-w-[640px] week view' },

  // BOARDROOM
  { path: '/boardroom', group: 'boardroom', priority: 'P0', auth: 'authed', source: 'src/components/boardroom/Boardroom.tsx' },

  // TOOLS
  { path: '/proposal-wizard', group: 'tools', priority: 'P0', auth: 'authed', source: 'src/components/proposal-wizard/ProposalWizard.tsx' },
  { path: '/profile-positioning/profile-analyzer', group: 'tools', priority: 'P0', auth: 'authed', source: 'src/components/profile-analyzer/ProfileAnalyzer.tsx' },
  { path: '/headline-analyzer', group: 'tools', priority: 'P0', auth: 'authed', source: 'src/components/headline-analyzer/HeadlineAnalyzer.tsx' },
  { path: '/content-creator/viral-post-generator', group: 'tools', priority: 'P0', auth: 'authed', source: 'src/components/viral-post-generator/ViralPostGenerator.tsx' },

  // SETTINGS / SUPPORT
  { path: '/settings', group: 'settings', priority: 'P0', auth: 'authed', source: 'src/components/SettingsSidebar.tsx' },
  { path: '/support', group: 'settings', priority: 'P1', auth: 'authed' },
  { path: '/notifications', group: 'settings', priority: 'P1', auth: 'authed' },
];

export const VIEWPORT_SIZES = [320, 375, 390, 414, 768] as const;
