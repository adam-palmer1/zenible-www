import { useQuery } from '@tanstack/react-query';
import invoicesAPI from '../../services/api/finance/invoices';

interface InvoiceEmailPreview {
  subject: string;
  body: string;
}

interface UseInvoiceEmailPreviewOptions {
  enabled?: boolean;
}

/**
 * React Query hook to fetch a rendered email preview for an invoice.
 * Calls POST /crm/invoices/{id}/preview-email to get the template
 * with all variables (invoice number, company name, etc.) resolved.
 */
export function useInvoiceEmailPreview(
  invoiceId: string | undefined,
  options: UseInvoiceEmailPreviewOptions = {}
) {
  return useQuery<InvoiceEmailPreview>({
    queryKey: ['invoices', invoiceId, 'email-preview'],
    queryFn: async () => {
      if (!invoiceId) throw new Error('Invoice ID is required');
      return await invoicesAPI.previewEmail(invoiceId, {});
    },
    enabled: !!invoiceId && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}
