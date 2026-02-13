/**
 * Finance domain types.
 * Convenience re-exports from OpenAPI generated types.
 */
import type { components } from './api.generated';

// ──────────────────────────────────────────────
// Shared Finance Enums
// ──────────────────────────────────────────────

export type PricingTypeEnum = components['schemas']['PricingTypeEnum'];
// RecurringTypeEnum is exported from crm.ts (same underlying schema)
export type CustomPeriodEnum = components['schemas']['CustomPeriodEnum'];
export type DiscountTypeEnum = components['schemas']['DiscountTypeEnum'];
export type DiscountDepositTypeEnum = components['schemas']['DiscountDepositTypeEnum'];
export type MonthlyRecurringTypeEnum = components['schemas']['MonthlyRecurringTypeEnum'];
export type PaymentMethodEnum = components['schemas']['PaymentMethodEnum'];
export type ExportFormatEnum = components['schemas']['ExportFormatEnum'];

// ──────────────────────────────────────────────
// Invoices
// ──────────────────────────────────────────────

export type InvoiceStatusEnum = components['schemas']['InvoiceStatusEnum'];
export type InvoiceResponse = components['schemas']['InvoiceResponse'];
export type InvoiceCreate = components['schemas']['InvoiceCreate'];
export type InvoiceUpdate = components['schemas']['InvoiceUpdate'];
export type InvoiceListResponse = components['schemas']['InvoiceListResponse'];
export type InvoiceListItemResponse = components['schemas']['InvoiceListItemResponse'];
export type InvoiceListStats = components['schemas']['InvoiceListStats'];
export type InvoiceStatsResponse = components['schemas']['InvoiceStatsResponse'];
export type InvoiceCurrencyStats = components['schemas']['InvoiceCurrencyStats'];
export type InvoiceCurrencyTotal = components['schemas']['InvoiceCurrencyTotal'];
export type SimpleInvoiceResponse = components['schemas']['SimpleInvoiceResponse'];
export type SimpleInvoiceInfo = components['schemas']['SimpleInvoiceInfo'];
export type PublicInvoiceResponse = components['schemas']['PublicInvoiceResponse'];

// Invoice Items
export type InvoiceItemResponse = components['schemas']['InvoiceItemResponse'];
export type InvoiceItemCreate = components['schemas']['InvoiceItemCreate'];
export type InvoiceItemUpdate = components['schemas']['InvoiceItemUpdate'];
export type InvoiceItemTaxResponse = components['schemas']['InvoiceItemTaxResponse'];
export type InvoiceItemTaxCreate = components['schemas']['InvoiceItemTaxCreate'];
export type InvoiceTaxResponse = components['schemas']['InvoiceTaxResponse'];
export type DocumentTaxCreate = components['schemas']['DocumentTaxCreate'];
export type DocumentTaxUpdate = components['schemas']['DocumentTaxUpdate'];

// Invoice Actions
export type InvoiceSendRequest = components['schemas']['InvoiceSendRequest'];
export type InvoiceSendResponse = components['schemas']['InvoiceSendResponse'];
export type InvoiceSendRecipient = components['schemas']['InvoiceSendRecipient'];
export type InvoiceMarkPaidRequest = components['schemas']['InvoiceMarkPaidRequest'];
export type ChargeSavedCardRequest = components['schemas']['ChargeSavedCardRequest'];
export type ChargeSavedCardResponse = components['schemas']['ChargeSavedCardResponse'];

// Invoice History & Views
export type InvoiceHistoryResponse = components['schemas']['InvoiceHistoryResponse'];
export type InvoiceChangeHistoryResponse = components['schemas']['InvoiceChangeHistoryResponse'];
export type InvoiceViewResponse = components['schemas']['InvoiceViewResponse'];
export type InvoiceViewHistoryResponse = components['schemas']['InvoiceViewHistoryResponse'];

// Invoice Payment Allocations
export type InvoicePaymentAllocationResponse = components['schemas']['InvoicePaymentAllocationResponse'];
export type InvoicePaymentAllocationCreate = components['schemas']['InvoicePaymentAllocationCreate'];

// ──────────────────────────────────────────────
// Quotes
// ──────────────────────────────────────────────

export type QuoteStatusEnum = components['schemas']['QuoteStatusEnum'];
export type QuoteResponse = components['schemas']['QuoteResponse'];
export type QuoteCreate = components['schemas']['QuoteCreate'];
export type QuoteUpdate = components['schemas']['QuoteUpdate'];
export type QuoteListResponse = components['schemas']['QuoteListResponse'];
export type QuoteListItemResponse = components['schemas']['QuoteListItemResponse'];
export type QuoteListStats = components['schemas']['QuoteListStats'];
export type QuoteStatsResponse = components['schemas']['QuoteStatsResponse'];
export type QuoteCurrencyStats = components['schemas']['QuoteCurrencyStats'];
export type QuoteCurrencyTotal = components['schemas']['QuoteCurrencyTotal'];
export type PublicQuoteResponse = components['schemas']['PublicQuoteResponse'];

// Quote Items
export type QuoteItemResponse = components['schemas']['QuoteItemResponse'];
export type QuoteItemCreate = components['schemas']['QuoteItemCreate'];
export type QuoteItemUpdate = components['schemas']['QuoteItemUpdate'];
export type QuoteItemTaxResponse = components['schemas']['QuoteItemTaxResponse'];
export type QuoteItemTaxCreate = components['schemas']['QuoteItemTaxCreate'];
export type QuoteTaxResponse = components['schemas']['QuoteTaxResponse'];

// Quote Actions
export type QuoteSendRequest = components['schemas']['QuoteSendRequest'];
export type QuoteSendResponse = components['schemas']['QuoteSendResponse'];
export type QuoteSendRecipient = components['schemas']['QuoteSendRecipient'];
export type QuoteAcceptRequest = components['schemas']['app__schemas__crm__quote__QuoteAcceptRequest'];
export type QuoteRejectRequest = components['schemas']['app__schemas__crm__quote__QuoteRejectRequest'];
export type QuoteActionResponse = components['schemas']['QuoteActionResponse'];
export type QuoteRevisionCreate = components['schemas']['QuoteRevisionCreate'];

// Quote History & Views
export type QuoteHistoryResponse = components['schemas']['QuoteHistoryResponse'];
export type QuoteChangeHistoryResponse = components['schemas']['QuoteChangeHistoryResponse'];
export type QuoteViewResponse = components['schemas']['QuoteViewResponse'];
export type QuoteViewsListResponse = components['schemas']['QuoteViewsListResponse'];

// Quote Templates
export type QuoteTemplateResponse = components['schemas']['QuoteTemplateResponse'];
export type QuoteTemplateCreate = components['schemas']['QuoteTemplateCreate'];
export type QuoteTemplateUpdate = components['schemas']['QuoteTemplateUpdate'];
export type QuoteTemplateListResponse = components['schemas']['QuoteTemplateListResponse'];
export type SimpleQuoteTemplateResponse = components['schemas']['SimpleQuoteTemplateResponse'];

// ──────────────────────────────────────────────
// Expenses
// ──────────────────────────────────────────────

export type ExpenseStatusEnum = components['schemas']['ExpenseStatusEnum'];
export type ExpenseResponse = components['schemas']['ExpenseResponse'];
export type ExpenseCreate = components['schemas']['ExpenseCreate'];
export type ExpenseUpdate = components['schemas']['ExpenseUpdate'];
export type ExpenseListResponse = components['schemas']['ExpenseListResponse'];
export type ExpenseListItemResponse = components['schemas']['ExpenseListItemResponse'];
export type ExpenseListStats = components['schemas']['ExpenseListStats'];
export type ExpenseStatsResponse = components['schemas']['ExpenseStatsResponse'];
export type ExpenseCurrencyTotal = components['schemas']['ExpenseCurrencyTotal'];

// Expense Categories
export type ExpenseCategoryResponse = components['schemas']['ExpenseCategoryResponse'];
export type ExpenseCategoryCreate = components['schemas']['ExpenseCategoryCreate'];
export type ExpenseCategoryUpdate = components['schemas']['ExpenseCategoryUpdate'];
export type ExpenseCategoryListResponse = components['schemas']['ExpenseCategoryListResponse'];
export type SimpleExpenseCategoryResponse = components['schemas']['SimpleExpenseCategoryResponse'];

// Expense Bulk Operations
export type ExpenseBulkDeleteRequest = components['schemas']['ExpenseBulkDeleteRequest'];
export type ExpenseBulkDeleteResponse = components['schemas']['ExpenseBulkDeleteResponse'];

// Expense Receipts & Attachments
export type ExpenseReceiptUploadRequest = components['schemas']['ExpenseReceiptUploadRequest'];
export type ExpenseReceiptUploadResponse = components['schemas']['ExpenseReceiptUploadResponse'];

// Expense History
export type ExpenseHistoryResponse = components['schemas']['ExpenseHistoryResponse'];
export type ExpenseChangeHistoryResponse = components['schemas']['ExpenseChangeHistoryResponse'];

// Expense Allocations
export type ExpenseAllocationResponse = components['schemas']['ExpenseAllocationResponse'];
export type ExpenseAllocationCreate = components['schemas']['ExpenseAllocationCreate'];
export type ExpenseAllocationsResponse = components['schemas']['ExpenseAllocationsResponse'];
export type ExpenseAllocationsUpdate = components['schemas']['ExpenseAllocationsUpdate'];
export type ExpenseAllocationEntityType = components['schemas']['ExpenseAllocationEntityType'];

// ──────────────────────────────────────────────
// Payments (CRM/Finance)
// ──────────────────────────────────────────────

export type PaymentStatusEnum = components['schemas']['PaymentStatusEnum'];
export type PaymentResponse = components['schemas']['PaymentResponse'];
export type PaymentCreate = components['schemas']['PaymentCreate'];
export type PaymentUpdate = components['schemas']['PaymentUpdate'];
export type PaymentListResponse = components['schemas']['PaymentListResponse'];
export type PaymentListItemResponse = components['schemas']['PaymentListItemResponse'];
export type PaymentListStats = components['schemas']['PaymentListStats'];
export type PaymentStatsResponse = components['schemas']['PaymentStatsResponse'];
export type PaymentCurrencyTotal = components['schemas']['PaymentCurrencyTotal'];

// Payment Actions
export type PaymentAllocationRequest = components['schemas']['PaymentAllocationRequest'];
export type PaymentUnallocatedResponse = components['schemas']['PaymentUnallocatedResponse'];
export type PaymentRefundRequest = components['schemas']['PaymentRefundRequest'];
export type PaymentHistoryResponse = components['schemas']['PaymentHistoryResponse'];
export type PaymentChangeHistoryResponse = components['schemas']['PaymentChangeHistoryResponse'];
export type PaymentGatewayWebhookData = components['schemas']['PaymentGatewayWebhookData'];
export type PaymentStatusResponse = components['schemas']['PaymentStatusResponse'];

// ──────────────────────────────────────────────
// Credit Notes
// ──────────────────────────────────────────────

export type CreditNoteStatusEnum = components['schemas']['CreditNoteStatusEnum'];
export type CreditNoteResponse = components['schemas']['CreditNoteResponse'];
export type CreditNoteCreate = components['schemas']['CreditNoteCreate'];
export type CreditNoteUpdate = components['schemas']['CreditNoteUpdate'];
export type CreditNoteListResponse = components['schemas']['CreditNoteListResponse'];
export type CreditNoteListItemResponse = components['schemas']['CreditNoteListItemResponse'];
export type CreditNoteListStats = components['schemas']['CreditNoteListStats'];
export type CreditNoteStatsResponse = components['schemas']['CreditNoteStatsResponse'];
export type CreditNoteCurrencyTotal = components['schemas']['CreditNoteCurrencyTotal'];
export type CreditNoteItemResponse = components['schemas']['CreditNoteItemResponse'];
export type CreditNoteItemCreate = components['schemas']['CreditNoteItemCreate'];
export type CreditNoteSendRequest = components['schemas']['CreditNoteSendRequest'];

// ──────────────────────────────────────────────
// Reports & Transactions
// ──────────────────────────────────────────────

export type TransactionTypeEnum = components['schemas']['TransactionTypeEnum'];
export type TransactionSortFieldEnum = components['schemas']['TransactionSortFieldEnum'];
export type TransactionReportResponse = components['schemas']['TransactionReportResponse'];
export type TransactionListResponse = components['schemas']['TransactionListResponse'];
export type TransactionListItemResponse = components['schemas']['TransactionListItemResponse'];
export type TransactionSummary = components['schemas']['TransactionSummary'];
export type StatusAggregation = components['schemas']['StatusAggregation'];
export type TypeAggregation = components['schemas']['TypeAggregation'];
export type CurrencyAmountAggregation = components['schemas']['CurrencyAmountAggregation'];
export type PeriodAggregation = components['schemas']['PeriodAggregation'];

// ──────────────────────────────────────────────
// Payment Integrations (Stripe Connect / PayPal)
// ──────────────────────────────────────────────

export type PaymentIntegrationStatus = components['schemas']['PaymentIntegrationStatus'];
export type IntegrationStatus = components['schemas']['IntegrationStatus'];

// Stripe Connect
export type ConnectAccountResponse = components['schemas']['ConnectAccountResponse'];
export type ConnectPaymentResponse = components['schemas']['ConnectPaymentResponse'];
export type ConnectPaymentCreate = components['schemas']['ConnectPaymentCreate'];
export type ConnectPaymentSummary = components['schemas']['ConnectPaymentSummary'];
export type ConnectRefundRequest = components['schemas']['ConnectRefundRequest'];
export type ConnectRefundResponse = components['schemas']['ConnectRefundResponse'];
export type DashboardLinkResponse = components['schemas']['DashboardLinkResponse'];
export type OnboardingLinkResponse = components['schemas']['OnboardingLinkResponse'];
export type FeeSummaryResponse = components['schemas']['FeeSummaryResponse'];
export type SimpleFeeExpenseResponse = components['schemas']['SimpleFeeExpenseResponse'];

// Stripe Public Invoice Payments
export type StripePaymentRequest = components['schemas']['StripePaymentRequest'];
export type StripePaymentResponse = components['schemas']['StripePaymentResponse'];
export type SetupCardResponse = components['schemas']['SetupCardResponse'];
export type PayWithSavedCardRequest = components['schemas']['PayWithSavedCardRequest'];
export type PayWithSavedCardResponse = components['schemas']['PayWithSavedCardResponse'];

// PayPal
export type PayPalConnectRequest = components['schemas']['PayPalConnectRequest'];
export type PayPalConnectResponse = components['schemas']['PayPalConnectResponse'];
export type PayPalConnectionStatusResponse = components['schemas']['PayPalConnectionStatusResponse'];
export type PayPalMerchantAccountResponse = components['schemas']['PayPalMerchantAccountResponse'];
export type PayPalOrderCreateRequest = components['schemas']['PayPalOrderCreateRequest'];
export type PayPalOrderRequest = components['schemas']['PayPalOrderRequest'];
export type PayPalOrderResponse = components['schemas']['PayPalOrderResponse'];
export type PayPalCaptureRequest = components['schemas']['PayPalCaptureRequest'];
export type PayPalCaptureResponse = components['schemas']['PayPalCaptureResponse'];
export type PayPalRefundRequest = components['schemas']['PayPalRefundRequest'];
export type PayPalRefundResponse = components['schemas']['PayPalRefundResponse'];
export type PayPalTransactionResponse = components['schemas']['PayPalTransactionResponse'];
export type PayPalTransactionListResponse = components['schemas']['PayPalTransactionListResponse'];
export type PayPalTransactionSummary = components['schemas']['PayPalTransactionSummary'];
export type PayPalFeeSummaryResponse = components['schemas']['PayPalFeeSummaryResponse'];

// ──────────────────────────────────────────────
// Simple Allocation Types
// ──────────────────────────────────────────────

export type SimpleAllocationResponse = components['schemas']['SimpleAllocationResponse'];
export type SimpleProjectAllocationResponse = components['schemas']['SimpleProjectAllocationResponse'];
