import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Send, Download, Copy, Trash2, DollarSign, Loader2, Repeat, FileEdit } from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { INVOICE_STATUS, INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import invoicesAPI from '../../../services/api/finance/invoices';
import InvoiceLineItems from './InvoiceLineItems';
import InvoiceTotals from './InvoiceTotals';
import RecurringInvoiceSettings from './RecurringInvoiceSettings';
import SendInvoiceDialog from './SendInvoiceDialog';
import InvoiceHistory from './InvoiceHistory';
import RecurringTemplateCard from './RecurringTemplateCard';
import AddPaymentModal from './AddPaymentModal';
import ConfirmationModal from '../../shared/ConfirmationModal';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteInvoice, cloneInvoice, updateInvoice, refresh } = useInvoices();
  const { showSuccess, showError } = useNotification();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    variant: 'primary',
    confirmText: 'Confirm'
  });

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const showConfirmation = (config) => {
    setConfirmModal({
      isOpen: true,
      ...config
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      variant: 'primary',
      confirmText: 'Confirm'
    });
  };

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await invoicesAPI.get(id);
      setInvoice(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      showError('Failed to load invoice');
      navigate('/finance/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const blob = await invoicesAPI.downloadPDF(id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showError('Failed to download invoice');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleClone = async () => {
    try {
      const cloned = await cloneInvoice(id);
      showSuccess('Invoice cloned successfully');
      navigate(`/finance/invoices/${cloned.id}/edit`);
    } catch (error) {
      console.error('Error cloning invoice:', error);
      showError('Failed to clone invoice');
    }
  };

  const handleDelete = () => {
    showConfirmation({
      title: 'Delete Invoice',
      message: `Are you sure you want to delete invoice ${invoice.invoice_number}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteInvoice(id);
          showSuccess('Invoice deleted successfully');
          navigate('/finance/invoices');
        } catch (error) {
          console.error('Error deleting invoice:', error);
          showError('Failed to delete invoice');
        }
      }
    });
  };

  const handlePaymentSuccess = () => {
    // Reload invoice to show updated paid_amount, outstanding_balance, and status
    loadInvoice();
    // Refresh invoice list context so changes are visible in the list
    refresh();
  };

  const handleMarkAsSent = () => {
    showConfirmation({
      title: 'Mark as Sent',
      message: `Mark invoice ${invoice.invoice_number} as sent? This will update the invoice status.`,
      variant: 'primary',
      confirmText: 'Mark as Sent',
      onConfirm: async () => {
        try {
          const updated = await updateInvoice(invoice.id, { status: 'sent' }, 'Marked as sent manually');
          setInvoice(updated);
          showSuccess('Invoice marked as sent');
        } catch (error) {
          console.error('Error marking invoice as sent:', error);
          showError('Failed to mark invoice as sent');
        }
      }
    });
  };

  const handleRevertToDraft = () => {
    showConfirmation({
      title: 'Revert to Draft',
      message: `Revert invoice ${invoice.invoice_number} to draft status? This will undo the sent status.`,
      variant: 'warning',
      confirmText: 'Revert to Draft',
      onConfirm: async () => {
        try {
          const updated = await updateInvoice(invoice.id, { status: 'draft' }, 'Reverted to draft manually');
          setInvoice(updated);
          showSuccess('Invoice reverted to draft');
        } catch (error) {
          console.error('Error reverting invoice to draft:', error);
          showError('Failed to revert invoice to draft');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
          <p className="mt-2 text-sm design-text-secondary">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  // Use the status directly from the backend API
  const status = invoice.status;

  return (
    <div className="min-h-screen design-bg-secondary py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/finance/invoices')}
            className="inline-flex items-center gap-2 text-sm design-text-secondary hover:design-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Invoices</span>
          </button>

          <div className="flex gap-2 flex-wrap">
            {parseFloat(invoice.outstanding_balance || 0) > 0 && status !== INVOICE_STATUS.CANCELLED && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                <DollarSign className="h-4 w-4 mr-1.5" />
                Add Payment
              </button>
            )}
            {status === INVOICE_STATUS.DRAFT && (
              <button
                onClick={handleMarkAsSent}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4 mr-1.5" />
                Mark as Sent
              </button>
            )}
            {status === INVOICE_STATUS.SENT && (
              <button
                onClick={handleRevertToDraft}
                className="inline-flex items-center px-3 py-2 text-sm font-medium design-text-primary design-bg-primary rounded-md border design-border hover:design-bg-tertiary transition-colors"
              >
                <FileEdit className="h-4 w-4 mr-1.5" />
                Revert to Draft
              </button>
            )}
            <button
              onClick={() => setShowSendModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Send className="h-4 w-4 mr-1.5" />
              Send Email
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center px-3 py-2 text-sm font-medium design-text-primary design-bg-primary rounded-md border design-border hover:design-bg-tertiary disabled:opacity-50 transition-colors"
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1.5" />
              )}
              PDF
            </button>
            <button
              onClick={() => navigate(`/finance/invoices/${id}/edit`)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium design-text-primary design-bg-primary rounded-md border design-border hover:design-bg-tertiary transition-colors"
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </button>
            <button
              onClick={handleClone}
              className="inline-flex items-center px-3 py-2 text-sm font-medium design-text-primary design-bg-primary rounded-md border design-border hover:design-bg-tertiary transition-colors"
            >
              <Copy className="h-4 w-4 mr-1.5" />
              Clone
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 design-bg-primary rounded-md border design-border hover:design-bg-tertiary dark:text-red-400 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="design-bg-primary rounded-lg shadow-lg p-8 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-8 border-b design-border">
          <div>
            <h1 className="text-3xl font-bold design-text-primary mb-2">
              Invoice {invoice.invoice_number}
            </h1>
            <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${INVOICE_STATUS_COLORS[status]}`}>
              {INVOICE_STATUS_LABELS[status] || status}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm design-text-secondary">Invoice Date</div>
            <div className="text-lg font-medium design-text-primary">
              {new Date(invoice.issue_date || invoice.invoice_date).toLocaleDateString()}
            </div>
            {invoice.due_date && (
              <>
                <div className="text-sm design-text-secondary mt-2">Due Date</div>
                <div className="text-lg font-medium design-text-primary">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </div>
              </>
            )}
          </div>
        </div>

        {/* From/To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-sm design-text-secondary mb-2">From</div>
            <div className="text-lg font-medium design-text-primary">
              {invoice.company?.name || invoice.created_by_user?.email || 'Your Company'}
            </div>
            {(invoice.company?.email || invoice.created_by_user?.email) && (
              <div className="design-text-secondary">{invoice.company?.email || invoice.created_by_user?.email}</div>
            )}
            {invoice.company?.address && (
              <div className="design-text-secondary mt-1">{invoice.company.address}</div>
            )}
          </div>
          <div>
            <div className="text-sm design-text-secondary mb-2">Bill To</div>
            <div className="text-lg font-medium design-text-primary">
              {invoice.contact ? `${invoice.contact.first_name} ${invoice.contact.last_name}` : 'N/A'}
            </div>
            {invoice.contact?.business_name && (
              <div className="design-text-secondary">{invoice.contact.business_name}</div>
            )}
            {invoice.contact?.email && (
              <div className="design-text-secondary">{invoice.contact.email}</div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <InvoiceLineItems
            items={invoice.invoice_items || invoice.items || []}
            onChange={() => {}}
            currency={invoice.currency?.code || 'USD'}
            taxRate={invoice.tax_rate}
            discountType={invoice.discount_type}
            discountValue={invoice.discount_value}
            readOnly={true}
          />
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full md:w-96">
            <InvoiceTotals
              items={invoice.invoice_items || invoice.items || []}
              currency={invoice.currency?.code || 'USD'}
              taxRate={invoice.tax_rate || 0}
              taxLabel={invoice.tax_label}
              discountType={invoice.discount_type}
              discountValue={invoice.discount_value || 0}
              depositType={invoice.deposit_type}
              depositValue={invoice.deposit_value || 0}
              readOnly={true}
            />
          </div>
        </div>

        {/* Payment Summary with Outstanding Balance */}
        <div className="mb-8 p-6 rounded-lg design-bg-secondary border design-border">
          <h3 className="text-sm font-medium design-text-primary mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="design-text-secondary">Total Amount</span>
              <span className="font-medium design-text-primary">
                {formatCurrency(invoice.total, invoice.currency?.code)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="design-text-secondary">Amount Paid</span>
              <span className="font-medium design-text-primary">
                {formatCurrency(invoice.paid_amount || 0, invoice.currency?.code)}
              </span>
            </div>

            <div className="pt-3 border-t design-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold design-text-primary">Outstanding Balance</span>
                <span className={`text-lg font-bold ${
                  (() => {
                    const balance = invoice.outstanding_balance !== undefined
                      ? parseFloat(invoice.outstanding_balance)
                      : parseFloat(invoice.total) - parseFloat(invoice.paid_amount || 0);
                    return balance > 0
                      ? 'text-red-600 dark:text-red-400'
                      : balance < 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400';
                  })()
                }`}>
                  {(() => {
                    const balance = invoice.outstanding_balance !== undefined
                      ? parseFloat(invoice.outstanding_balance)
                      : parseFloat(invoice.total) - parseFloat(invoice.paid_amount || 0);

                    if (balance > 0) {
                      return <>{formatCurrency(balance, invoice.currency?.code)} Due</>;
                    } else if (balance < 0) {
                      return <>{formatCurrency(Math.abs(balance), invoice.currency?.code)} Credit</>;
                    } else {
                      return 'Paid in Full';
                    }
                  })()}
                </span>
              </div>
              {(() => {
                const balance = invoice.outstanding_balance !== undefined
                  ? parseFloat(invoice.outstanding_balance)
                  : parseFloat(invoice.total) - parseFloat(invoice.paid_amount || 0);
                return balance < 0;
              })() && (
                <p className="text-xs design-text-secondary mt-2">
                  Customer has a credit that can be applied to future invoices or refunded
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recurring Template Management */}
        {(invoice.pricing_type === 'recurring' || invoice.is_recurring) && (
          <RecurringTemplateCard invoice={invoice} onUpdate={loadInvoice} />
        )}

        {/* Generated Invoice Badge */}
        {invoice.generated_from_template && (
          <div className="mb-8 p-4 rounded-lg design-bg-secondary border design-border">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm design-text-secondary">
                Generated from template (Invoice #{invoice.recurrence_sequence_number || 'N/A'})
              </span>
              {invoice.parent_invoice_id && (
                <a
                  href={`/finance/invoices/${invoice.parent_invoice_id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/finance/invoices/${invoice.parent_invoice_id}`);
                  }}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline ml-2"
                >
                  View Template
                </a>
              )}
            </div>
          </div>
        )}

        {/* Recurring Settings */}
        {invoice.is_recurring && (
          <div className="mb-8">
            <RecurringInvoiceSettings
              isRecurring={invoice.is_recurring}
              recurringType={invoice.recurring_type}
              recurringEvery={invoice.recurring_every}
              recurringPeriod={invoice.recurring_period}
              recurringEndDate={invoice.recurring_end_date}
              recurringOccurrences={invoice.recurring_occurrences}
              startDate={invoice.issue_date || invoice.invoice_date}
              onChange={() => {}}
              readOnly={true}
            />
          </div>
        )}

        {/* Notes and Terms */}
        {(invoice.notes || invoice.terms) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t design-border">
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-medium design-text-primary mb-2">Notes</h3>
                <p className="text-sm design-text-secondary whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h3 className="text-sm font-medium design-text-primary mb-2">Terms & Conditions</h3>
                <p className="text-sm design-text-secondary whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

        {/* Change History */}
        <div className="design-bg-primary rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-bold design-text-primary mb-6">Change History</h3>
          <InvoiceHistory invoiceId={invoice.id} />
        </div>
      </div>

      {/* Send Dialog */}
      <SendInvoiceDialog
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        invoice={invoice}
        contact={invoice.contact}
        onSuccess={loadInvoice}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={invoice}
        onSuccess={handlePaymentSuccess}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
      />
    </div>
  );
};

export default InvoiceDetail;
