import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Send, Download, Copy, Trash2, FileText, CheckCircle, XCircle, Loader2, FolderKanban } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { QUOTE_STATUS, QUOTE_STATUS_COLORS } from '../../../constants/finance';
import quotesAPI from '../../../services/api/finance/quotes';
import InvoiceLineItems from '../invoices/InvoiceLineItems';
import InvoiceTotals from '../invoices/InvoiceTotals';
import SendQuoteModal from './SendQuoteModal';
import ConvertToInvoiceModal from './ConvertToInvoiceModal';
import { AllocationSummaryBar, ProjectAllocationModal } from '../allocations';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteQuote, cloneQuote, acceptQuote, rejectQuote } = useQuotes();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  useEffect(() => {
    loadQuote();
  }, [id]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      const data = await quotesAPI.get(id);
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
      showError('Failed to load quote');
      navigate('/finance/quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await quotesAPI.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Quote downloaded successfully');
    } catch (error) {
      showError('Failed to download quote');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleClone = async () => {
    try {
      const cloned = await cloneQuote(id);
      showSuccess('Quote cloned successfully');
      navigate(`/finance/quotes/${cloned.id}/edit`);
    } catch (error) {
      showError('Failed to clone quote');
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm('Delete Quote', `Are you sure you want to delete quote ${quote.quote_number}?`);
    if (confirmed) {
      try {
        await deleteQuote(id);
        showSuccess('Quote deleted successfully');
        navigate('/finance/quotes');
      } catch (error) {
        showError('Failed to delete quote');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
          <p className="mt-2 text-sm design-text-secondary">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/finance/quotes')} className="flex items-center gap-2 design-text-secondary hover:design-text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Quotes</span>
        </button>

        <div className="flex gap-2">
          {quote.status === QUOTE_STATUS.ACCEPTED && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Convert to Invoice
            </button>
          )}
          <button onClick={() => setShowSendModal(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            <Send className="h-4 w-4 mr-2" />
            Send
          </button>
          <button onClick={handleDownloadPdf} disabled={downloadingPdf} className="inline-flex items-center px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary disabled:opacity-50">
            {downloadingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            PDF
          </button>
          <button onClick={() => navigate(`/finance/quotes/${id}/edit`)} className="inline-flex items-center px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button onClick={handleClone} className="inline-flex items-center px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary">
            <Copy className="h-4 w-4 mr-2" />
            Clone
          </button>
          <button onClick={() => setShowProjectModal(true)} className="inline-flex items-center px-4 py-2 text-sm font-medium design-text-primary design-bg-secondary rounded-md hover:design-bg-tertiary">
            <FolderKanban className="h-4 w-4 mr-2" />
            Projects
          </button>
          <button onClick={handleDelete} className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 design-bg-secondary rounded-md hover:design-bg-tertiary dark:text-red-400">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="design-bg-primary rounded-lg shadow-sm p-8">
        <div className="flex items-start justify-between mb-8 pb-8 border-b design-border">
          <div>
            <h1 className="text-3xl font-bold design-text-primary mb-2">Quote {quote.quote_number}</h1>
            <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${QUOTE_STATUS_COLORS[quote.status]}`}>
              {quote.status}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm design-text-secondary">Quote Date</div>
            <div className="text-lg font-medium design-text-primary">
              {new Date(quote.issue_date || quote.quote_date).toLocaleDateString()}
            </div>
            {(quote.valid_until || quote.expiry_date) && (
              <>
                <div className="text-sm design-text-secondary mt-2">Valid Until</div>
                <div className="text-lg font-medium design-text-primary">
                  {new Date(quote.valid_until || quote.expiry_date).toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="text-sm design-text-secondary mb-2">Client</div>
          <div className="text-lg font-medium design-text-primary">{quote.contact ? `${quote.contact.first_name} ${quote.contact.last_name}` : 'N/A'}</div>
          {quote.contact?.business_name && <div className="design-text-secondary">{quote.contact.business_name}</div>}
          {quote.contact?.email && <div className="design-text-secondary">{quote.contact.email}</div>}
        </div>

        <div className="mb-8">
          <InvoiceLineItems
            items={quote.quote_items || quote.items || []}
            onChange={() => {}}
            currency={quote.currency?.code || quote.currency}
            taxRate={quote.tax_rate}
            discountType={quote.discount_type}
            discountValue={quote.discount_value}
            readOnly={true}
          />
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-full md:w-96">
            <InvoiceTotals
              items={quote.quote_items || quote.items || []}
              currency={quote.currency?.code || quote.currency}
              taxRate={quote.tax_rate || 0}
              taxLabel={quote.tax_label}
              discountType={quote.discount_type}
              discountValue={quote.discount_value || 0}
              readOnly={true}
            />
          </div>
        </div>

        {/* Project Allocations */}
        <div className="mb-8">
          <AllocationSummaryBar
            allocations={quote.project_allocations || []}
            totalAmount={parseFloat(quote.total) || 0}
            currency={quote.currency?.code || quote.currency || 'GBP'}
            onManageClick={() => setShowProjectModal(true)}
            showManageButton={true}
          />
        </div>

        {(quote.notes || quote.terms) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t design-border">
            {quote.notes && (
              <div>
                <h3 className="text-sm font-medium design-text-primary mb-2">Notes</h3>
                <p className="text-sm design-text-secondary whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
            {quote.terms && (
              <div>
                <h3 className="text-sm font-medium design-text-primary mb-2">Terms & Conditions</h3>
                <p className="text-sm design-text-secondary whitespace-pre-wrap">{quote.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <SendQuoteModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} quote={quote} />
      <ConvertToInvoiceModal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} quote={quote} />
      <ProjectAllocationModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
        entityType="quote"
        entityId={quote.id}
        entityName={`Quote #${quote.quote_number}`}
        entityAmount={parseFloat(quote.total) || 0}
        currency={quote.currency?.code || quote.currency || 'GBP'}
        currentAllocations={quote.project_allocations || []}
        onUpdate={loadQuote}
      />
    </div>
  );
};

export default QuoteDetail;
