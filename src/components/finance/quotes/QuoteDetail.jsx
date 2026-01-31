import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, FileText, Eye, ChevronDown, ChevronUp, Monitor, Smartphone, Bell } from 'lucide-react';
import { useQuotes } from '../../../contexts/QuoteContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { QUOTE_STATUS, QUOTE_STATUS_COLORS } from '../../../constants/finance';
import { formatCurrency } from '../../../utils/currency';
import { calculateInvoiceTotal } from '../../../utils/invoiceCalculations';
import quotesAPI from '../../../services/api/finance/quotes';
import companiesAPI from '../../../services/api/crm/companies';
import SendQuoteModal from './SendQuoteModal';
import ConvertToInvoiceModal from './ConvertToInvoiceModal';
import QuoteActionsMenu from './QuoteActionsMenu';
import ConfirmationModal from '../../shared/ConfirmationModal';
import { AllocationSummaryBar, ProjectAllocationModal } from '../allocations';

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteQuote, cloneQuote, acceptQuote, rejectQuote } = useQuotes();
  const { showSuccess, showError } = useNotification();

  const [quote, setQuote] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

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
    loadQuote();
    loadCompany();
  }, [id]);

  // Load view history when expanded
  useEffect(() => {
    if (viewHistoryExpanded && !viewHistory && !loadingViewHistory && id) {
      loadViewHistory();
    }
  }, [viewHistoryExpanded, viewHistory, loadingViewHistory, id]);

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

  const loadViewHistory = async () => {
    try {
      setLoadingViewHistory(true);
      const data = await quotesAPI.getViews(id);
      setViewHistory(data);
    } catch (error) {
      console.error('Error loading view history:', error);
      // Non-critical, don't show error to user
    } finally {
      setLoadingViewHistory(false);
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

  const handleDelete = () => {
    showConfirmation({
      title: 'Delete Quote',
      message: `Are you sure you want to delete quote ${quote.quote_number}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteQuote(id);
          showSuccess('Quote deleted successfully');
          navigate('/finance/quotes');
        } catch (error) {
          showError('Failed to delete quote');
        }
      }
    });
  };

  const handleAccept = () => {
    showConfirmation({
      title: 'Accept Quote',
      message: `Accept quote ${quote.quote_number}? This will mark the quote as accepted.`,
      variant: 'primary',
      confirmText: 'Accept Quote',
      onConfirm: async () => {
        try {
          await acceptQuote(id);
          loadQuote();
          showSuccess('Quote accepted successfully');
        } catch (error) {
          showError('Failed to accept quote');
        }
      }
    });
  };

  const handleReject = () => {
    showConfirmation({
      title: 'Reject Quote',
      message: `Reject quote ${quote.quote_number}? This will mark the quote as rejected.`,
      variant: 'danger',
      confirmText: 'Reject Quote',
      onConfirm: async () => {
        try {
          await rejectQuote(id);
          loadQuote();
          showSuccess('Quote rejected');
        } catch (error) {
          showError('Failed to reject quote');
        }
      }
    });
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
          <p className="mt-2 text-sm text-[#71717a]">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const status = quote.status;
  const items = quote.quote_items || quote.items || [];
  const totals = calculateInvoiceTotal(items, quote.tax_rate || 0, quote.discount_type, quote.discount_value || 0);

  // Check if quote has any tax (item-level or document-level)
  const hasTax = totals.itemLevelTax > 0 || totals.documentTax > 0 || (quote.tax_rate && quote.tax_rate > 0);

  // Status badge colors matching design
  const getStatusBadgeClasses = (status) => {
    const statusColors = {
      draft: 'bg-[#f4f4f5] text-[#09090b]',
      sent: 'bg-[#dff2fe] text-[#09090b]',
      viewed: 'bg-[#e0f2fe] text-[#09090b]',
      accepted: 'bg-[#dcfce7] text-[#09090b]',
      rejected: 'bg-[#fee2e2] text-[#09090b]',
      expired: 'bg-[#f4f4f5] text-[#71717a]',
      invoiced: 'bg-[#ddd6ff] text-[#09090b]',
    };
    return statusColors[status] || 'bg-[#f4f4f5] text-[#09090b]';
  };

  const canConvertToInvoice = status === QUOTE_STATUS.ACCEPTED;
  const canAccept = status === QUOTE_STATUS.SENT || status === 'viewed';
  const canReject = status === QUOTE_STATUS.SENT || status === 'viewed';

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-900">
      {/* Top Bar */}
      <div className="border-b border-[#e5e5e5] dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-[10px] flex items-center gap-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/finance/quotes')}
          className="flex items-center justify-center w-[40px] h-[40px] bg-white dark:bg-gray-800 border border-[#e5e5e5] dark:border-gray-600 rounded-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Back to quotes"
        >
          <ChevronLeft className="h-5 w-5 text-[#09090b] dark:text-white" />
        </button>

        {/* Title */}
        <h1 className="flex-1 text-[18px] font-semibold leading-[26px] text-[#09090b] dark:text-white">
          Quote Preview : {quote.quote_number}
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

        {/* Convert to Invoice Button - Green */}
        {canConvertToInvoice && (
          <button
            onClick={() => setShowConvertModal(true)}
            className="h-[40px] px-3 flex items-center gap-2 bg-[#00a63e] rounded-[10px] text-[16px] font-medium text-white hover:bg-[#00913a] transition-colors"
          >
            <FileText className="h-4 w-4" />
            Convert to Invoice
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
        <QuoteActionsMenu
          quote={quote}
          onEdit={() => navigate(`/finance/quotes/${id}/edit`)}
          onClone={handleClone}
          onDelete={handleDelete}
          onProjects={() => setShowProjectModal(true)}
          onAccept={handleAccept}
          onReject={handleReject}
          showAccept={canAccept}
          showReject={canReject}
        />
      </div>

      {/* Content Section */}
      <div className="px-4 md:px-8 lg:px-[300px] py-4 flex flex-col gap-[14px] items-center">
        {/* Main Quote Card */}
        <div className="w-full max-w-[840px] bg-white dark:bg-gray-800 border-2 border-[#e5e5e5] dark:border-gray-700 rounded-[12px] p-6 flex flex-col gap-6">
          {/* Header: Logo + Quote Number | Dates + Status */}
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
                {quote.quote_number}
              </h2>
            </div>
            <div className="flex flex-col gap-3 items-end">
              <div className="text-right">
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Quote Date</p>
                <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
                  {formatDate(quote.issue_date || quote.quote_date)}
                </p>
              </div>
              {(quote.valid_until || quote.expiry_date) && (
                <div className="text-right">
                  <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Valid Until</p>
                  <p className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white">
                    {formatDate(quote.valid_until || quote.expiry_date)}
                  </p>
                </div>
              )}
              {/* Status Badge */}
              <span className={`inline-flex items-center justify-center px-1.5 py-[1px] rounded text-[10px] font-medium ${getStatusBadgeClasses(status)}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
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
                  {company?.name || quote.company?.name || 'Your Company'}
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
                {(company?.email || quote.company?.email || quote.created_by_user?.email) && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {company?.email || quote.company?.email || quote.created_by_user?.email}
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
                  {quote.contact ? `${quote.contact.first_name} ${quote.contact.last_name}` : 'N/A'}
                </p>
                {quote.contact?.business_name && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {quote.contact.business_name}
                  </p>
                )}
                {quote.contact?.email && (
                  <p className="text-[14px] font-normal leading-[22px] text-[#71717a]">
                    {quote.contact.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#e5e5e5] dark:bg-gray-700 w-full" />

          {/* Quote Details */}
          <div className="flex flex-col gap-3">
            <p className="text-[16px] font-bold leading-[24px] text-[#09090b] dark:text-white">
              Quote Details
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
                              <span className="text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                                {item.description || item.name}
                              </span>
                              {item.subtext && (
                                <p className="text-[12px] text-[#71717a] mt-0.5">{item.subtext}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                            {parseFloat(item.quantity || 0)}
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                            {formatCurrency(parseFloat(item.price || item.unit_price || 0), quote.currency?.code)}
                          </td>
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                            {formatCurrency(itemAmount, quote.currency?.code)}
                          </td>
                          {hasTax && (
                            <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                              {formatCurrency(itemTaxAmount, quote.currency?.code)}
                            </td>
                          )}
                          <td className="px-3 py-4 text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                            {formatCurrency(itemTotal, quote.currency?.code)}
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
                {formatCurrency(quote.subtotal || totals.subtotal, quote.currency?.code)}
              </span>
            </div>

            {/* Discount */}
            {(parseFloat(quote.discount_amount || 0) > 0 || quote.discount_value > 0) && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  Discount{quote.discount_type === 'percentage' && quote.discount_value ? ` (${quote.discount_value}%)` : ''}:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-red-600 dark:text-red-400">
                  - {formatCurrency(parseFloat(quote.discount_amount || 0) || totals.discount, quote.currency?.code)}
                </span>
              </div>
            )}

            {/* Document Taxes - show each tax line */}
            {quote.document_taxes?.length > 0 && quote.document_taxes.map((tax, index) => (
              <div key={tax.id || index} className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  {tax.tax_name || 'Tax'} ({parseFloat(tax.tax_rate)}%):
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
                  + {formatCurrency(parseFloat(tax.tax_amount || 0), quote.currency?.code)}
                </span>
              </div>
            ))}

            {/* Fallback Tax display if no document_taxes but has tax_total or document_tax_total */}
            {(!quote.document_taxes || quote.document_taxes.length === 0) &&
             (parseFloat(quote.document_tax_total || 0) > 0 || parseFloat(quote.tax_total || 0) > 0 || totals.itemLevelTax > 0 || totals.documentTax > 0) && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  {quote.tax_label || 'Tax'}:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
                  + {formatCurrency(
                    parseFloat(quote.document_tax_total || 0) ||
                    parseFloat(quote.tax_total || 0) ||
                    (totals.itemLevelTax + totals.documentTax),
                    quote.currency?.code
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
                {formatCurrency(parseFloat(quote.total) || totals.total, quote.currency?.code)}
              </span>
            </div>

            {/* Deposit Requested - shown underneath Total Amount */}
            {parseFloat(quote.deposit_amount || quote.deposit || 0) > 0 && (
              <div className="flex items-center gap-4 px-4 py-2 bg-[#f4f4f5] dark:bg-gray-700 text-right">
                <span className="w-[150px] text-[16px] font-normal leading-[24px] text-[#09090b] dark:text-white">
                  Deposit Requested{quote.deposit_percentage && parseFloat(quote.deposit_percentage) > 0 ? ` (${parseFloat(quote.deposit_percentage)}%)` : ''}:
                </span>
                <span className="w-[216px] text-[16px] font-medium leading-[24px] text-[#09090b] dark:text-white">
                  {formatCurrency(parseFloat(quote.deposit_amount || quote.deposit || 0), quote.currency?.code)}
                </span>
              </div>
            )}
          </div>

          {/* Project Allocations */}
          {(quote.project_allocations?.length > 0) && (
            <AllocationSummaryBar
              allocations={quote.project_allocations || []}
              totalAmount={parseFloat(quote.total) || 0}
              currency={quote.currency?.code || quote.currency || 'GBP'}
              onManageClick={() => setShowProjectModal(true)}
              showManageButton={true}
            />
          )}

          {/* Notes Section */}
          {quote.notes && (
            <div className="flex flex-col gap-4">
              <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
                Notes
              </p>
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                {quote.notes}
              </p>
            </div>
          )}

          {/* Terms & Conditions */}
          {quote.terms && (
            <div className="flex flex-col gap-4 pt-4 border-t border-[#e5e5e5] dark:border-gray-700">
              <p className="text-[14px] font-medium leading-[22px] text-[#09090b] dark:text-white">
                Terms & Conditions
              </p>
              <p className="text-[14px] font-normal leading-[22px] text-[#71717a] whitespace-pre-wrap">
                {quote.terms}
              </p>
            </div>
          )}
        </div>

        {/* Reminder Status Card - Only show for sent/viewed quotes */}
        {(status === QUOTE_STATUS.SENT || status === 'viewed') && (
          <div className="w-full max-w-[840px] bg-white dark:bg-gray-800 border-2 border-[#e5e5e5] dark:border-gray-700 rounded-[12px] p-6">
            <h3 className="text-[16px] font-semibold leading-[24px] text-[#09090b] dark:text-white mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#71717a]" />
              Reminder Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Reminders Sent</p>
                <p className="text-[18px] font-semibold leading-[26px] text-[#09090b] dark:text-white">
                  {quote.reminder_count || 0}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Last Reminder</p>
                <p className="text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                  {quote.last_reminder_sent_at
                    ? formatDate(quote.last_reminder_sent_at)
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Next Reminder</p>
                <p className="text-[14px] font-normal leading-[22px] text-[#09090b] dark:text-white">
                  {quote.reminders_stopped
                    ? 'Stopped'
                    : quote.next_reminder_due_at
                      ? formatDate(quote.next_reminder_due_at)
                      : 'Not scheduled'}
                </p>
              </div>
              <div>
                <p className="text-[12px] font-normal leading-[20px] text-[#71717a]">Status</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
                  quote.reminders_stopped
                    ? 'bg-[#f4f4f5] text-[#71717a]'
                    : 'bg-[#dcfce7] text-[#09090b]'
                }`}>
                  {quote.reminders_stopped ? 'Paused' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        )}

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
                  ({viewHistory.total} view{viewHistory.total !== 1 ? 's' : ''}{viewHistory.unique_ip_count ? `, ${viewHistory.unique_ip_count} unique` : ''})
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

                    // Extract source from referrer
                    let source = 'Direct link';
                    if (view.referrer) {
                      try {
                        const url = new URL(view.referrer);
                        if (url.hostname.includes('mail.google')) source = 'Gmail';
                        else if (url.hostname.includes('outlook')) source = 'Outlook';
                        else if (url.hostname.includes('yahoo')) source = 'Yahoo Mail';
                        else source = url.hostname;
                      } catch {
                        source = view.referrer;
                      }
                    }

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
                          <div className="mt-1 text-xs text-[#71717a] space-y-0.5">
                            {view.ip_address && <p>IP: {view.ip_address}</p>}
                            <p>Source: {source}</p>
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
      <SendQuoteModal isOpen={showSendModal} onClose={() => setShowSendModal(false)} quote={quote} />
      <ConvertToInvoiceModal isOpen={showConvertModal} onClose={() => setShowConvertModal(false)} quote={quote} />

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
