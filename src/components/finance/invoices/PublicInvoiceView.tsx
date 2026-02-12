import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import invoicesAPI from '../../../services/api/finance/invoices';
import type { PaymentStatusResponse } from '../../../types/finance';
import { API_BASE_URL } from '../../../config/api';
import InvoiceHeader from './public-invoice/InvoiceHeader';
import InvoiceParties from './public-invoice/InvoiceParties';
import InvoiceLineItemsTable from './public-invoice/InvoiceLineItemsTable';
import InvoiceTotalsSection from './public-invoice/InvoiceTotalsSection';
import InvoicePaymentSummary from './public-invoice/InvoicePaymentSummary';
import InvoiceNotesSection from './public-invoice/InvoiceNotesSection';
import InvoiceSidebar from './public-invoice/InvoiceSidebar';
import DeleteCardModal from './public-invoice/DeleteCardModal';

const invoicesAPITyped = invoicesAPI;

/**
 * Public Invoice View Component
 */
const PublicInvoiceView: React.FC = () => {
  const { shareCode, token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardSetupSuccess, setCardSetupSuccess] = useState(false);
  const [capturingPayPal, setCapturingPayPal] = useState(false);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(false);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);
  const [showDeleteCardModal, setShowDeleteCardModal] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [deleteCardError, setDeleteCardError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Use shareCode from URL or fall back to token for backwards compatibility
  const invoiceCode = shareCode || token;

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  };

  // Load invoice
  const loadInvoice = useCallback(async () => {
    if (!invoiceCode) {
      setError('Invalid invoice link');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await invoicesAPITyped.getPublicByShareCode(invoiceCode);
      setInvoice(data);

      if (data.status === 'paid') {
        setPaymentSuccess(true);
      }
    } catch (err: any) {
      console.error('[PublicInvoiceView] Error loading invoice:', err);
      if (err.status === 404) {
        setError('Invoice not found or link has expired.');
      } else {
        setError(err.message || 'Failed to load invoice');
      }
    } finally {
      setLoading(false);
    }
  }, [invoiceCode]);

  // Load saved cards
  const loadSavedCards = useCallback(async () => {
    if (!invoiceCode) return;

    try {
      setLoadingSavedCards(true);
      const data = await invoicesAPITyped.getSavedCards(invoiceCode) as { payment_methods?: Array<{ id: string; brand: string; last4: string; exp_month?: number; exp_year?: number }> };
      setSavedCards(data.payment_methods || []);
    } catch (err: any) {
      console.error('[PublicInvoiceView] Error loading saved cards:', err);
      // Don't show error to user - just means no cards saved
      setSavedCards([]);
    } finally {
      setLoadingSavedCards(false);
    }
  }, [invoiceCode]);

  // Download PDF
  const handleDownloadPdf = async () => {
    if (!invoiceCode) return;

    try {
      setDownloadingPdf(true);
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceCode}/pdf`);

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice?.invoice_number || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('[PublicInvoiceView] Error downloading PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Show delete card confirmation modal
  const handleDeleteCard = (paymentMethodId: string) => {
    if (!invoiceCode || !paymentMethodId) return;
    const card = savedCards.find((c: any) => c.id === paymentMethodId);
    setCardToDelete(card || { id: paymentMethodId });
    setDeleteCardError(null);
    setShowDeleteCardModal(true);
  };

  // Confirm delete card
  const confirmDeleteCard = async () => {
    if (!cardToDelete?.id) return;

    try {
      setDeletingCard(cardToDelete.id);
      setDeleteCardError(null);
      await invoicesAPITyped.deleteSavedCard(invoiceCode!, cardToDelete.id);
      // Reload both saved cards and invoice to get updated has_saved_payment_method
      await Promise.all([loadSavedCards(), loadInvoice()]);
      setShowDeleteCardModal(false);
      setCardToDelete(null);
    } catch (err: any) {
      console.error('[PublicInvoiceView] Error deleting card:', err);
      setDeleteCardError(err.message || 'Failed to remove card. Please try again.');
    } finally {
      setDeletingCard(null);
    }
  };

  // Cancel delete card
  const cancelDeleteCard = () => {
    setShowDeleteCardModal(false);
    setCardToDelete(null);
    setDeleteCardError(null);
  };

  // Handle PayPal return - run once on mount
  useEffect(() => {
    const handlePayPalReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      const paypalStatus = params.get('paypal');

      if (paypalStatus === 'approved') {
        const orderId = sessionStorage.getItem('paypal_order_id');
        const storedShareCode = sessionStorage.getItem('paypal_share_code');

        if (orderId && storedShareCode) {
          setCapturingPayPal(true);

          try {
            const result = await invoicesAPITyped.capturePayPalOrder(storedShareCode, {
              order_id: orderId,
            }) as PaymentStatusResponse & { status?: string };

            sessionStorage.removeItem('paypal_order_id');
            sessionStorage.removeItem('paypal_share_code');

            if (result.status === 'captured') {
              setPaymentSuccess(true);
            }
          } catch (err: any) {
            console.error('[PublicInvoiceView] PayPal capture error:', err);
            setError('Failed to complete PayPal payment. Please try again.');
          } finally {
            setCapturingPayPal(false);
          }
        }

        // Clear query params
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('paypal');
        setSearchParams(newParams, { replace: true });
      }

      if (paypalStatus === 'cancelled') {
        sessionStorage.removeItem('paypal_order_id');
        sessionStorage.removeItem('paypal_share_code');
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('paypal');
        setSearchParams(newParams, { replace: true });
      }
    };

    handlePayPalReturn();
  }, []); // Run once on mount

  // Initial load - run once
  useEffect(() => {
    loadInvoice();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load saved cards when invoice has card on file
  useEffect(() => {
    if (invoice?.has_saved_payment_method) {
      loadSavedCards();
    }
  }, [invoice?.has_saved_payment_method, loadSavedCards]);

  const handlePaymentSuccess = useCallback(async () => {
    // Refresh invoice data silently (without showing loading spinner)
    // so the updated amounts are displayed with the success message
    try {
      const data = await invoicesAPITyped.getPublicByShareCode(invoiceCode!);
      setInvoice(data);
    } catch (err: unknown) {
      console.error('[PublicInvoiceView] Error refreshing invoice after payment:', err);
    }
    // Show success toast temporarily
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
    // Mark payment as successful (hides payment form)
    setPaymentSuccess(true);
  }, [invoiceCode]);

  // Loading state
  if (loading || capturingPayPal) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8e51ff]"></div>
          <p className="mt-2 text-sm text-[#71717a]">
            {capturingPayPal ? 'Processing PayPal payment...' : 'Loading invoice...'}
          </p>
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

  if (!invoice) {
    return null;
  }

  const isPaid = invoice.status === 'paid';
  const isCancelled = invoice.status === 'cancelled';
  const amountDue = invoice.outstanding_balance || invoice.total - (invoice.paid_amount || 0);
  const canPayStripe = invoice.allow_stripe_payments && invoice.stripe_connected;
  const canPayPayPal = invoice.allow_paypal_payments && invoice.paypal_connected;
  const canPay = !isPaid && !isCancelled && amountDue > 0 && (canPayStripe || canPayPayPal);
  const items = invoice.invoice_items || invoice.items || [];

  // Recurring invoice detection
  const isRecurring = invoice.pricing_type === 'Recurring' || invoice.recurring_type;
  const automaticPaymentEnabled = invoice.automatic_payment_enabled === true;
  const canSetupAutomaticPayments = automaticPaymentEnabled && canPayStripe;
  const hasCardOnFile = invoice.has_saved_payment_method === true;

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0);
  const itemLevelTax = items.reduce((sum: number, item: any) => {
    const itemTax = item.taxes?.reduce((t: number, tax: any) => t + (tax.tax_amount || 0), 0) || 0;
    return sum + itemTax;
  }, 0);
  const hasTax = itemLevelTax > 0 || (invoice.tax_total && invoice.tax_total > 0);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">Payment successful! A confirmation email will be sent shortly.</p>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="px-4 md:px-8 py-4">
        {/* Main Content - Invoice and Payment side by side */}
        <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-4">
          {/* Main Invoice Card */}
          <div className="flex-1 bg-white border-2 border-[#e5e5e5] rounded-[12px] p-4 md:p-6 flex flex-col gap-6">
          {/* Header: Logo + Invoice Number | Dates + Status */}
          <InvoiceHeader invoice={invoice} formatDate={formatDate} />

          {/* Divider */}
          <div className="h-px bg-[#e5e5e5] w-full" />

          {/* From / Billed To */}
          <InvoiceParties invoice={invoice} />

          {/* Divider */}
          <div className="h-px bg-[#e5e5e5] w-full" />

          {/* Invoice Details */}
          <InvoiceLineItemsTable
            items={items}
            hasTax={hasTax}
            currencyCode={invoice.currency_code}
          />

          {/* Summary Details */}
          <InvoiceTotalsSection
            invoice={invoice}
            subtotal={subtotal}
            itemLevelTax={itemLevelTax}
          />

          {/* Payment Summary Card */}
          <InvoicePaymentSummary
            invoice={invoice}
            amountDue={amountDue}
          />

          {/* Payment Instructions & Notes - Side by Side */}
          <InvoiceNotesSection invoice={invoice} />
        </div>

          {/* Right Side Column */}
          <InvoiceSidebar
            invoice={invoice}
            invoiceCode={invoiceCode as string}
            amountDue={amountDue}
            isPaid={isPaid}
            isCancelled={isCancelled}
            canPay={canPay}
            canPayStripe={canPayStripe}
            canPayPayPal={canPayPayPal}
            isRecurring={isRecurring}
            canSetupAutomaticPayments={canSetupAutomaticPayments}
            hasCardOnFile={hasCardOnFile}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentSuccess={paymentSuccess}
            cardSetupSuccess={cardSetupSuccess}
            setCardSetupSuccess={setCardSetupSuccess}
            savedCards={savedCards}
            loadingSavedCards={loadingSavedCards}
            deletingCard={deletingCard}
            handleDeleteCard={handleDeleteCard}
            handlePaymentSuccess={handlePaymentSuccess}
            loadInvoice={loadInvoice}
            downloadingPdf={downloadingPdf}
            handleDownloadPdf={handleDownloadPdf}
          />
        </div>
      </div>

      {/* Delete Card Confirmation Modal */}
      {showDeleteCardModal && (
        <DeleteCardModal
          cardToDelete={cardToDelete}
          deletingCard={deletingCard}
          deleteCardError={deleteCardError}
          onConfirm={confirmDeleteCard}
          onCancel={cancelDeleteCard}
        />
      )}
    </div>
  );
};

export default PublicInvoiceView;
