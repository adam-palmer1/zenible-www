import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { QUOTE_STATUS, QUOTE_STATUS_COLORS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import quotesAPI from '../../../services/api/finance/quotes';
import InvoiceLineItems from '../invoices/InvoiceLineItems';
import InvoiceTotals from '../invoices/InvoiceTotals';

const PublicQuoteView = () => {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [token]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quotesAPI.getPublic(token);
      setQuote(data);
      if (data.status === QUOTE_STATUS.ACCEPTED || data.status === QUOTE_STATUS.REJECTED) {
        setActionComplete(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setAccepting(true);
      await quotesAPI.acceptByToken(token, { accepted_at: new Date().toISOString() });
      setActionComplete(true);
      loadQuote();
    } catch (err) {
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
      await quotesAPI.rejectByToken(token, { reason: rejectionReason, rejected_at: new Date().toISOString() });
      setActionComplete(true);
      loadQuote();
    } catch (err) {
      alert(err.message || 'Failed to reject quote');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center design-bg-secondary">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-zenible-primary"></div>
          <p className="mt-4 text-lg design-text-secondary">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center design-bg-secondary">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold design-text-primary mb-2">Error</h1>
          <p className="design-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="min-h-screen design-bg-secondary py-12">
      <div className="max-w-4xl mx-auto px-4">
        {actionComplete && (
          <div className={`mb-6 design-bg-primary rounded-lg shadow-lg p-6 border-l-4 ${quote.status === QUOTE_STATUS.ACCEPTED ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-center gap-3">
              {quote.status === QUOTE_STATUS.ACCEPTED ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="text-lg font-semibold design-text-primary">Quote Accepted!</h3>
                    <p className="text-sm design-text-secondary mt-1">Thank you for accepting this quote. We'll be in touch soon.</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <h3 className="text-lg font-semibold design-text-primary">Quote Rejected</h3>
                    <p className="text-sm design-text-secondary mt-1">Thank you for your response.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="design-bg-primary rounded-lg shadow-lg p-8">
          <div className="flex items-start justify-between mb-8 pb-8 border-b design-border">
            <div>
              <h1 className="text-3xl font-bold design-text-primary mb-2">Quote {quote.quote_number}</h1>
              <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${QUOTE_STATUS_COLORS[quote.status]}`}>{quote.status}</span>
            </div>
            <div className="text-right">
              <div className="text-sm design-text-secondary">Quote Date</div>
              <div className="text-lg font-medium design-text-primary">{new Date(quote.quote_date).toLocaleDateString()}</div>
              {quote.valid_until && (
                <>
                  <div className="text-sm design-text-secondary mt-2">Valid Until</div>
                  <div className="text-lg font-medium design-text-primary">{new Date(quote.valid_until).toLocaleDateString()}</div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-sm design-text-secondary mb-2">From</div>
              <div className="text-lg font-medium design-text-primary">{quote.company?.name || 'Company Name'}</div>
              {quote.company?.email && <div className="design-text-secondary">{quote.company.email}</div>}
            </div>
            <div>
              <div className="text-sm design-text-secondary mb-2">For</div>
              <div className="text-lg font-medium design-text-primary">{quote.contact ? `${quote.contact.first_name} ${quote.contact.last_name}` : 'N/A'}</div>
              {quote.contact?.business_name && <div className="design-text-secondary">{quote.contact.business_name}</div>}
            </div>
          </div>

          <div className="mb-8">
            <InvoiceLineItems items={quote.items || []} onChange={() => {}} currency={quote.currency} taxRate={quote.tax_rate} discountType={quote.discount_type} discountValue={quote.discount_value} readOnly={true} />
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-full md:w-96">
              <InvoiceTotals items={quote.items || []} currency={quote.currency} taxRate={quote.tax_rate || 0} taxLabel={quote.tax_label} discountType={quote.discount_type} discountValue={quote.discount_value || 0} readOnly={true} />
            </div>
          </div>

          {quote.terms && (
            <div className="pt-8 border-t design-border">
              <h3 className="text-sm font-medium design-text-primary mb-2">Terms & Conditions</h3>
              <p className="text-sm design-text-secondary whitespace-pre-wrap">{quote.terms}</p>
            </div>
          )}
        </div>

        {!actionComplete && quote.status === QUOTE_STATUS.SENT && (
          <div className="mt-6 design-bg-primary rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold design-text-primary mb-6">Accept or Reject Quote</h2>

            {!showRejectForm ? (
              <div className="flex gap-4">
                <button onClick={handleAccept} disabled={accepting} className="flex-1 inline-flex justify-center items-center px-6 py-3 text-lg font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50">
                  {accepting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                  Accept Quote
                </button>
                <button onClick={() => setShowRejectForm(true)} className="flex-1 inline-flex justify-center items-center px-6 py-3 text-lg font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject Quote
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium design-text-primary mb-2">Reason for Rejection</label>
                  <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Please provide a reason..." rows={4} className="w-full px-3 py-2 design-input rounded-md resize-none" />
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowRejectForm(false)} className="flex-1 px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary">
                    Cancel
                  </button>
                  <button onClick={handleReject} disabled={rejecting || !rejectionReason.trim()} className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
                    {rejecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicQuoteView;
