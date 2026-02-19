import { useQuery } from '@tanstack/react-query';
import invoicesAPI from '../../services/api/finance/invoices';

interface PaymentReceiptPreview {
  subject: string;
  body: string;
}

interface PaymentReceiptData {
  payment_amount?: number;
  payment_date?: string;
  payment_method?: string;
  transaction_id?: string;
}

interface UsePaymentReceiptPreviewOptions {
  enabled?: boolean;
  paymentData?: PaymentReceiptData | null;
}

/**
 * React Query hook to fetch a rendered payment receipt email preview.
 * Calls POST /crm/invoices/{id}/preview-payment-receipt to get the template
 * with all variables (invoice number, payment amount, etc.) resolved.
 */
export function usePaymentReceiptPreview(
  invoiceId: string | undefined,
  options: UsePaymentReceiptPreviewOptions = {}
) {
  const { paymentData } = options;

  return useQuery<PaymentReceiptPreview>({
    queryKey: ['invoices', invoiceId, 'payment-receipt-preview', paymentData ?? {}],
    queryFn: async () => {
      if (!invoiceId) throw new Error('Invoice ID is required');
      return await invoicesAPI.previewPaymentReceipt(invoiceId, paymentData ?? {});
    },
    enabled: !!invoiceId && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
}
