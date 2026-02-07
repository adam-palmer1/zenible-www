import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import emailTemplatesAPI from '../../services/api/crm/emailTemplates';
import { queryKeys } from '../../lib/query-keys';

// ---- Types ----

export interface EmailTemplateFilters {
  page?: number;
  per_page?: number;
  template_type?: string;
  [key: string]: unknown;
}

export interface EmailTemplatePagination {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface EmailTemplateListResponse {
  items: unknown[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface UpdateTemplateVariables {
  id: string;
  data: Record<string, unknown>;
}

interface PreviewTemplateVariables {
  id: string;
  variables: Record<string, unknown>;
}

type QueryOptions = Record<string, unknown>;
type MutationOptions = Record<string, unknown>;

/**
 * React Query hook for fetching email templates list
 */
export function useEmailTemplatesQuery(filters: EmailTemplateFilters = {}, options: QueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.list(filters),
    queryFn: async (): Promise<unknown> => {
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
 */
export function useEmailTemplateQuery(templateId: string | undefined | null, options: QueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.detail(templateId!),
    queryFn: async (): Promise<unknown> => {
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
 */
export function useTemplateVariablesQuery(templateType: string | undefined | null, options: QueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.variables(templateType!),
    queryFn: async (): Promise<unknown> => {
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
 */
export function useEffectiveTemplateQuery(templateType: string | undefined | null, options: QueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.emailTemplates.effective(templateType!),
    queryFn: async (): Promise<unknown> => {
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
 */
export function useEmailTemplatesList(filters: EmailTemplateFilters = {}, options: QueryOptions = {}) {
  const query = useEmailTemplatesQuery(filters, options);
  const data = query.data as EmailTemplateListResponse | undefined;

  return {
    ...query,
    templates: data?.items || [],
    pagination: {
      page: data?.page || 1,
      per_page: data?.per_page || 20,
      total: data?.total || 0,
      total_pages: data?.total_pages || 0,
    } as EmailTemplatePagination,
  };
}

/**
 * Mutation hook for creating email template
 */
export function useCreateEmailTemplate(options: MutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateData: unknown) => emailTemplatesAPI.create(templateData),
    onSuccess: (data: unknown) => {
      // Invalidate templates list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.lists() });
      // Optionally invalidate effective template if this is a new company template
      if ((data as any).template_type) {
        queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.effective((data as any).template_type) });
      }
    },
    ...options,
  });
}

/**
 * Mutation hook for updating email template
 */
export function useUpdateEmailTemplate(options: MutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateTemplateVariables) => emailTemplatesAPI.update(id, data),
    onSuccess: (data: unknown, variables: UpdateTemplateVariables) => {
      // Invalidate specific template detail
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.detail(variables.id) });
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.lists() });
      // Invalidate effective template
      if ((data as any).template_type) {
        queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.effective((data as any).template_type) });
      }
    },
    ...options,
  });
}

/**
 * Mutation hook for deleting email template
 */
export function useDeleteEmailTemplate(options: MutationOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => emailTemplatesAPI.delete(templateId),
    onSuccess: (data: unknown, templateId: string) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.emailTemplates.detail(templateId) });
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.lists() });
      // Invalidate all effective templates (in case this was the active one)
      queryClient.invalidateQueries({ queryKey: queryKeys.emailTemplates.all });
    },
    ...options,
  });
}

/**
 * Mutation hook for previewing email template with variables
 */
export function usePreviewEmailTemplate(options: MutationOptions = {}) {
  return useMutation({
    mutationFn: ({ id, variables }: PreviewTemplateVariables) => emailTemplatesAPI.preview(id, variables),
    ...options,
  });
}
