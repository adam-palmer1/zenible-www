import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoices } from '../../../contexts/InvoiceContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCRMReferenceData } from '../../../contexts/CRMReferenceDataContext';
import { INVOICE_STATUS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import invoicesAPI from '../../../services/api/finance/invoices';
import companiesAPI from '../../../services/api/crm/companies';
import SendInvoiceDialog from './SendInvoiceDialog';
import SendReminderDialog from './SendReminderDialog';
import { LoadingSpinner } from '../../shared';
import AddPaymentModal from './AddPaymentModal';
import LinkPaymentModal from './LinkPaymentModal';
import ConfirmationModal from '../../shared/ConfirmationModal';
import AssignExpenseModal from '../expenses/AssignExpenseModal';
import { ProjectAllocationModal } from '../allocations';
import type { InvoiceResponse, InvoiceViewHistoryResponse, CompanyResponse } from '../../../types';

import {
  InvoiceDetailTopBar,
  InvoiceDetailHeader,
  InvoiceDetailLineItems,
  InvoiceDetailTotals,
  InvoiceDetailPaymentSummary,
  InvoiceDetailAlerts,
  InvoiceDetailNotes,
  InvoiceDetailChangeHistory,
  InvoiceDetailViewHistory,
  ChargeCardModal,
} from './invoice-detail';
import type { InvoiceDetailData, ConfirmationConfig } from './invoice-detail';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteInvoice, cloneInvoice, updateInvoice, refresh } = useInvoices();
  const { showSuccess, showError } = useNotification();
  const { getCountryById } = useCRMReferenceData();

  const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
  const [company, setCompany] = useState<CompanyResponse | null>(null);
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
  const [chargeAmount, setChargeAmount] = useState<'full' | 'deposit'>('full');
  const [chargingCard, setChargingCard] = useState(false);

  // View history state
  const [viewHistory, setViewHistory] = useState<InvoiceViewHistoryResponse | null>(null);
  const [loadingViewHistory, setLoadingViewHistory] = useState(false);
  const [viewHistoryExpanded, setViewHistoryExpanded] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
    variant: 'danger' | 'warning' | 'primary';
    confirmText: string;
  }>({
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
      const data = await companiesAPI.getCurrent<CompanyResponse>();
      setCompany(data);
    } catch (error) {
      console.error('Error loading company:', error);
      // Non-critical, don't show error to user
    }
  };

  const showConfirmation = (config: ConfirmationConfig) => {
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
      const data = await invoicesAPI.get(id!) as InvoiceDetailData;
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
      const data = await invoicesAPI.getViewHistory(id!);
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
      const blob = await invoicesAPI.downloadPDF(id!);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoice_number}.pdf`;
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
      const cloned = await cloneInvoice(id!) as InvoiceResponse;
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
      message: `Are you sure you want to delete invoice ${invoice?.invoice_number}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteInvoice(id!);
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
      message: `Mark invoice ${invoice?.invoice_number} as sent? This will update the invoice status.`,
      variant: 'primary',
      confirmText: 'Mark as Sent',
      onConfirm: async () => {
        try {
          const updated = await updateInvoice(invoice!.id, { status: 'sent' }, 'Marked as sent manually') as InvoiceDetailData;
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
      message: `Revert invoice ${invoice?.invoice_number} to draft status? This will undo the sent status.`,
      variant: 'warning',
      confirmText: 'Revert to Draft',
      onConfirm: async () => {
        try {
          const updated = await updateInvoice(invoice!.id, { status: 'draft' }, 'Reverted to draft manually') as InvoiceDetailData;
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
    const depositAmount = parseFloat(String(invoice?.deposit_amount || 0));
    const paidAmount = parseFloat(String(invoice?.paid_amount || 0));
    const hasUnpaidDeposit = depositAmount > 0 && paidAmount < depositAmount;

    if (hasUnpaidDeposit) {
      // Show modal with deposit vs full amount options
      setChargeAmount('deposit');
      setShowChargeCardModal(true);
    } else {
      // No deposit or deposit already paid - charge full outstanding balance
      const outstandingBalance = parseFloat(String(invoice?.outstanding_balance || 0));
      showConfirmation({
        title: 'Charge Saved Card',
        message: `Charge ${formatCurrency(outstandingBalance, invoice?.currency?.code)} to the customer's saved card for invoice ${invoice?.invoice_number}? This will process the payment immediately.`,
        variant: 'primary',
        confirmText: 'Charge Saved Card',
        onConfirm: async () => {
          try {
            const result = await invoicesAPI.chargeSavedCard(invoice!.id);
            if (result.success) {
              showSuccess(`${formatCurrency(parseFloat(String(result.amount_charged || outstandingBalance)), invoice?.currency?.code)} charged successfully`);
              loadInvoice();
              refresh();
            } else {
              showError(result.error_message || 'Payment was not successful');
            }
          } catch (error: unknown) {
            console.error('Error charging card:', error);
            showError((error as Error).message || 'Failed to charge card');
          }
        }
      });
    }
  };

  const handleConfirmChargeCard = async () => {
    const depositAmount = parseFloat(String(invoice?.deposit_amount || 0));
    const outstandingBalance = parseFloat(String(invoice?.outstanding_balance || 0));
    const amountToCharge = chargeAmount === 'deposit' ? depositAmount : outstandingBalance;

    try {
      setChargingCard(true);
      const result = await invoicesAPI.chargeSavedCard(invoice!.id, { amount: amountToCharge });
      if (result.success) {
        showSuccess(`${formatCurrency(parseFloat(String(result.amount_charged || amountToCharge)), invoice?.currency?.code)} charged successfully`);
        setShowChargeCardModal(false);
        loadInvoice();
        refresh();
      } else {
        showError(result.error_message || 'Payment was not successful');
      }
    } catch (error: unknown) {
      console.error('Error charging card:', error);
      showError((error as Error).message || 'Failed to charge card');
    } finally {
      setChargingCard(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner size="h-8 w-8" height="h-96" message="Loading invoice..." />
    );
  }

  if (!invoice) {
    return null;
  }

  const status = invoice.status;
  const items = invoice.invoice_items || invoice.items || [];
  const totals = calculateInvoiceTotal(items, Number(invoice.tax_rate || 0), invoice.discount_type ?? 'percentage', String(invoice.discount_value || 0));
  const hasOutstandingBalance = parseFloat(String(invoice.outstanding_balance || 0)) > 0 && status !== INVOICE_STATUS.CANCELLED;
  const hasSavedCard = invoice.has_saved_payment_method === true;
  const canChargeCard = hasOutstandingBalance && hasSavedCard;

  // Check if invoice has any tax (item-level or document-level)
  const hasTax = totals.itemLevelTax > 0 || totals.documentTax > 0 || !!(invoice.tax_rate && Number(invoice.tax_rate) > 0);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-900">
      {/* Top Bar */}
      <InvoiceDetailTopBar
        invoice={invoice}
        downloadingPdf={downloadingPdf}
        hasOutstandingBalance={hasOutstandingBalance}
        canChargeCard={canChargeCard}
        status={status}
        onBack={() => navigate('/finance/invoices')}
        onDownloadPdf={handleDownloadPdf}
        onAddPayment={() => setShowPaymentModal(true)}
        onSendEmail={() => setShowSendModal(true)}
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
      />

      {/* Content Section */}
      <div className="px-4 md:px-8 lg:px-[300px] py-4 flex flex-col gap-[14px] items-center">
        {/* Main Invoice Card */}
        <div className="w-full max-w-[840px] bg-white dark:bg-gray-800 border-2 border-[#e5e5e5] dark:border-gray-700 rounded-[12px] p-6 flex flex-col gap-6">
          <InvoiceDetailHeader
            invoice={invoice}
            company={company}
            status={status}
            getCountryById={getCountryById}
          />

          {/* Divider */}
          <div className="h-px bg-[#e5e5e5] dark:bg-gray-700 w-full" />

          {/* Invoice Details */}
          <InvoiceDetailLineItems
            items={items}
            hasTax={hasTax}
            currencyCode={invoice.currency?.code}
          />

          {/* Summary Details */}
          <InvoiceDetailTotals
            invoice={invoice}
            totals={totals}
            company={company}
          />

          {/* Payment Summary Card */}
          <InvoiceDetailPaymentSummary invoice={invoice} />

          {/* Alerts, Recurring, etc. */}
          <InvoiceDetailAlerts
            invoice={invoice}
            onLoadInvoice={loadInvoice}
            onNavigateToParent={() => navigate(`/finance/invoices/${invoice.parent_invoice_id}`)}
          />

          {/* Notes, Payment Instructions, Terms */}
          <InvoiceDetailNotes invoice={invoice} />
        </div>

        {/* Change History Card */}
        <InvoiceDetailChangeHistory invoiceId={invoice.id} />

        {/* View History Card */}
        <InvoiceDetailViewHistory
          viewHistory={viewHistory}
          loadingViewHistory={loadingViewHistory}
          viewHistoryExpanded={viewHistoryExpanded}
          onToggleExpanded={() => setViewHistoryExpanded(!viewHistoryExpanded)}
        />
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
        onConfirm={confirmModal.onConfirm ?? (() => {})}
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
        <ChargeCardModal
          invoice={invoice}
          chargeAmount={chargeAmount}
          chargingCard={chargingCard}
          onChargeAmountChange={setChargeAmount}
          onConfirm={handleConfirmChargeCard}
          onClose={() => setShowChargeCardModal(false)}
        />
      )}
    </div>
  );
};

export default InvoiceDetail;
