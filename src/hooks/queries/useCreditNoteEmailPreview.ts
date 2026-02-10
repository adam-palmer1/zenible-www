import { useQuery } from '@tanstack/react-query';
import creditNotesAPI from '../../services/api/finance/creditNotes';

interface CreditNoteEmailPreview {
  subject: string;
  body: string;
}

interface UseCreditNoteEmailPreviewOptions {
  enabled?: boolean;
}

/**
 * React Query hook to fetch a rendered email preview for a credit note.
 * Calls POST /crm/credit-notes/{id}/preview-email to get the template
 * with all variables (e.g. {{credit_note_number}}, {{company_name}}) resolved.
 */
export function useCreditNoteEmailPreview(
  creditNoteId: string | undefined,
  options: UseCreditNoteEmailPreviewOptions = {}
) {
  return useQuery<CreditNoteEmailPreview>({
    queryKey: ['credit-notes', creditNoteId, 'email-preview'],
    queryFn: async () => {
      if (!creditNoteId) throw new Error('Credit Note ID is required');
      return await creditNotesAPI.previewEmail(creditNoteId);
    },
    enabled: !!creditNoteId && (options.enabled ?? true),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
