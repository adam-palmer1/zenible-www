import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, FileText, Download } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateUtils';
import creditNotesAPI from '../../../services/api/finance/creditNotes';
import { API_BASE_URL } from '../../../config/api';

interface PublicCreditNoteItem {
  name?: string;
  description?: string;
  quantity?: string | number;
  price?: string | number;
  amount?: string | number;
}

interface PublicCreditNoteData {
  id: string;
  credit_note_number: string;
  status: string;
  issue_date: string;
  reference?: string | null;
  reason?: string | null;
  subtotal: string | number;
  total: string | number;
  applied_amount: string | number;
  remaining_amount: string | number;
  currency_code: string;
  company_name: string;
  company_logo_url?: string | null;
  company_address?: string | null;
  company_city?: string | null;
  company_state?: string | null;
  company_postal_code?: string | null;
  company_country?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  contact_name?: string | null;
  contact_business_name?: string | null;
  contact_email?: string | null;
  contact_address?: string | null;
  contact_city?: string | null;
  contact_state?: string | null;
  contact_postcode?: string | null;
  contact_country?: string | null;
  contact_tax_id?: string | null;
  notes?: string | null;
  items?: PublicCreditNoteItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-[#71717a]', bg: 'bg-[#f4f4f5]' },
  issued: { label: 'Issued', color: 'text-[#1d4ed8]', bg: 'bg-[#dbeafe]' },
  applied: { label: 'Applied', color: 'text-[#15803d]', bg: 'bg-[#dcfce7]' },
  void: { label: 'Void', color: 'text-[#dc2626]', bg: 'bg-[#fee2e2]' },
};

const PublicCreditNoteView: React.FC = () => {
  const { token } = useParams();
  const [creditNote, setCreditNote] = useState<PublicCreditNoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCreditNote();
  }, [token]);

  const loadCreditNote = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await creditNotesAPI.getPublic(token!) as PublicCreditNoteData;
      setCreditNote(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load credit note');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!token) return;
    window.open(`${API_BASE_URL}/credit-notes/${token}/pdf`, '_blank');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]"></div>
          <p className="mt-2 text-sm text-[#71717a]">Loading credit note...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#09090b] mb-2">Error</h1>
          <p className="text-[#71717a]">{error}</p>
        </div>
      </div>
    );
  }

  if (!creditNote) {
    return null;
  }

  const currencyCode = creditNote.currency_code || 'USD';
  const items = (creditNote.items || []) as PublicCreditNoteItem[];
  const statusConfig = STATUS_LABELS[creditNote.status] || STATUS_LABELS.draft;

  // Calculate totals
  const subtotal = parseFloat(String(creditNote.subtotal || '0'));

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Content Section */}
      <div className="px-4 md:px-8 py-4">
        {/* Main Content - Credit Note and Sidebar */}
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-4">
          {/* Main Credit Note Card */}
          <div className="flex-1 bg-white border-2 border-[#e5e5e5] rounded-[12px] p-4 md:p-6 flex flex-col gap-6">
            {/* Header: Logo + Credit Note Number | Date & Status */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                {/* Company Logo */}
                {creditNote.company_logo_url && (
                  <img
                    src={creditNote.company_logo_url}
                    alt={creditNote.company_name || 'Company Logo'}
                    className="max-h-16 max-w-[200px] object-contain mb-4"
                  />
                )}
                <h2 className="text-[32px] font-semibold leading-[40px] text-[#09090b]">
                  {creditNote.credit_note_number}
                </h2>
                <p className="text-[14px] font-normal leading-[22px] text-[#71717a] mt-1">
                  Credit Note
                </p>
              </div>
              <div className="flex flex-col gap-3 items-end">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                <div className="text-right">
                  <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Issue Date</p>
                  <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                    {formatDate(creditNote.issue_date)}
                  </p>
                </div>
                {creditNote.reference && (
                  <div className="text-right">
                    <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Reference</p>
                    <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
                      {creditNote.reference}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e5e5e5] w-full" />

            {/* From / To Section */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              {/* From */}
              <div className="flex-1 flex flex-col gap-[6px]">
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">From</p>
                <div className="flex flex-col gap-[2px]">
                  <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                    {creditNote.company_name || 'Company'}
                  </p>
                  {creditNote.company_address && (
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                      {creditNote.company_address}
                    </p>
                  )}
                  {(creditNote.company_city || creditNote.company_state) && (
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                      {[creditNote.company_city, creditNote.company_state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {(creditNote.company_postal_code || creditNote.company_country) && (
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                      {[creditNote.company_postal_code, creditNote.company_country].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {creditNote.company_email && (
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                      {creditNote.company_email}
                    </p>
                  )}
                  {creditNote.company_phone && (
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                      {creditNote.company_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Credited To */}
              {(creditNote.contact_name || creditNote.contact_business_name) && (
                <div className="flex-1 flex flex-col gap-[6px]">
                  <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Credited to</p>
                  <div className="flex flex-col gap-[2px]">
                    <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                      {creditNote.contact_name || 'Client'}
                    </p>
                    {creditNote.contact_business_name && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {creditNote.contact_business_name}
                      </p>
                    )}
                    {creditNote.contact_address && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {creditNote.contact_address}
                      </p>
                    )}
                    {(creditNote.contact_city || creditNote.contact_state) && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {[creditNote.contact_city, creditNote.contact_state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {(creditNote.contact_postcode || creditNote.contact_country) && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {[creditNote.contact_postcode?.trim(), creditNote.contact_country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {creditNote.contact_tax_id && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        Tax Number: {creditNote.contact_tax_id}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reason */}
            {creditNote.reason && (
              <>
                <div className="h-px bg-[#e5e5e5] w-full" />
                <div className="flex flex-col gap-2">
                  <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">Reason</p>
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                    {creditNote.reason}
                  </p>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="h-px bg-[#e5e5e5] w-full" />

            {/* Line Items */}
            <div className="flex flex-col gap-3">
              <p className="text-[16px] font-bold leading-[24px] text-[#09090b]">
                Credit Note Details
              </p>

              <div className="w-full overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-[#e5e5e5]">
                      <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a]">
                        Description
                      </th>
                      <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                        Quantity
                      </th>
                      <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                        Price
                      </th>
                      <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[95px]">
                        Amount
                      </th>
                      <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[95px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-[14px] text-[#71717a]">
                          No items
                        </td>
                      </tr>
                    ) : (
                      items.map((item: PublicCreditNoteItem, index: number) => {
                        const itemAmount = parseFloat(String(item.amount || 0));

                        return (
                          <tr key={index} className="border-b border-[#e5e5e5] bg-white">
                            <td className="px-3 py-4">
                              <div>
                                <span className="text-[14px] font-normal leading-[22px] text-[#09090b]">
                                  {item.name || item.description}
                                </span>
                                {item.description && item.description !== item.name && (
                                  <p className="text-[12px] text-[#71717a] mt-0.5">{item.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {parseFloat(String(item.quantity || 0))}
                            </td>
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {formatCurrency(parseFloat(String(item.price || 0)), currencyCode)}
                            </td>
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {formatCurrency(itemAmount, currencyCode)}
                            </td>
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {formatCurrency(itemAmount, currencyCode)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Totals */}
            <div className="flex flex-col items-end">
              {/* Sub Total */}
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                  Sub Total:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                  {formatCurrency(subtotal, currencyCode)}
                </span>
              </div>

              {/* Total Credit */}
              <div className="flex items-center gap-4 px-4 py-2 bg-[#ddd6ff] text-right">
                <span className="w-[150px] text-[16px] font-bold leading-[24px] text-[#09090b]">
                  Total Credit:
                </span>
                <span className="w-[216px] text-[16px] font-bold leading-[24px] text-[#09090b]">
                  {formatCurrency(parseFloat(String(creditNote.total)), currencyCode)}
                </span>
              </div>

              {/* Applied Amount */}
              {parseFloat(String(creditNote.applied_amount || '0')) > 0 && (
                <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                  <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                    Applied:
                  </span>
                  <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                    {formatCurrency(parseFloat(String(creditNote.applied_amount)), currencyCode)}
                  </span>
                </div>
              )}

              {/* Remaining Amount */}
              {parseFloat(String(creditNote.remaining_amount || '0')) > 0 && (
                <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                  <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                    Remaining:
                  </span>
                  <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                    {formatCurrency(parseFloat(String(creditNote.remaining_amount)), currencyCode)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {creditNote.notes && (
              <div className="flex flex-col gap-4 pt-4 border-t border-[#e5e5e5]">
                <div className="flex flex-col gap-2">
                  <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
                    Notes
                  </p>
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                    {creditNote.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Credit Note Summary */}
          <div className="lg:w-[340px] lg:flex-shrink-0 bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6 flex flex-col gap-6 h-fit lg:sticky lg:top-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#8e51ff]" />
              <p className="text-[16px] font-bold leading-[24px] text-[#09090b]">
                Credit Note Summary
              </p>
            </div>

            {/* Total Banner */}
            <div className="p-4 bg-[#f5f0ff] border border-[#d4bfff] rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#5b21b6]">Total Credit:</span>
                <span className="text-[20px] font-bold text-[#5b21b6]">
                  {formatCurrency(parseFloat(String(creditNote.total)), currencyCode)}
                </span>
              </div>
            </div>

            {/* Status Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#71717a]">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[13px] font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </div>

              {parseFloat(String(creditNote.applied_amount || '0')) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#71717a]">Applied:</span>
                  <span className="text-[14px] font-medium text-[#09090b]">
                    {formatCurrency(parseFloat(String(creditNote.applied_amount)), currencyCode)}
                  </span>
                </div>
              )}

              {parseFloat(String(creditNote.remaining_amount || '0')) > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#71717a]">Remaining:</span>
                  <span className="text-[14px] font-medium text-[#15803d]">
                    {formatCurrency(parseFloat(String(creditNote.remaining_amount)), currencyCode)}
                  </span>
                </div>
              )}
            </div>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              className="w-full px-4 py-3 bg-[#f4f4f5] hover:bg-[#e5e5e5] text-[#09090b] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicCreditNoteView;
