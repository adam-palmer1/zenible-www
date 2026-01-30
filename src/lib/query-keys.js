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
 * const { data } = useQuery(queryKeys.contacts.list(filters), fetchContactsFn);
 * queryClient.invalidateQueries(queryKeys.contacts.all);
 */

export const queryKeys = {
  // Contacts
  contacts: {
    all: ['contacts'],
    lists: () => [...queryKeys.contacts.all, 'list'],
    list: (filters) => [...queryKeys.contacts.lists(), { filters }],
    details: () => [...queryKeys.contacts.all, 'detail'],
    detail: (id) => [...queryKeys.contacts.details(), id],
  },

  // Statuses
  statuses: {
    all: ['statuses'],
    global: () => [...queryKeys.statuses.all, 'global'],
    custom: () => [...queryKeys.statuses.all, 'custom'],
    combined: () => [...queryKeys.statuses.all, 'combined'],
  },

  // Services
  services: {
    all: ['services'],
    lists: () => [...queryKeys.services.all, 'list'],
    list: (filters) => [...queryKeys.services.lists(), { filters }],
    byContact: (contactId) => [...queryKeys.services.all, 'contact', contactId],
  },

  // Appointments
  appointments: {
    all: ['appointments'],
    lists: () => [...queryKeys.appointments.all, 'list'],
    list: (filters) => [...queryKeys.appointments.lists(), { filters }],
    byContact: (contactId) => [...queryKeys.appointments.all, 'contact', contactId],
    upcoming: () => [...queryKeys.appointments.all, 'upcoming'],
  },

  // Projects
  projects: {
    all: ['projects'],
    lists: () => [...queryKeys.projects.all, 'list'],
    list: (filters) => [...queryKeys.projects.lists(), { filters }],
    byContact: (contactId) => [...queryKeys.projects.all, 'contact', contactId],
    stats: () => [...queryKeys.projects.all, 'stats'],
  },

  // Preferences
  preferences: {
    all: ['preferences'],
    user: () => [...queryKeys.preferences.all, 'user'],
    crm: () => [...queryKeys.preferences.all, 'crm'],
  },

  // Plans (for plan feature assignment)
  plans: {
    all: ['plans'],
    lists: () => [...queryKeys.plans.all, 'list'],
    list: () => [...queryKeys.plans.lists()],
    features: (planId) => [...queryKeys.plans.all, planId, 'features'],
  },

  // Email Templates
  emailTemplates: {
    all: ['emailTemplates'],
    lists: () => [...queryKeys.emailTemplates.all, 'list'],
    list: (filters) => [...queryKeys.emailTemplates.lists(), { filters }],
    details: () => [...queryKeys.emailTemplates.all, 'detail'],
    detail: (id) => [...queryKeys.emailTemplates.details(), id],
    variables: (templateType) => [...queryKeys.emailTemplates.all, 'variables', templateType],
    effective: (templateType) => [...queryKeys.emailTemplates.all, 'effective', templateType],
  },

  // Currencies
  currencies: {
    all: ['currencies'],
    list: () => [...queryKeys.currencies.all, 'list'],
    company: () => [...queryKeys.currencies.all, 'company'],
    numberFormat: () => [...queryKeys.currencies.all, 'numberFormat'],
    numberFormatDetails: (formatId) => [...queryKeys.currencies.all, 'numberFormatDetails', formatId],
  },
};

/**
 * Helper to invalidate all CRM-related queries
 * Use after major changes (e.g., settings update)
 */
export const invalidateCRMQueries = (queryClient) => {
  return Promise.all([
    queryClient.invalidateQueries(queryKeys.contacts.all),
    queryClient.invalidateQueries(queryKeys.statuses.all),
    queryClient.invalidateQueries(queryKeys.services.all),
    queryClient.invalidateQueries(queryKeys.appointments.all),
    queryClient.invalidateQueries(queryKeys.projects.all),
  ]);
};

/**
 * Helper to invalidate contact-specific queries
 * Use after updating a single contact
 */
export const invalidateContactQueries = (queryClient, contactId) => {
  return Promise.all([
    queryClient.invalidateQueries(queryKeys.contacts.detail(contactId)),
    queryClient.invalidateQueries(queryKeys.contacts.lists()),
    queryClient.invalidateQueries(queryKeys.services.byContact(contactId)),
    queryClient.invalidateQueries(queryKeys.appointments.byContact(contactId)),
    queryClient.invalidateQueries(queryKeys.projects.byContact(contactId)),
  ]);
};
