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

  // Currencies
  currencies: {
    all: ['currencies'] as const,
    list: () => [...queryKeys.currencies.all, 'list'] as const,
    company: () => [...queryKeys.currencies.all, 'company'] as const,
    numberFormat: () => [...queryKeys.currencies.all, 'numberFormat'] as const,
    numberFormatDetails: (formatId: string) => [...queryKeys.currencies.all, 'numberFormatDetails', formatId] as const,
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
  ]);
};

/**
 * Helper to invalidate contact-specific queries
 * Use after updating a single contact
 */
export const invalidateContactQueries = (queryClient: QueryClient, contactId: string): Promise<void[]> => {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(contactId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.services.byContact(contactId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.appointments.byContact(contactId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.byContact(contactId) }),
  ]);
};
