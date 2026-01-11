import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import emailTemplatesAPI from '../../services/api/crm/emailTemplates';
import { queryKeys } from '../../lib/query-keys';

/**
 * React Query hook for fetching email templates list
 *
 * @param {Object} filters - Query filters (page, per_page, template_type)
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, isLoading, error, refetch
 */
export function useEmailTemplatesQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.list(filters),
    queryFn: async () => {
      const response = await emailTemplatesAPI.list(filters);
      // API returns { items, page, per_page, total, total_pages }
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * React Query hook for fetching single email template
 *
 * @param {string} templateId - Template UUID
 * @param {Object} options - React Query options
 * @returns {Object} Query result
 */
export function useEmailTemplateQuery(templateId, options = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.detail(templateId),
    queryFn: async () => {
      if (!templateId) {
        throw new Error('Template ID is required');
      }
      return await emailTemplatesAPI.get(templateId);
    },
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * React Query hook for fetching available variables for a template type
 *
 * @param {string} templateType - Template type (invoice_send, quote_send, etc.)
 * @param {Object} options - React Query options
 * @returns {Object} Query result with variables data
 */
export function useTemplateVariablesQuery(templateType, options = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.variables(templateType),
    queryFn: async () => {
      if (!templateType) {
        throw new Error('Template type is required');
      }
      return await emailTemplatesAPI.getVariables(templateType);
    },
    enabled: !!templateType,
    staleTime: 10 * 60 * 1000, // 10 minutes (variables rarely change)
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

/**
 * React Query hook for fetching effective template (company or system default)
 *
 * @param {string} templateType - Template type
 * @param {Object} options - React Query options
 * @returns {Object} Query result with effective template
 */
export function useEffectiveTemplateQuery(templateType, options = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.effective(templateType),
    queryFn: async () => {
      if (!templateType) {
        throw new Error('Template type is required');
      }
      return await emailTemplatesAPI.getEffective(templateType);
    },
    enabled: !!templateType,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Helper hook to get templates data array directly
 *
 * @param {Object} filters - Query filters
 * @param {Object} options - React Query options
 * @returns {Object} Simplified result with templates array
 */
export function useEmailTemplatesList(filters = {}, options = {}) {
  const query = useEmailTemplatesQuery(filters, options);

  return {
    ...query,
    templates: query.data?.items || [],
    pagination: {
      page: query.data?.page || 1,
      per_page: query.data?.per_page || 20,
      total: query.data?.total || 0,
      total_pages: query.data?.total_pages || 0,
    },
  };
}

/**
 * Mutation hook for creating email template
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation result
 */
export function useCreateEmailTemplate(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateData) => emailTemplatesAPI.create(templateData),
    onSuccess: (data) => {
      // Invalidate templates list to refetch
      queryClient.invalidateQueries(queryKeys.emailTemplates.lists());
      // Optionally invalidate effective template if this is a new company template
      if (data.template_type) {
        queryClient.invalidateQueries(queryKeys.emailTemplates.effective(data.template_type));
      }
    },
    ...options,
  });
}

/**
 * Mutation hook for updating email template
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation result
 */
export function useUpdateEmailTemplate(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => emailTemplatesAPI.update(id, data),
    onSuccess: (data, variables) => {
      // Invalidate specific template detail
      queryClient.invalidateQueries(queryKeys.emailTemplates.detail(variables.id));
      // Invalidate templates list
      queryClient.invalidateQueries(queryKeys.emailTemplates.lists());
      // Invalidate effective template
      if (data.template_type) {
        queryClient.invalidateQueries(queryKeys.emailTemplates.effective(data.template_type));
      }
    },
    ...options,
  });
}

/**
 * Mutation hook for deleting email template
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation result
 */
export function useDeleteEmailTemplate(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId) => emailTemplatesAPI.delete(templateId),
    onSuccess: (data, templateId) => {
      // Remove from cache
      queryClient.removeQueries(queryKeys.emailTemplates.detail(templateId));
      // Invalidate lists
      queryClient.invalidateQueries(queryKeys.emailTemplates.lists());
      // Invalidate all effective templates (in case this was the active one)
      queryClient.invalidateQueries(queryKeys.emailTemplates.all);
    },
    ...options,
  });
}

/**
 * Mutation hook for previewing email template with variables
 *
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation result
 */
export function usePreviewEmailTemplate(options = {}) {
  return useMutation({
    mutationFn: ({ id, variables }) => emailTemplatesAPI.preview(id, variables),
    ...options,
  });
}
