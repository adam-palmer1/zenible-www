/**
 * Centralized Query Keys Registry for React Query
 *
 * Benefits:
 * - Type-safe key generation (no typos)
 * - Easy cache invalidation
 * - Clear cache hierarchy
 * - Automatic refetch coordination
 *
 * Usage:
 * const { data } = useQuery({ queryKey: queryKeys.contacts.list(filters), queryFn: fetchContactsFn });
 * queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
 */

import type { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.contacts.lists(), { filters }] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
  },

  // Statuses
  statuses: {
    all: ['statuses'] as const,
    global: () => [...queryKeys.statuses.all, 'global'] as const,
    custom: () => [...queryKeys.statuses.all, 'custom'] as const,
    combined: () => [...queryKeys.statuses.all, 'combined'] as const,
  },

  // Services
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.services.lists(), { filters }] as const,
    byContact: (contactId: string) => [...queryKeys.services.all, 'contact', contactId] as const,
  },

  // Appointments
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.appointments.lists(), { filters }] as const,
    byContact: (contactId: string) => [...queryKeys.appointments.all, 'contact', contactId] as const,
    upcoming: () => [...queryKeys.appointments.all, 'upcoming'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.projects.lists(), { filters }] as const,
    byContact: (contactId: string) => [...queryKeys.projects.all, 'contact', contactId] as const,
    stats: () => [...queryKeys.projects.all, 'stats'] as const,
  },

  // Preferences
  preferences: {
    all: ['preferences'] as const,
    user: () => [...queryKeys.preferences.all, 'user'] as const,
    crm: () => [...queryKeys.preferences.all, 'crm'] as const,
  },

  // Plans (for plan feature assignment)
  plans: {
    all: ['plans'] as const,
    lists: () => [...queryKeys.plans.all, 'list'] as const,
    list: () => [...queryKeys.plans.lists()] as const,
    features: (planId: string) => [...queryKeys.plans.all, planId, 'features'] as const,
  },

  // Email Templates
  emailTemplates: {
    all: ['emailTemplates'] as const,
    lists: () => [...queryKeys.emailTemplates.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.emailTemplates.lists(), { filters }] as const,
    details: () => [...queryKeys.emailTemplates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.emailTemplates.details(), id] as const,
    variables: (templateType: string) => [...queryKeys.emailTemplates.all, 'variables', templateType] as const,
    effective: (templateType: string) => [...queryKeys.emailTemplates.all, 'effective', templateType] as const,
  },

  // Finance Reports
  financeReports: {
    all: ['financeReports'] as const,
    transactions: (params: unknown) => [...queryKeys.financeReports.all, 'transactions', { params }] as const,
    summary: (params: unknown) => [...queryKeys.financeReports.all, 'summary', { params }] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.invoices.lists(), { filters }] as const,
    stats: () => [...queryKeys.invoices.all, 'stats'] as const,
    detail: (id: string) => [...queryKeys.invoices.all, 'detail', id] as const,
  },

  // Expenses
  expenses: {
    all: ['expenses'] as const,
    lists: () => [...queryKeys.expenses.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.expenses.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.expenses.all, 'detail', id] as const,
    categories: () => [...queryKeys.expenses.all, 'categories'] as const,
  },

  // Quotes
  quotes: {
    all: ['quotes'] as const,
    lists: () => [...queryKeys.quotes.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.quotes.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.quotes.all, 'detail', id] as const,
    stats: () => [...queryKeys.quotes.all, 'stats'] as const,
    templates: () => [...queryKeys.quotes.all, 'templates'] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: unknown) => [...queryKeys.payments.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.payments.all, 'detail', id] as const,
  },

  // Tips
  tips: {
    all: ['tips'] as const,
    random: () => [...queryKeys.tips.all, 'random'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    widgets: (visibleIds: string[]) => [...queryKeys.dashboard.all, 'widgets', { visibleIds }] as const,
  },

  // Reference data (countries, industries, etc.)
  referenceData: {
    all: ['referenceData'] as const,
  },

  // Currencies
  currencies: {
    all: ['currencies'] as const,
    list: () => [...queryKeys.currencies.all, 'list'] as const,
    company: () => [...queryKeys.currencies.all, 'company'] as const,
    numberFormat: () => [...queryKeys.currencies.all, 'numberFormat'] as const,
    numberFormatDetails: (formatId: string) => [...queryKeys.currencies.all, 'numberFormatDetails', formatId] as const,
    rates: (params: unknown) => [...queryKeys.currencies.all, 'rates', { params }] as const,
  },

  // Contact Fields
  contactFields: {
    all: ['contactFields'] as const,
  },

  // Company Attributes
  companyAttributes: {
    all: ['companyAttributes'] as const,
  },

  // Service Enums
  serviceEnums: {
    all: ['serviceEnums'] as const,
  },

  // Contact Services (services assigned to contacts)
  contactServices: {
    all: ['contactServices'] as const,
    list: (filters: unknown) => [...queryKeys.contactServices.all, 'list', { filters }] as const,
  },

  // Contact Financials
  contactFinancials: {
    all: ['contactFinancials'] as const,
    detail: (contactId: string) => [...queryKeys.contactFinancials.all, contactId] as const,
  },

  // Contact Notes
  contactNotes: {
    all: ['contactNotes'] as const,
    byContact: (contactId: string) => [...queryKeys.contactNotes.all, contactId] as const,
  },

  // Contact Activities
  contactActivities: {
    all: ['contactActivities'] as const,
    byContact: (contactId: string) => [...queryKeys.contactActivities.all, contactId] as const,
  },

  // Usage Dashboard
  usageDashboard: {
    all: ['usageDashboard'] as const,
  },

  // Payment Integrations
  paymentIntegrations: {
    all: ['paymentIntegrations'] as const,
  },

  // Billable Hours
  billableHours: {
    all: ['billableHours'] as const,
    byProject: (projectId: string) => [...queryKeys.billableHours.all, 'project', projectId] as const,
    list: (filters: unknown) => [...queryKeys.billableHours.all, 'list', { filters }] as const,
    byContact: (contactId: string) => [...queryKeys.billableHours.all, 'contact', contactId] as const,
  },

  // Calendar
  calendar: {
    all: ['calendar'] as const,
    appointments: (filters: unknown) => [...queryKeys.calendar.all, 'appointments', { filters }] as const,
    googleStatus: () => [...queryKeys.calendar.all, 'googleStatus'] as const,
  },

  // Countries
  countries: {
    all: ['countries'] as const,
    list: () => [...queryKeys.countries.all, 'list'] as const,
    company: () => [...queryKeys.countries.all, 'company'] as const,
  },

  // Custom Reports
  customReports: {
    all: ['customReports'] as const,
    columns: () => [...queryKeys.customReports.all, 'columns'] as const,
    list: (page?: number) => [...queryKeys.customReports.all, 'list', { page }] as const,
    detail: (id: string) => [...queryKeys.customReports.all, 'detail', id] as const,
    execution: (params: unknown) => [...queryKeys.customReports.all, 'execution', { params }] as const,
    savedExecution: (id: string, params: unknown) => [...queryKeys.customReports.all, 'savedExecution', id, { params }] as const,
  },
};

/**
 * Helper to invalidate all CRM-related queries
 * Use after major changes (e.g., settings update)
 */
export const invalidateCRMQueries = (queryClient: QueryClient): Promise<void[]> => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.statuses.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.services.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.contactServices.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.contactFields.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.companyAttributes.all }),
  ]);
};

/**
 * Helper to invalidate contact-specific queries
 * Use after updating a single contact
 */
/**
 * Helper to invalidate all finance-related queries
 */
export const invalidateFinanceQueries = (queryClient: QueryClient): Promise<void[]> => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.quotes.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.payments.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.financeReports.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.customReports.all }),
  ]);
};

export const invalidateContactQueries = (queryClient: QueryClient, contactId: string): Promise<void[]> => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(contactId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.services.byContact(contactId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.byContact(contactId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.byContact(contactId) }),
  ]);
};
