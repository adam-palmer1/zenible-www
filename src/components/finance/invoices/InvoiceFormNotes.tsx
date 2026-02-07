import React from 'react';

interface InvoiceFormNotesProps {
  notes: string;
  onNotesChange: (value: string) => void;
  paymentInstructions: string;
  onPaymentInstructionsChange: (value: string) => void;
  companyDefaultPaymentInstructions: string;
  // Change reason (only shown when editing)
  showChangeReason: boolean;
  changeReason: string;
  onChangeReasonChange: (value: string) => void;
}

const InvoiceFormNotes: React.FC<InvoiceFormNotesProps> = ({
  notes,
  onNotesChange,
  paymentInstructions,
  onPaymentInstructionsChange,
  companyDefaultPaymentInstructions,
  showChangeReason,
  changeReason,
  onChangeReasonChange,
}) => {
  return (
    <>
      {/* Notes and Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNotesChange(e.target.value)}
            placeholder="Invoice Notes (Visible to Clients)"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Instructions
          </label>
          <textarea
            value={paymentInstructions}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onPaymentInstructionsChange(e.target.value)}
            placeholder={companyDefaultPaymentInstructions || "Enter payment instructions"}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Change Reason - Only show when editing existing invoice */}
      {showChangeReason && (
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium design-text-primary mb-2">
            Reason for Change (Optional)
          </label>
          <textarea
            value={changeReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChangeReasonChange(e.target.value)}
            placeholder="Briefly explain why you're making this change..."
            rows={2}
            className="w-full px-3 py-2 design-input rounded-md text-sm"
          />
          <p className="text-xs design-text-secondary mt-1">
            This will be recorded in the audit trail to track changes made to this invoice
          </p>
        </div>
      )}
    </>
  );
};

export default InvoiceFormNotes;
