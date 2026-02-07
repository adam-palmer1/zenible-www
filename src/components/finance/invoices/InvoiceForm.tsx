import React from 'react';
import { Loader2 } from 'lucide-react';
import { INVOICE_STATUS } from '../../../constants/finance';
import { DocumentLineItems, DocumentTotals } from '../shared';
import InvoiceFormHeader from './InvoiceFormHeader';
import InvoiceFormNotes from './InvoiceFormNotes';
import InvoiceFormActions from './InvoiceFormActions';
import {
  useInvoiceFormState,
  InvoiceFormModals,
  InvoiceFormPageLayout,
} from './invoice-form';
import type { InvoiceFormProps, InvoiceSettingsUpdate } from './invoice-form';

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice: invoiceProp = null, onSuccess, isInModal = false }) => {
  const state = useInvoiceFormState(invoiceProp, onSuccess);

  // Show loading state when fetching invoice data
  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="inline-block h-8 w-8 animate-spin text-purple-600 mb-2" />
          <p className="text-sm text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const handleSettingsChange = (updates: InvoiceSettingsUpdate) => {
    if ('isRecurring' in updates) {
      state.setIsRecurring(updates.isRecurring ?? false);
      state.setPricingType(updates.isRecurring ? 'recurring' : 'fixed');
    }
    if ('pricingType' in updates) {
      state.setPricingType(updates.pricingType ?? 'fixed');
      state.setIsRecurring(updates.pricingType === 'recurring');
    }
    if ('recurringType' in updates && updates.recurringType !== undefined) state.setRecurringType(updates.recurringType);
    if ('customEvery' in updates && updates.customEvery !== undefined) state.setCustomEvery(updates.customEvery);
    if ('customPeriod' in updates && updates.customPeriod !== undefined) state.setCustomPeriod(updates.customPeriod);
    if ('recurringEndDate' in updates) state.setRecurringEndDate(updates.recurringEndDate ?? null);
    if ('recurringOccurrences' in updates) state.setRecurringOccurrences(updates.recurringOccurrences ?? null);
    if ('recurringStatus' in updates && updates.recurringStatus !== undefined) state.setRecurringStatus(updates.recurringStatus);
    if ('recurringNumber' in updates && updates.recurringNumber !== undefined) state.setRecurringNumber(updates.recurringNumber);
    if ('allowStripePayments' in updates) state.setAllowStripePayments(updates.allowStripePayments ?? false);
    if ('allowPaypalPayments' in updates) state.setAllowPaypalPayments(updates.allowPaypalPayments ?? false);
    if ('allowPartialPayments' in updates) state.setAllowPartialPayments(updates.allowPartialPayments ?? false);
    if ('automaticPaymentEnabled' in updates) state.setAutomaticPaymentEnabled(updates.automaticPaymentEnabled ?? false);
    if ('automaticEmail' in updates) state.setAutomaticEmail(updates.automaticEmail ?? true);
    if ('attachPdfToEmail' in updates) state.setAttachPdfToEmail(updates.attachPdfToEmail ?? true);
    if ('sendPaymentReceipt' in updates) state.setSendPaymentReceipt(updates.sendPaymentReceipt ?? true);
    if ('receivePaymentNotifications' in updates) state.setReceivePaymentNotifications(updates.receivePaymentNotifications ?? true);
    // Reminder settings
    if ('overrideReminderSettings' in updates) {
      state.setOverrideReminderSettings(updates.overrideReminderSettings ?? false);
      if (!updates.overrideReminderSettings) {
        // Clear overrides when disabling
        state.setInvoiceRemindersEnabled(null);
        state.setInvoiceReminderFrequencyDays(null);
        state.setMaxInvoiceReminders(null);
      }
    }
    if ('invoiceRemindersEnabled' in updates) state.setInvoiceRemindersEnabled(updates.invoiceRemindersEnabled ?? null);
    if ('invoiceReminderFrequencyDays' in updates) state.setInvoiceReminderFrequencyDays(updates.invoiceReminderFrequencyDays ?? null);
    if ('maxInvoiceReminders' in updates) state.setMaxInvoiceReminders(updates.maxInvoiceReminders ?? null);
    if ('remindersStopped' in updates) state.setRemindersStopped(updates.remindersStopped ?? false);
  };

  const formContent = (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Form Fields Grid */}
      <InvoiceFormHeader
        contactId={state.contactId}
        contactsLoading={state.contactsLoading}
        allContacts={state.allContacts}
        showClientModal={state.showClientModal}
        onSetShowClientModal={state.setShowClientModal}
        onClientSelect={state.handleClientSelect}
        clientButtonRef={state.clientButtonRef}
        invoiceNumber={state.invoiceNumber}
        onInvoiceNumberChange={state.setInvoiceNumber}
        invoiceDate={state.invoiceDate}
        onInvoiceDateChange={state.setInvoiceDate}
        dueDate={state.dueDate}
        onDueDateChange={state.setDueDate}
        currency={state.currency}
        currencies={state.currencies}
        currenciesLoading={state.currenciesLoading}
        showCurrencyModal={state.showCurrencyModal}
        onSetShowCurrencyModal={state.setShowCurrencyModal}
        onCurrencySelect={state.setCurrency}
        currencyButtonRef={state.currencyButtonRef}
      />

      {/* Line Items */}
      <DocumentLineItems
        items={state.items}
        currencyCode={state.currencyCode}
        numberFormat={state.numberFormat}
        onAddItem={state.addLineItem}
        onUpdateItem={state.updateLineItem}
        onRemoveItem={state.removeLineItem}
        onOpenTaxModal={state.openLineItemTaxModal}
        calculateItemTotal={state.calculateItemTotal}
      />

      {/* Totals Section */}
      <DocumentTotals
        totals={state.totals}
        currencyCode={state.currencyCode}
        numberFormat={state.numberFormat}
        documentTaxes={state.documentTaxes}
        onEditTax={() => state.setShowTaxModal(true)}
        onRemoveTax={() => state.setDocumentTaxes([])}
        discountType={state.discountType}
        discountValue={state.discountValue}
        onEditDiscount={() => state.setShowDiscountModal(true)}
        onRemoveDiscount={() => state.setDiscountValue(0)}
        depositType={state.depositType}
        depositValue={state.depositValue}
        onEditDeposit={() => state.setShowDepositModal(true)}
        onRemoveDeposit={() => { state.setDepositValue(0); state.setDepositType(null); }}
      />

      {/* Notes and Terms */}
      <InvoiceFormNotes
        notes={state.notes}
        onNotesChange={state.setNotes}
        paymentInstructions={state.paymentInstructions}
        onPaymentInstructionsChange={state.setPaymentInstructions}
        companyDefaultPaymentInstructions={state.companyDefaultPaymentInstructions}
        showChangeReason={!!(state.invoice?.id || state.id)}
        changeReason={state.changeReason}
        onChangeReasonChange={state.setChangeReason}
      />

      {/* Footer Buttons (only in modal mode) */}
      {isInModal && (
        <InvoiceFormActions
          saving={state.saving}
          saveButtonText={state.getSaveButtonText()}
          onSaveDraft={() => state.handleSave(state.invoice?.status && state.invoice.status !== 'draft' ? state.invoice.status : INVOICE_STATUS.DRAFT)}
          onSaveAndSend={() => state.handleSave(INVOICE_STATUS.SENT, true)}
          onOpenSettings={() => state.setShowSettingsModal(true)}
        />
      )}

      <InvoiceFormModals
        showTaxModal={state.showTaxModal}
        onCloseTaxModal={() => state.setShowTaxModal(false)}
        onSaveTaxes={(taxes) => state.setDocumentTaxes(taxes)}
        documentTaxes={state.documentTaxes}
        showDiscountModal={state.showDiscountModal}
        onCloseDiscountModal={() => state.setShowDiscountModal(false)}
        onSaveDiscount={(type, value) => {
          state.setDiscountType(type);
          state.setDiscountValue(value);
        }}
        discountType={state.discountType}
        discountValue={state.discountValue}
        subtotal={state.totals.subtotal}
        currencyCode={state.currencyCode}
        showDepositModal={state.showDepositModal}
        onCloseDepositModal={() => state.setShowDepositModal(false)}
        onSaveDeposit={(type, value) => {
          state.setDepositType(type);
          state.setDepositValue(value);
          // Auto-enable partial payments when deposit is requested
          if (value > 0) {
            state.setAllowPartialPayments(true);
          }
        }}
        depositType={state.depositType}
        depositValue={state.depositValue}
        total={state.totals.total}
        showLineItemTaxModal={state.showLineItemTaxModal}
        onCloseLineItemTaxModal={() => {
          state.setShowLineItemTaxModal(false);
          state.setEditingLineItemIndex(null);
        }}
        onSaveLineItemTax={state.handleLineItemTaxSave}
        editingLineItemIndex={state.editingLineItemIndex}
        items={state.items}
        showSettingsModal={state.showSettingsModal}
        onCloseSettingsModal={() => state.setShowSettingsModal(false)}
        isRecurring={state.isRecurring}
        recurringType={state.recurringType}
        customEvery={state.customEvery}
        customPeriod={state.customPeriod}
        recurringEndDate={state.recurringEndDate}
        recurringOccurrences={state.recurringOccurrences}
        recurringStatus={state.recurringStatus}
        invoiceDate={state.invoiceDate}
        pricingType={state.pricingType}
        recurringNumber={state.recurringNumber}
        allowStripePayments={state.allowStripePayments}
        allowPaypalPayments={state.allowPaypalPayments}
        allowPartialPayments={state.allowPartialPayments}
        automaticPaymentEnabled={state.automaticPaymentEnabled}
        automaticEmail={state.automaticEmail}
        attachPdfToEmail={state.attachPdfToEmail}
        sendPaymentReceipt={state.sendPaymentReceipt}
        receivePaymentNotifications={state.receivePaymentNotifications}
        invoiceStatus={state.invoice?.status || 'draft'}
        isEditing={state.isEditing && state.isRecurring}
        overrideReminderSettings={state.overrideReminderSettings}
        invoiceRemindersEnabled={state.invoiceRemindersEnabled}
        invoiceReminderFrequencyDays={state.invoiceReminderFrequencyDays}
        maxInvoiceReminders={state.maxInvoiceReminders}
        remindersStopped={state.remindersStopped}
        reminderCount={state.reminderCount}
        lastReminderSentAt={state.lastReminderSentAt}
        nextReminderDueAt={state.nextReminderDueAt}
        settingsContact={state.allContacts.find((c) => c.id === state.contactId)}
        onSettingsChange={handleSettingsChange}
        showSendDialog={state.showSendDialog}
        onCloseSendDialog={() => state.setShowSendDialog(false)}
        savedInvoice={state.savedInvoice}
        sendContact={state.savedInvoice ? state.allContacts.find((c) => c.id === state.savedInvoice!.contact_id) : undefined}
        onSendSuccess={state.handleSendSuccess}
        showUnbilledHoursModal={state.showUnbilledHoursModal}
        onCloseUnbilledHoursModal={() => {
          state.setShowUnbilledHoursModal(false);
          state.setUnbilledHoursData(null);
        }}
        onConfirmUnbilledHours={state.handleAddUnbilledHours}
        unbilledHoursData={state.unbilledHoursData}
        defaultCurrencyCode={state.defaultCurrencyAssoc?.currency?.code}
        checkingUnbilledHours={state.checkingUnbilledHours}
        showMarkBilledModal={state.showMarkBilledModal}
        onCloseMarkBilledModal={state.handleDeclineMarkBilled}
        onConfirmMarkBilled={state.handleMarkHoursAsBilled}
        pendingBillableHourIdsCount={state.pendingBillableHourIds.length}
        markingAsBilled={state.markingAsBilled}
      />
    </div>
  );

  // If in modal, return form content directly
  if (isInModal) {
    return formContent;
  }

  // Otherwise, wrap in FinanceLayout with header and action buttons
  return (
    <InvoiceFormPageLayout
      isEditing={state.isEditing}
      saving={state.saving}
      saveButtonText={state.getSaveButtonText()}
      onBack={() => state.navigate('/finance/invoices')}
      onOpenSettings={() => state.setShowSettingsModal(true)}
      onSaveDraft={() => state.handleSave(state.invoice?.status && state.invoice.status !== 'draft' ? state.invoice.status : INVOICE_STATUS.DRAFT)}
      onSaveAndSend={() => state.handleSave(INVOICE_STATUS.SENT, true)}
    >
      {formContent}
    </InvoiceFormPageLayout>
  );
};

export default InvoiceForm;
