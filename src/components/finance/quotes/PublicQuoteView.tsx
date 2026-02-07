import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { QUOTE_STATUS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateUtils';
import quotesAPI from '../../../services/api/finance/quotes';

const PublicQuoteView: React.FC = () => {
  const { token } = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [token]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await (quotesAPI as any).getPublic(token);
      setQuote(data);
      if (data.status === (QUOTE_STATUS as any).ACCEPTED || data.status === (QUOTE_STATUS as any).REJECTED) {
        setActionComplete(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await (quotesAPI as any).acceptByToken(token, {});
      setActionComplete(true);
      loadQuote();
    } catch (err: any) {
      alert(err.message || 'Failed to accept quote');
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      setRejecting(true);
      await (quotesAPI as any).rejectByToken(token, { reason: rejectionReason });
      setActionComplete(true);
      loadQuote();
    } catch (err: any) {
      alert(err.message || 'Failed to reject quote');
    } finally {
      setRejecting(false);
    }
  };


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]"></div>
          <p className="mt-2 text-sm text-[#71717a]">Loading quote...</p>
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

  if (!quote) {
    return null;
  }

  const currencyCode = quote.currency_code || 'USD';
  const items = quote.items || [];
  const canRespond = !actionComplete && (quote.status === (QUOTE_STATUS as any).SENT || quote.status === 'viewed') && !quote.is_expired;

  // Calculate totals
  const subtotal = parseFloat(quote.subtotal || 0);
  const itemLevelTax = items.reduce((sum: number, item: any) => {
    const itemTax = item.taxes?.reduce((t: number, tax: any) => t + (tax.tax_amount || 0), 0) || parseFloat(item.tax_amount || 0);
    return sum + itemTax;
  }, 0);
  const hasTax = itemLevelTax > 0 || parseFloat(quote.tax_total || 0) > 0;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Content Section */}
      <div className="px-4 md:px-8 py-4">
        {/* Main Content - Quote and Actions side by side */}
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-4">
          {/* Main Quote Card */}
          <div className="flex-1 bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6 flex flex-col gap-6">
            {/* Header: Logo + Quote Number | Dates */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                {/* Company Logo */}
                {quote.company_logo_url && (
                  <img
                    src={quote.company_logo_url}
                    alt={quote.company_name || 'Company Logo'}
                    className="max-h-16 max-w-[200px] object-contain mb-4"
                  />
                )}
                <h2 className="text-[32px] font-semibold leading-[40px] text-[#09090b]">
                  {quote.quote_number}
                </h2>
              </div>
              <div className="flex flex-col gap-3 items-end">
                <div className="text-right">
                  <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Quote Date</p>
                  <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                    {formatDate(quote.issue_date)}
                  </p>
                </div>
                {quote.valid_until && (
                  <div className="text-right">
                    <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Valid Until</p>
                    <p className={`text-[16px] font-semibold leading-[24px] ${quote.is_expired ? 'text-red-600' : 'text-[#09090b]'}`}>
                      {formatDate(quote.valid_until)}
                      {quote.is_expired && ' (Expired)'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e5e5e5] w-full" />

            {/* From Section */}
            <div className="flex gap-8">
              {/* From */}
              <div className="flex-1 flex flex-col gap-[6px]">
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">From</p>
                <div className="flex flex-col gap-[2px]">
                  {/* Company Name */}
                  <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                    {quote.company_name || 'Company'}
                  </p>
                  {/* Company Address */}
                  {quote.company_address && (
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                      {quote.company_address}
                    </p>
                  )}
                  {/* Company Email */}
                  {quote.company_email && (
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                      {quote.company_email}
                    </p>
                  )}
                  {/* Company Phone */}
                  {quote.company_phone && (
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                      {quote.company_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Prepared For - if contact info available */}
              {(quote.contact_name || quote.contact_business_name) && (
                <div className="flex-1 flex flex-col gap-[6px]">
                  <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Prepared for</p>
                  <div className="flex flex-col gap-[2px]">
                    {/* Contact Name */}
                    <p className="text-[16px] font-semibold leading-[24px] text-[#09090b]">
                      {quote.contact_name || 'Client'}
                    </p>
                    {/* Business Name */}
                    {quote.contact_business_name && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {quote.contact_business_name}
                      </p>
                    )}
                    {/* Contact Address - Line 1 */}
                    {quote.contact_address && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {quote.contact_address}
                      </p>
                    )}
                    {/* Contact Address - Line 2 (if present) */}
                    {quote.contact_address_line_2 && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {quote.contact_address_line_2}
                      </p>
                    )}
                    {/* Contact Address - City, State */}
                    {(quote.contact_city || quote.contact_state) && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {[quote.contact_city, quote.contact_state].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {/* Contact Address - Postal Code, Country */}
                    {(quote.contact_postcode || quote.contact_country) && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        {[quote.contact_postcode?.trim(), quote.contact_country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {/* Tax Number */}
                    {quote.contact_tax_id && (
                      <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                        Tax Number: {quote.contact_tax_id}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e5e5e5] w-full" />

            {/* Quote Details */}
            <div className="flex flex-col gap-3">
              <p className="text-[16px] font-bold leading-[24px] text-[#09090b]">
                Quote Details
              </p>

              {/* Table */}
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
                      {hasTax && (
                        <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[98px]">
                          Tax
                        </th>
                      )}
                      <th className="px-3 py-4 text-left text-[14px] font-medium leading-[22px] text-[#71717a] w-[95px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={hasTax ? 6 : 5} className="px-3 py-8 text-center text-[14px] text-[#71717a]">
                          No items
                        </td>
                      </tr>
                    ) : (
                      items.map((item: any, index: number) => {
                        const itemAmount = parseFloat(item.amount || 0);
                        const itemTaxAmount = item.taxes?.reduce((sum: number, t: any) => sum + (t.tax_amount || 0), 0) || parseFloat(item.tax_amount || 0);
                        const itemTotal = itemAmount + itemTaxAmount;

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
                                {item.subtext && (
                                  <p className="text-[12px] text-[#71717a] mt-0.5 italic">{item.subtext}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {parseFloat(item.quantity || 0)}
                            </td>
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {formatCurrency(parseFloat(item.price || 0), currencyCode)}
                            </td>
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {formatCurrency(itemAmount, currencyCode)}
                            </td>
                            {hasTax && (
                              <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                                {formatCurrency(itemTaxAmount, currencyCode)}
                              </td>
                            )}
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b]">
                              {formatCurrency(itemTotal, currencyCode)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Details */}
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

              {/* Discount */}
              {parseFloat(quote.discount_amount || 0) > 0 && (
                <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                  <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                    Discount:
                  </span>
                  <span className="w-[216px] text-[16px] font-medium leading-[24px] text-red-600">
                    - {formatCurrency(parseFloat(quote.discount_amount), currencyCode)}
                  </span>
                </div>
              )}

              {/* Line Item Tax */}
              {parseFloat(quote.tax_total || 0) > 0 && (
                <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                  <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                    Tax (Line Items):
                  </span>
                  <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                    + {formatCurrency(parseFloat(quote.tax_total), currencyCode)}
                  </span>
                </div>
              )}

              {/* Document Tax */}
              {parseFloat(quote.document_tax_total || 0) > 0 && (
                <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                  <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                    Tax:
                  </span>
                  <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                    + {formatCurrency(parseFloat(quote.document_tax_total), currencyCode)}
                  </span>
                </div>
              )}

              {/* Total Amount */}
              <div className="flex items-center gap-4 px-4 py-2 bg-[#ddd6ff] text-right">
                <span className="w-[150px] text-[16px] font-bold leading-[24px] text-[#09090b]">
                  Total Amount:
                </span>
                <span className="w-[216px] text-[16px] font-bold leading-[24px] text-[#09090b]">
                  {formatCurrency(parseFloat(quote.total), currencyCode)}
                </span>
              </div>

              {/* Deposit Required */}
              {parseFloat(quote.deposit_amount || 0) > 0 && (
                <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] text-right">
                  <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b]">
                    Deposit Required:
                  </span>
                  <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b]">
                    {formatCurrency(parseFloat(quote.deposit_amount), currencyCode)}
                  </span>
                </div>
              )}
            </div>

            {/* Notes & Terms - Side by Side */}
            {(quote.notes || quote.terms) && (
              <div className="flex gap-8 pt-4 border-t border-[#e5e5e5]">
                {/* Notes Section */}
                {quote.notes && (
                  <div className="flex-1 flex flex-col gap-4">
                    <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
                      Notes
                    </p>
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                      {quote.notes}
                    </p>
                  </div>
                )}

                {/* Terms Section */}
                {quote.terms && (
                  <div className="flex-1 flex flex-col gap-4">
                    <p className="text-[14px] font-medium leading-[22px] text-[#09090b]">
                      Terms & Conditions
                    </p>
                    <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                      {quote.terms}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Section - Right Side */}
          {canRespond && (
            <div className="lg:w-[340px] lg:flex-shrink-0 bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6 flex flex-col gap-6 h-fit lg:sticky lg:top-4">
              <p className="text-[16px] font-bold leading-[24px] text-[#09090b]">
                Respond to Quote
              </p>

              {/* Quote Total Banner */}
              <div className="p-4 bg-[#f4f4f5] rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-[#71717a]">Quote Total:</span>
                  <span className="text-[20px] font-bold text-[#09090b]">
                    {formatCurrency(parseFloat(quote.total), currencyCode)}
                  </span>
                </div>
              </div>

              {/* Valid Until Reminder */}
              {quote.valid_until && !quote.is_expired && (
                <div className="p-3 bg-[#fef3c7] border border-[#fcd34d] rounded-lg">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-[#d97706] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-[#92400e]">
                        Valid until {formatDate(quote.valid_until)}
                      </p>
                      <p className="text-[12px] text-[#a16207] mt-0.5">
                        Please respond before the expiry date
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Initial state - show both buttons */}
              {!showAcceptConfirm && !showRejectForm && (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setShowAcceptConfirm(true)}
                    className="w-full px-4 py-3 bg-[#8e51ff] hover:bg-[#7a44db] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Accept Quote
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="w-full px-4 py-3 bg-[#f4f4f5] hover:bg-[#e5e5e5] text-[#09090b] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-5 w-5" />
                    Reject Quote
                  </button>
                </div>
              )}

              {/* Accept confirmation */}
              {showAcceptConfirm && (
                <div className="space-y-4">
                  <div className="p-3 bg-[#f5f0ff] border border-[#d4bfff] rounded-lg">
                    <p className="text-[13px] text-[#5b21b6]">
                      By accepting this quote, you agree to the terms and conditions outlined above.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAcceptConfirm(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-[#09090b] bg-[#f4f4f5] rounded-lg hover:bg-[#e5e5e5] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7a44db] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Accept
                    </button>
                  </div>
                </div>
              )}

              {/* Reject form */}
              {showRejectForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#09090b] mb-2">
                      Reason for Rejection
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
                      placeholder="Please let us know why you're rejecting this quote..."
                      rows={4}
                      className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg bg-white text-[#09090b] focus:outline-none focus:ring-2 focus:ring-[#8e51ff] resize-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      className="flex-1 px-4 py-2 text-sm font-medium text-[#09090b] bg-[#f4f4f5] rounded-lg hover:bg-[#e5e5e5] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={rejecting || !rejectionReason.trim()}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {rejecting && <Loader2 className="h-4 w-4 animate-spin" />}
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Complete - Right Side */}
          {actionComplete && (
            <div className={`lg:w-[340px] lg:flex-shrink-0 bg-white border-2 rounded-[12px] p-6 h-fit ${
              quote.status === (QUOTE_STATUS as any).ACCEPTED ? 'border-green-500' : 'border-red-300'
            }`}>
              <div className="flex flex-col items-center text-center gap-4">
                <div className={`p-3 rounded-full ${
                  quote.status === (QUOTE_STATUS as any).ACCEPTED ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {quote.status === (QUOTE_STATUS as any).ACCEPTED ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#09090b]">
                    {quote.status === (QUOTE_STATUS as any).ACCEPTED ? 'Quote Accepted!' : 'Quote Rejected'}
                  </h3>
                  <p className="text-sm text-[#71717a] mt-1">
                    {quote.status === (QUOTE_STATUS as any).ACCEPTED
                      ? "Thank you for accepting this quote. We'll be in touch soon."
                      : 'Thank you for your response.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Expired Quote - Right Side */}
          {quote.is_expired && !actionComplete && (
            <div className="lg:w-[340px] lg:flex-shrink-0 bg-white border-2 border-amber-300 rounded-[12px] p-6 h-fit">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#09090b]">Quote Expired</h3>
                  <p className="text-sm text-[#71717a] mt-1">
                    This quote has expired and can no longer be accepted. Please contact us for an updated quote.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicQuoteView;
