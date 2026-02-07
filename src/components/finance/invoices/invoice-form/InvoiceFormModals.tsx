import React from 'react';
import TaxModal from '../TaxModal';
import DiscountModal from '../DiscountModal';
import DepositModal from '../DepositModal';
import { LineItemTaxModal } from '../../shared';
import SendInvoiceDialog from '../SendInvoiceDialog';
import InvoiceSettingsModal from '../InvoiceSettingsModal';
import UnbilledHoursModal from '../UnbilledHoursModal';
import MarkHoursBilledModal from '../MarkHoursBilledModal';
import type { FormDocumentTax, FormLineItem, FormItemTax, InvoiceFormData, InvoiceSettingsUpdate, BillableHoursListResponse } from './types';

interface InvoiceFormModalsProps {
  // Tax modal
  showTaxModal: boolean;
  onCloseTaxModal: () => void;
  onSaveTaxes: (taxes: FormDocumentTax[]) => void;
  documentTaxes: FormDocumentTax[];

  // Discount modal
  showDiscountModal: boolean;
  onCloseDiscountModal: () => void;
  onSaveDiscount: (type: string, value: number) => void;
  discountType: string;
  discountValue: number;
  subtotal: number;
  currencyCode: string;

  // Deposit modal
  showDepositModal: boolean;
  onCloseDepositModal: () => void;
  onSaveDeposit: (type: string | null, value: number) => void;
  depositType: string | null;
  depositValue: number;
  total: number;

  // Line item tax modal
  showLineItemTaxModal: boolean;
  onCloseLineItemTaxModal: () => void;
  onSaveLineItemTax: (taxes: FormItemTax[]) => void;
  editingLineItemIndex: number | null;
  items: FormLineItem[];

  // Settings modal
  showSettingsModal: boolean;
  onCloseSettingsModal: () => void;
  isRecurring: boolean;
  recurringType: string;
  customEvery: number;
  customPeriod: string;
  recurringEndDate: string | null;
  recurringOccurrences: number | null;
  recurringStatus: string;
  invoiceDate: string;
  pricingType: string;
  recurringNumber: number;
  allowStripePayments: boolean;
  allowPaypalPayments: boolean;
  allowPartialPayments: boolean;
  automaticPaymentEnabled: boolean;
  automaticEmail: boolean;
  attachPdfToEmail: boolean;
  sendPaymentReceipt: boolean;
  receivePaymentNotifications: boolean;
  invoiceStatus: string;
  isEditing: boolean;
  overrideReminderSettings: boolean;
  invoiceRemindersEnabled: boolean | null;
  invoiceReminderFrequencyDays: number | null;
  maxInvoiceReminders: number | null;
  remindersStopped: boolean;
  reminderCount: number;
  lastReminderSentAt: string | null;
  nextReminderDueAt: string | null;
  settingsContact: any;
  onSettingsChange: (updates: InvoiceSettingsUpdate) => void;

  // Send dialog
  showSendDialog: boolean;
  onCloseSendDialog: () => void;
  savedInvoice: InvoiceFormData | null;
  sendContact: any;
  onSendSuccess: () => void;

  // Unbilled hours modal
  showUnbilledHoursModal: boolean;
  onCloseUnbilledHoursModal: () => void;
  onConfirmUnbilledHours: (lineItems: FormLineItem[]) => void;
  unbilledHoursData: BillableHoursListResponse | null;
  defaultCurrencyCode: string | undefined;
  checkingUnbilledHours: boolean;

  // Mark billed modal
  showMarkBilledModal: boolean;
  onCloseMarkBilledModal: () => void;
  onConfirmMarkBilled: () => void;
  pendingBillableHourIdsCount: number;
  markingAsBilled: boolean;
}

const InvoiceFormModals: React.FC<InvoiceFormModalsProps> = ({
  showTaxModal,
  onCloseTaxModal,
  onSaveTaxes,
  documentTaxes,
  showDiscountModal,
  onCloseDiscountModal,
  onSaveDiscount,
  discountType,
  discountValue,
  subtotal,
  currencyCode,
  showDepositModal,
  onCloseDepositModal,
  onSaveDeposit,
  depositType,
  depositValue,
  total,
  showLineItemTaxModal,
  onCloseLineItemTaxModal,
  onSaveLineItemTax,
  editingLineItemIndex,
  items,
  showSettingsModal,
  onCloseSettingsModal,
  isRecurring,
  recurringType,
  customEvery,
  customPeriod,
  recurringEndDate,
  recurringOccurrences,
  recurringStatus,
  invoiceDate,
  pricingType,
  recurringNumber,
  allowStripePayments,
  allowPaypalPayments,
  allowPartialPayments,
  automaticPaymentEnabled,
  automaticEmail,
  attachPdfToEmail,
  sendPaymentReceipt,
  receivePaymentNotifications,
  invoiceStatus,
  isEditing,
  overrideReminderSettings,
  invoiceRemindersEnabled,
  invoiceReminderFrequencyDays,
  maxInvoiceReminders,
  remindersStopped,
  reminderCount,
  lastReminderSentAt,
  nextReminderDueAt,
  settingsContact,
  onSettingsChange,
  showSendDialog,
  onCloseSendDialog,
  savedInvoice,
  sendContact,
  onSendSuccess,
  showUnbilledHoursModal,
  onCloseUnbilledHoursModal,
  onConfirmUnbilledHours,
  unbilledHoursData,
  defaultCurrencyCode,
  checkingUnbilledHours,
  showMarkBilledModal,
  onCloseMarkBilledModal,
  onConfirmMarkBilled,
  pendingBillableHourIdsCount,
  markingAsBilled,
}) => {
  return (
    <>
      {/* Modals */}
      <TaxModal
        isOpen={showTaxModal}
        onClose={onCloseTaxModal}
        onSave={(taxes: FormDocumentTax[]) => onSaveTaxes(taxes)}
        initialDocumentTaxes={documentTaxes}
      />

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={onCloseDiscountModal}
        onSave={(type: string, value: number) => {
          onSaveDiscount(type, value);
        }}
        initialDiscountType={discountType}
        initialDiscountValue={discountValue}
        subtotal={subtotal}
        currency={currencyCode}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={onCloseDepositModal}
        onSave={(type: string | null, value: number) => {
          onSaveDeposit(type, value);
        }}
        initialDepositType={depositType}
        initialDepositValue={depositValue}
        total={total}
        currency={currencyCode}
      />

      <LineItemTaxModal
        isOpen={showLineItemTaxModal}
        onClose={onCloseLineItemTaxModal}
        onSave={onSaveLineItemTax}
        itemAmount={editingLineItemIndex !== null ? Number(items[editingLineItemIndex]?.amount || 0) : 0}
        initialTaxes={editingLineItemIndex !== null ? (items[editingLineItemIndex]?.taxes || []) : []}
        currency={currencyCode}
      />

      <InvoiceSettingsModal
        isOpen={showSettingsModal}
        onClose={onCloseSettingsModal}
        isRecurring={isRecurring}
        recurringType={recurringType}
        customEvery={customEvery}
        customPeriod={customPeriod}
        recurringEndDate={recurringEndDate ?? undefined}
        recurringOccurrences={recurringOccurrences ?? undefined}
        recurringStatus={recurringStatus}
        startDate={invoiceDate}
        pricingType={pricingType}
        recurringNumber={recurringNumber}
        allowStripePayments={allowStripePayments}
        allowPaypalPayments={allowPaypalPayments}
        allowPartialPayments={allowPartialPayments}
        automaticPaymentEnabled={automaticPaymentEnabled}
        automaticEmail={automaticEmail}
        attachPdfToEmail={attachPdfToEmail}
        sendPaymentReceipt={sendPaymentReceipt}
        receivePaymentNotifications={receivePaymentNotifications}
        invoiceStatus={invoiceStatus}
        isEditing={isEditing}
        // Reminder settings
        overrideReminderSettings={overrideReminderSettings}
        invoiceRemindersEnabled={invoiceRemindersEnabled}
        invoiceReminderFrequencyDays={invoiceReminderFrequencyDays}
        maxInvoiceReminders={maxInvoiceReminders}
        remindersStopped={remindersStopped}
        reminderCount={reminderCount}
        lastReminderSentAt={lastReminderSentAt}
        nextReminderDueAt={nextReminderDueAt}
        contact={settingsContact}
        onChange={onSettingsChange}
      />

      {/* Send Invoice Dialog */}
      <SendInvoiceDialog
        isOpen={showSendDialog}
        onClose={onCloseSendDialog}
        invoice={savedInvoice}
        contact={sendContact}
        onSuccess={onSendSuccess}
      />

      {/* Unbilled Hours Modal */}
      <UnbilledHoursModal
        isOpen={showUnbilledHoursModal}
        onClose={onCloseUnbilledHoursModal}
        onConfirm={onConfirmUnbilledHours}
        data={unbilledHoursData}
        defaultCurrency={defaultCurrencyCode ?? ''}
        loading={checkingUnbilledHours}
      />

      {/* Mark Hours as Billed Modal */}
      <MarkHoursBilledModal
        isOpen={showMarkBilledModal}
        onClose={onCloseMarkBilledModal}
        onConfirm={onConfirmMarkBilled}
        hoursCount={pendingBillableHourIdsCount}
        loading={markingAsBilled}
      />
    </>
  );
};

export default InvoiceFormModals;
