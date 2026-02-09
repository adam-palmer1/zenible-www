import { useQuery } from '@tanstack/react-query';
import quotesAPI from '../../services/api/finance/quotes';

interface QuoteEmailPreview {
  subject: string;
  body: string;
}

interface UseQuoteEmailPreviewOptions {
  enabled?: boolean;
}

/**
 * React Query hook to fetch a rendered email preview for a quote.
 * Calls POST /crm/quotes/{id}/preview-email to get the template
 * with all variables (e.g. {{quote_number}}, {{company_name}}) resolved.
 */
export function useQuoteEmailPreview(
  quoteId: string | undefined,
  options: UseQuoteEmailPreviewOptions = {}
) {
  return useQuery<QuoteEmailPreview>({
    queryKey: ['quotes', quoteId, 'email-preview'],
    queryFn: async () => {
      if (!quoteId) throw new Error('Quote ID is required');
      return await quotesAPI.previewEmail(quoteId);
    },
    enabled: !!quoteId && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
