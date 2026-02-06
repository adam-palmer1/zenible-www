import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Repeat, Plus, AlertTriangle, Clock, Eye, ChevronDown, ChevronUp, Monitor, Smartphone } from 'lucide-react';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { INVOICE_STATUS, INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import invoicesAPI from '../../../services/api/finance/invoices';
import companiesAPI from '../../../services/api/crm/companies';
import RecurringInvoiceSettings from './RecurringInvoiceSettings';
import SendInvoiceDialog from './SendInvoiceDialog';
import SendReminderDialog from './SendReminderDialog';
import InvoiceHistory from './InvoiceHistory';
import RecurringTemplateCard from './RecurringTemplateCard';
import AddPaymentModal from './AddPaymentModal';
import LinkPaymentModal from './LinkPaymentModal';
import InvoiceActionsMenu from './InvoiceActionsMenu';
import ConfirmationModal from '../../shared/ConfirmationModal';
import AssignExpenseModal from '../expenses/AssignExpenseModal';
import { ProjectAllocationModal } from '../allocations';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteInvoice, cloneInvoice, updateInvoice, refresh } = useInvoices();
  const { showSuccess, showError } = useNotification();
  const { getCountryById } = useCRMReferenceData();

  const [invoice, setInvoice] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLinkPaymentModal, setShowLinkPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Charge card modal state
  const [showChargeCardModal, setShowChargeCardModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState('full'); // 'full' or 'deposit'
  const [chargingCard, setChargingCard] = useState(false);

  // View history state
  const [viewHistory, setViewHistory] = useState(null);
  const [loadingViewHistory, setLoadingViewHistory] = useState(false);
  const [viewHistoryExpanded, setViewHistoryExpanded] = useState(false);

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
    loadCompany();
  }, [id]);

  const loadCompany = async () => {
    try {
      const data = await companiesAPI.getCurrent();
      setCompany(data);
    } catch (error) {
      console.error('Error loading company:', error);
      // Non-critical, don't show error to user
    }
  };

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

  const loadViewHistory = async () => {
    try {
      setLoadingViewHistory(true);
      const data = await invoicesAPI.getViewHistory(id);
      setViewHistory(data);
    } catch (error) {
      console.error('Error loading view history:', error);
      // Non-critical, don't show error to user
    } finally {
      setLoadingViewHistory(false);
    }
  };

  // Load view history when expanded
  useEffect(() => {
    if (viewHistoryExpanded && !viewHistory && !loadingViewHistory) {
      loadViewHistory();
    }
  }, [viewHistoryExpanded]);

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
    loadInvoice();
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

  const handleChargeCard = () => {
    const depositAmount = parseFloat(invoice.deposit_amount || 0);
    const paidAmount = parseFloat(invoice.paid_amount || 0);
    const hasUnpaidDeposit = depositAmount > 0 && paidAmount < depositAmount;

    if (hasUnpaidDeposit) {
      // Show modal with deposit vs full amount options
      setChargeAmount('deposit');
      setShowChargeCardModal(true);
    } else {
      // No deposit or deposit already paid - charge full outstanding balance
      const outstandingBalance = parseFloat(invoice.outstanding_balance || 0);
      showConfirmation({
        title: 'Charge Saved Card',
        message: `Charge ${formatCurrency(outstandingBalance, invoice.currency?.code)} to the customer's saved card for invoice ${invoice.invoice_number}? This will process the payment immediately.`,
        variant: 'primary',
        confirmText: 'Charge Saved Card',
        onConfirm: async () => {
          try {
            const result = await invoicesAPI.chargeSavedCard(invoice.id);
            if (result.success) {
              showSuccess(`${formatCurrency(parseFloat(result.amount_charged || outstandingBalance), invoice.currency?.code)} charged successfully`);
              loadInvoice();
              refresh();
            } else {
              showError(result.error_message || result.error || 'Payment was not successful');
            }
          } catch (error) {
            console.error('Error charging card:', error);
            showError(error.message || 'Failed to charge card');
          }
        }
      });
    }
  };

  const handleConfirmChargeCard = async () => {
    const depositAmount = parseFloat(invoice.deposit_amount || 0);
    const outstandingBalance = parseFloat(invoice.outstanding_balance || 0);
    const amountToCharge = chargeAmount === 'deposit' ? depositAmount : outstandingBalance;

    try {
      setChargingCard(true);
      const result = await invoicesAPI.chargeSavedCard(invoice.id, { amount: amountToCharge });
      if (result.success) {
        showSuccess(`${formatCurrency(parseFloat(result.amount_charged || amountToCharge), invoice.currency?.code)} charged successfully`);
        setShowChargeCardModal(false);
        loadInvoice();
        refresh();
      } else {
        showError(result.error_message || result.error || 'Payment was not successful');
      }
    } catch (error) {
      console.error('Error charging card:', error);
      showError(error.message || 'Failed to charge card');
    } finally {
      setChargingCard(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zenible-primary"></div>
          <p className="mt-2 text-sm text-[#71717a]">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const status = invoice.status;
  const items = invoice.invoice_items || invoice.items || [];
  const totals = calculateInvoiceTotal(items, invoice.tax_rate || 0, invoice.discount_type, invoice.discount_value || 0);
  const hasOutstandingBalance = parseFloat(invoice.outstanding_balance || 0) > 0 && status !== INVOICE_STATUS.CANCELLED;
  const hasSavedCard = invoice.has_saved_payment_method === true;
  const canChargeCard = hasOutstandingBalance && hasSavedCard;

  // Check if invoice has any tax (item-level or document-level)
  const hasTax = totals.itemLevelTax > 0 || totals.documentTax > 0 || (invoice.tax_rate && invoice.tax_rate > 0);

  // Status badge colors matching Figma design
  const getStatusBadgeClasses = (status) => {
    const statusColors = {
      draft: 'bg-[#f4f4f5] text-[#09090b]',
      sent: 'bg-[#dff2fe] text-[#09090b]',
      viewed: 'bg-[#e0f2fe] text-[#09090b]',
      partial: 'bg-[#fef3c7] text-[#09090b]',
      paid: 'bg-[#dcfce7] text-[#09090b]',
      overdue: 'bg-[#fee2e2] text-[#09090b]',
      cancelled: 'bg-[#f4f4f5] text-[#71717a]',
    };
    return statusColors[status] || 'bg-[#f4f4f5] text-[#09090b]';
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-900">
      {/* Top Bar */}
      <div className="border-b border-[#e5e5e5] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-[10px] flex items-center gap-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/finance/invoices')}
          className="flex items-center justify-center w-[40px] h-[40px] bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Back to invoices"
        >
          <ChevronLeft className="h-5 w-5 text-[#09090b] dark:text-white" />
        </button>

        {/* Title */}
        <h1 className="flex-1 text-[18px] font-semibold leading-[26px] text-[#09090b] dark:text-white">
          Invoice Preview : {invoice.invoice_number}
        </h1>

        {/* Save PDF Button */}
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="h-[40px] px-3 flex items-center justify-center bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-[10px] text-[16px] font-medium text-[#09090b] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {downloadingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Save PDF'
          )}
        </button>

        {/* Add Payment Button - Green */}
        {hasOutstandingBalance && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="h-[40px] px-3 flex items-center justify-center bg-[#00a63e] rounded-[10px] text-[16px] font-medium text-white hover:bg-[#00913a] transition-colors"
          >
            Add Payment
          </button>
        )}

        {/* Send Email Button - Purple */}
        <button
          onClick={() => setShowSendModal(true)}
          className="h-[40px] px-3 flex items-center justify-center bg-[#8e51ff] rounded-[10px] text-[16px] font-medium text-white hover:bg-[#7a44db] transition-colors"
        >
          Send Email
        </button>

        {/* 3-dot Actions Menu */}
        <InvoiceActionsMenu
          invoice={invoice}
          onEdit={() => navigate(`/finance/invoices/${id}/edit`)}
          onClone={handleClone}
          onDelete={handleDelete}
          onLinkPayment={() => setShowLinkPaymentModal(true)}
          onExpenses={() => setShowExpenseModal(true)}
          onProjects={() => setShowProjectModal(true)}
          onSendReminder={() => setShowReminderModal(true)}
          onMarkAsSent={handleMarkAsSent}
          onRevertToDraft={handleRevertToDraft}
          onChargeCard={handleChargeCard}
          showLinkPayment={hasOutstandingBalance}
          showSendReminder={['sent', 'viewed', 'partially_paid'].includes(status)}
          showMarkAsSent={status === INVOICE_STATUS.DRAFT}
          showRevertToDraft={status === INVOICE_STATUS.SENT}
          showChargeCard={canChargeCard}
        />
      </div>

      {/* Content Section */}
      <div className="px-4 md:px-8 lg:px-[300px] py-4 flex flex-col gap-[14px] items-center">
        {/* Main Invoice Card */}
        <div className="w-full max-w-[840px] bg-white dark:bg-gray-800 border-2 border-[#e5e5e5] dark:border-gray-700 rounded-[12px] p-6 flex flex-col gap-6">
          {/* Header: Logo + Invoice Number | Dates + Status */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              {/* Company Logo */}
              {company?.logo_url && (
                <img
                  src={company.logo_url}
                  alt={company.name || 'Company Logo'}
                  className="max-h-16 max-w-[200px] object-contain mb-4"
                />
              )}
              <h2 className="text-[32px] font-semibold leading-[40px] text-[#09090b] dark:text-white">
                {invoice.invoice_number}
              </h2>
            </div>
            <div className="flex flex-col gap-3 items-end">
              <div className="text-right">
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Invoice Date</p>
                <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
                  {formatDate(invoice.issue_date || invoice.invoice_date)}
                </p>
              </div>
              {invoice.due_date && (
                <div className="text-right">
                  <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Due Date</p>
                  <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
                    {formatDate(invoice.due_date)}
                  </p>
                </div>
              )}
              {/* Status Badge */}
              <span className={`inline-flex items-center justify-center px-1.5 py-[1px] rounded text-[10px] font-medium ${getStatusBadgeClasses(status)}`}>
                {INVOICE_STATUS_LABELS[status] || status}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e5e5e5] dark:bg-gray-700 w-full" />

          {/* From / Billed To */}
          <div className="flex gap-8">
            {/* From */}
            <div className="flex-1 flex flex-col gap-[6px]">
              <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">From</p>
              <div className="flex flex-col gap-[2px]">
                {/* Company Name */}
                <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
                  {company?.name || invoice.company?.name || 'Your Company'}
                </p>
                {/* Company Address - Line 1 */}
                {(company?.address || company?.city || company?.state) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {[company?.address, company?.city, company?.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {/* Company Address - Line 2 (Postal Code & Country) */}
                {(company?.postal_code || company?.country) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {[company?.postal_code, company?.country].filter(Boolean).join(', ')}
                  </p>
                )}
                {/* Company Contact Email */}
                {(company?.email || invoice.company?.email || invoice.created_by_user?.email) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {company?.email || invoice.company?.email || invoice.created_by_user?.email}
                  </p>
                )}
                {/* Registration Number */}
                {company?.registration_number && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    Reg: {company.registration_number}
                  </p>
                )}
                {/* Tax ID */}
                {company?.tax_id && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    Tax ID: {company.tax_id}
                  </p>
                )}
              </div>
            </div>

            {/* Billed To */}
            <div className="flex-1 flex flex-col gap-[6px]">
              <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Billed to</p>
              <div className="flex flex-col gap-[2px]">
                <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
                  {invoice.contact ? `${invoice.contact.first_name} ${invoice.contact.last_name}` : 'N/A'}
                </p>
                {invoice.contact?.business_name && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {invoice.contact.business_name}
                  </p>
                )}
                {/* Client Address - Line 1 */}
                {invoice.contact?.address_line_1 && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {invoice.contact.address_line_1}
                  </p>
                )}
                {/* Client Address - Line 2 (if present) */}
                {invoice.contact?.address_line_2 && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {invoice.contact.address_line_2}
                  </p>
                )}
                {/* Client Address - City, State */}
                {(invoice.contact?.city || invoice.contact?.state) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {[invoice.contact?.city, invoice.contact?.state].filter(Boolean).join(', ')}
                  </p>
                )}
                {/* Client Address - Postal Code, Country */}
                {(invoice.contact?.postcode || invoice.contact?.country?.name || invoice.contact?.country_id) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {[
                      invoice.contact?.postcode?.trim(),
                      invoice.contact?.country?.name || (invoice.contact?.country_id && getCountryById(invoice.contact.country_id)?.name)
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
                {/* Tax Number */}
                {invoice.contact?.tax_id && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    Tax Number: {invoice.contact.tax_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e5e5e5] dark:bg-gray-700 w-full" />

          {/* Invoice Details */}
          <div className="flex flex-col gap-3">
            <p className="text-[16px] font-bold leading-[24px] text-[#09090b] dark:text-white">
              Invoice Details
            </p>

            {/* Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-y border-[#e5e5e5] dark:border-gray-700">
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
                    items.map((item, index) => {
                      const itemAmount = parseFloat(item.amount || 0);
                      const itemTaxAmount = item.taxes?.reduce((sum, t) => sum + (t.tax_amount || 0), 0) || 0;
                      const itemTotal = itemAmount + itemTaxAmount;

                      return (
                        <tr key={index} className="border-b border-[#e5e5e5] dark:border-gray-700 bg-white dark:bg-gray-800">
                          <td className="px-3 py-4">
                            <div>
                              <span className="text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white whitespace-pre-line">
                                {item.description || item.name}
                              </span>
                              {item.subtext && (
                                <p className="text-[12px] text-[#71717a] mt-0.5 whitespace-pre-line">{item.subtext}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                            {parseFloat(item.quantity || 0)}
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                            {formatCurrency(parseFloat(item.price || item.unit_price || 0), invoice.currency?.code)}
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                            {formatCurrency(itemAmount, invoice.currency?.code)}
                          </td>
                          {hasTax && (
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                              {formatCurrency(itemTaxAmount, invoice.currency?.code)}
                            </td>
                          )}
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                            {formatCurrency(itemTotal, invoice.currency?.code)}
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
            <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
              <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                Sub Total:
              </span>
              <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
                {formatCurrency(invoice.subtotal || totals.subtotal, invoice.currency?.code)}
              </span>
            </div>

            {/* Discount */}
            {(parseFloat(invoice.discount_amount || 0) > 0 || invoice.discount_value > 0) && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  Discount{invoice.discount_type === 'percentage' && invoice.discount_value ? ` (${invoice.discount_value}%)` : ''}:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-red-600 dark:text-red-400">
                  - {formatCurrency(parseFloat(invoice.discount_amount || 0) || totals.discount, invoice.currency?.code)}
                </span>
              </div>
            )}

            {/* Document Taxes - show each tax line */}
            {invoice.document_taxes?.length > 0 && invoice.document_taxes.map((tax, index) => (
              <div key={tax.id || index} className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  {tax.tax_name || 'Tax'} ({parseFloat(tax.tax_rate)}%):
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
                  + {formatCurrency(parseFloat(tax.tax_amount || 0), invoice.currency?.code)}
                </span>
              </div>
            ))}

            {/* Fallback Tax display if no document_taxes but has tax_total or document_tax_total */}
            {(!invoice.document_taxes || invoice.document_taxes.length === 0) &&
             (parseFloat(invoice.document_tax_total || 0) > 0 || parseFloat(invoice.tax_total || 0) > 0 || totals.itemLevelTax > 0 || totals.documentTax > 0) && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  {invoice.tax_label || 'Tax'}:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
                  + {formatCurrency(
                    parseFloat(invoice.document_tax_total || 0) ||
                    parseFloat(invoice.tax_total || 0) ||
                    (totals.itemLevelTax + totals.documentTax),
                    invoice.currency?.code
                  )}
                </span>
              </div>
            )}

            {/* Total Amount - Uses company secondary color if set */}
            <div
              className={`flex items-center gap-4 px-4 py-2 text-right ${!company?.secondary_color ? 'bg-[#ddd6ff] dark:bg-purple-900/50' : ''}`}
              style={company?.secondary_color ? { backgroundColor: company.secondary_color } : undefined}
            >
              <span className="w-[150px] text-[16px] font-bold leading-[24px] text-[#09090b] dark:text-white">
                Total Amount:
              </span>
              <span className="w-[216px] text-[16px] font-bold leading-[24px] text-[#09090b] dark:text-white">
                {formatCurrency(parseFloat(invoice.total) || totals.total, invoice.currency?.code)}
              </span>
            </div>

            {/* Deposit Requested - shown underneath Total Amount */}
            {parseFloat(invoice.deposit_amount || invoice.deposit || 0) > 0 && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  Deposit Requested{invoice.deposit_percentage && parseFloat(invoice.deposit_percentage) > 0 ? ` (${parseFloat(invoice.deposit_percentage)}%)` : ''}:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
                  {formatCurrency(parseFloat(invoice.deposit_amount || invoice.deposit || 0), invoice.currency?.code)}
                </span>
              </div>
            )}
          </div>

          {/* Payment Summary Card */}
          <div className="border-[1.5px] border-[#e5e5e5] dark:border-gray-700 rounded-[8px] p-4 flex flex-col gap-4">
            <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
              Payment Summary
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-normal leading-[22px] text-[#71717a]">Total Amount</span>
                <span className="text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  {formatCurrency(invoice.total, invoice.currency?.code)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-normal leading-[22px] text-[#71717a]">Amount Paid</span>
                <span className="text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  {formatCurrency(invoice.paid_amount || 0, invoice.currency?.code)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e5e5e5] dark:bg-gray-700 w-full" />

            {/* Outstanding Balance */}
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
                Outstanding Balance
              </span>
              <span className={`text-[16px] font-bold leading-[24px] text-right w-[216px] ${
                parseFloat(invoice.outstanding_balance || 0) > 0
                  ? 'text-[#fb2c36]'
                  : parseFloat(invoice.outstanding_balance || 0) < 0
                    ? 'text-green-600'
                    : 'text-[#09090b] dark:text-white'
              }`}>
                {(() => {
                  const balance = invoice.outstanding_balance !== undefined
                    ? parseFloat(invoice.outstanding_balance)
                    : parseFloat(invoice.total) - parseFloat(invoice.paid_amount || 0);

                  if (balance > 0) {
                    return formatCurrency(balance, invoice.currency?.code);
                  } else if (balance < 0) {
                    return `${formatCurrency(Math.abs(balance), invoice.currency?.code)} Credit`;
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
              <p className="text-[12px] text-[#71717a]">
                Customer has a credit that can be applied to future invoices or refunded
              </p>
            )}
          </div>

          {/* Auto-billing Failed Warning */}
          {invoice.auto_billing_failed && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Automatic Payment Failed
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    {invoice.auto_billing_failure_reason || 'All automatic payment retry attempts have been exhausted.'}
                  </p>
                  {invoice.auto_billing_attempts > 0 && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      {invoice.auto_billing_attempts} attempt{invoice.auto_billing_attempts !== 1 ? 's' : ''} made
                      {invoice.last_auto_billing_attempt_at && (
                        <span> • Last attempt: {formatDate(invoice.last_auto_billing_attempt_at)}</span>
                      )}
                    </p>
                  )}
                  <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                    Customer action required to update payment method.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Auto-billing Retry Scheduled Warning */}
          {!invoice.auto_billing_failed && invoice.next_auto_billing_retry_at && (
            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    Payment Retry Scheduled
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    {invoice.auto_billing_failure_reason && (
                      <span className="block mb-1">Previous attempt: {invoice.auto_billing_failure_reason}</span>
                    )}
                    Next automatic payment retry: <strong>{formatDate(invoice.next_auto_billing_retry_at)}</strong>
                  </p>
                  {invoice.auto_billing_attempts > 0 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      Attempt {invoice.auto_billing_attempts} of 3
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recurring Template Management - Only show for parent templates (no parent_invoice_id) */}
          {(invoice.pricing_type === 'recurring' || invoice.is_recurring) && !invoice.parent_invoice_id && (
            <RecurringTemplateCard invoice={invoice} onUpdate={loadInvoice} />
          )}

          {/* Auto-Generated Invoice Badge - Show for child invoices with parent_invoice_id */}
          {invoice.parent_invoice_id && (
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Auto-Generated Invoice
                    {invoice.recurrence_sequence_number && ` #${invoice.recurrence_sequence_number}`}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/finance/invoices/${invoice.parent_invoice_id}`)}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  View Template
                </button>
              </div>
            </div>
          )}

          {/* Preserved: Recurring Settings */}
          {invoice.is_recurring && (
            <RecurringInvoiceSettings
              isRecurring={invoice.is_recurring}
              recurringType={invoice.recurring_type}
              customEvery={invoice.custom_every}
              customPeriod={invoice.custom_period}
              recurringEndDate={invoice.recurring_end_date}
              recurringOccurrences={invoice.recurring_occurrences}
              startDate={invoice.issue_date || invoice.invoice_date}
              onChange={() => {}}
              readOnly={true}
            />
          )}

          {/* Notes Section */}
          {invoice.notes && (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
                Notes
              </p>
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Payment Instructions Section */}
          {invoice.payment_instructions && (
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
                Payment Instructions
              </p>
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                {invoice.payment_instructions}
              </p>
            </div>
          )}

          {/* Preserved: Terms & Conditions */}
          {invoice.terms && (
            <div className="flex flex-col gap-4 pt-4 border-t border-[#e5e5e5] dark:border-gray-700">
              <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
                Terms & Conditions
              </p>
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                {invoice.terms}
              </p>
            </div>
          )}
        </div>

        {/* Change History Card */}
        <div className="w-full max-w-[840px] bg-white dark:bg-gray-800 border-2 border-[#e5e5e5] dark:border-gray-700 rounded-[12px] overflow-hidden">
          {/* Header */}
          <div className="border-b border-[#e5e5e5] dark:border-gray-700 p-4">
            <h3 className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
              Change History
            </h3>
          </div>

          {/* Content */}
          <div className="p-3">
            <InvoiceHistory invoiceId={invoice.id} />
          </div>
        </div>

        {/* View History Card */}
        <div className="w-full max-w-[840px] bg-white dark:bg-gray-800 border-2 border-[#e5e5e5] dark:border-gray-700 rounded-[12px] overflow-hidden">
          {/* Header - Clickable to expand/collapse */}
          <button
            onClick={() => setViewHistoryExpanded(!viewHistoryExpanded)}
            className="w-full border-b border-[#e5e5e5] dark:border-gray-700 p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#71717a]" />
              <h3 className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
                View History
              </h3>
              {viewHistory && (
                <span className="text-sm text-[#71717a]">
                  ({viewHistory.total} view{viewHistory.total !== 1 ? 's' : ''}, {viewHistory.unique_ip_count} unique)
                </span>
              )}
            </div>
            {viewHistoryExpanded ? (
              <ChevronUp className="h-5 w-5 text-[#71717a]" />
            ) : (
              <ChevronDown className="h-5 w-5 text-[#71717a]" />
            )}
          </button>

          {/* Content - Collapsible */}
          {viewHistoryExpanded && (
            <div className="p-4">
              {loadingViewHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : viewHistory && viewHistory.views?.length > 0 ? (
                <div className="space-y-3">
                  {viewHistory.views.map((view) => {
                    // Parse user agent to determine device type
                    const ua = view.user_agent || '';
                    const isMobile = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
                    const DeviceIcon = isMobile ? Smartphone : Monitor;

                    // Extract browser info
                    let browser = 'Unknown Browser';
                    if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
                    else if (ua.includes('Chrome')) browser = 'Chrome';
                    else if (ua.includes('Firefox')) browser = 'Firefox';
                    else if (ua.includes('Edge')) browser = 'Edge';

                    return (
                      <div
                        key={view.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <DeviceIcon className="h-5 w-5 text-[#71717a] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-[#09090b] dark:text-white">
                              {new Date(view.viewed_at).toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[#71717a] dark:text-gray-300">
                              {browser}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-[#71717a]">
                            <p>IP: {view.ip_address}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#71717a] text-center py-4">
                  No views recorded yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SendInvoiceDialog
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        invoice={invoice}
        contact={invoice.contact}
        onSuccess={loadInvoice}
      />

      <SendReminderDialog
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        invoice={invoice}
        contact={invoice.contact}
        onSuccess={loadInvoice}
      />

      <AddPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        invoice={invoice}
        onSuccess={handlePaymentSuccess}
      />

      <LinkPaymentModal
        isOpen={showLinkPaymentModal}
        onClose={() => setShowLinkPaymentModal(false)}
        invoice={invoice}
        onSuccess={handlePaymentSuccess}
      />

      <AssignExpenseModal
        open={showExpenseModal}
        onOpenChange={setShowExpenseModal}
        entityType="invoice"
        entityId={invoice.id}
        entityName={`Invoice #${invoice.invoice_number}`}
        currency={invoice.currency?.code}
        onUpdate={loadInvoice}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
      />

      <ProjectAllocationModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
        entityType="invoice"
        entityId={invoice.id}
        entityName={`Invoice #${invoice.invoice_number}`}
        entityAmount={invoice.total}
        currency={invoice.currency?.code || 'GBP'}
        currentAllocations={invoice.project_allocations || []}
        onUpdate={loadInvoice}
      />

      {/* Charge Card Amount Selection Modal */}
      {showChargeCardModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" onClick={() => !chargingCard && setShowChargeCardModal(false)}></div>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10">
              <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Charge Saved Card
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  This invoice has a deposit requested. How much would you like to charge?
                </p>

                <div className="space-y-3">
                  {/* Deposit Only Option */}
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    chargeAmount === 'deposit'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}>
                    <input
                      type="radio"
                      name="chargeAmount"
                      value="deposit"
                      checked={chargeAmount === 'deposit'}
                      onChange={() => setChargeAmount('deposit')}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white block">
                        Deposit Only
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(parseFloat(invoice.deposit_amount || 0), invoice.currency?.code)}
                        {invoice.deposit_percentage && parseFloat(invoice.deposit_percentage) > 0 &&
                          ` (${parseFloat(invoice.deposit_percentage)}%)`
                        }
                      </span>
                    </div>
                  </label>

                  {/* Full Amount Option */}
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    chargeAmount === 'full'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}>
                    <input
                      type="radio"
                      name="chargeAmount"
                      value="full"
                      checked={chargeAmount === 'full'}
                      onChange={() => setChargeAmount('full')}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white block">
                        Full Outstanding Balance
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(parseFloat(invoice.outstanding_balance || 0), invoice.currency?.code)}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowChargeCardModal(false)}
                  disabled={chargingCard}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmChargeCard}
                  disabled={chargingCard}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {chargingCard ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Charge ${formatCurrency(
                      chargeAmount === 'deposit'
                        ? parseFloat(invoice.deposit_amount || 0)
                        : parseFloat(invoice.outstanding_balance || 0),
                      invoice.currency?.code
                    )}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
