import React from 'react';
import { Loader2, ArrowLeft, Settings } from 'lucide-react';
import FinanceLayout from '../../layout/FinanceLayout';

interface InvoiceFormPageLayoutProps {
  isEditing: boolean;
  saving: boolean;
  saveButtonText: string;
  onBack: () => void;
  onOpenSettings: () => void;
  onSaveDraft: () => void;
  onSaveAndSend: () => void;
  children: React.ReactNode;
}

const InvoiceFormPageLayout: React.FC<InvoiceFormPageLayoutProps> = ({
  isEditing,
  saving,
  saveButtonText,
  onBack,
  onOpenSettings,
  onSaveDraft,
  onSaveAndSend,
  children,
}) => {
  return (
    <FinanceLayout
      header={
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Back to invoices"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Invoice' : 'New Invoice'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {isEditing ? 'Update invoice details' : 'Create a new invoice for your client'}
                </p>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenSettings}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Invoice Settings
              </button>
              <button
                onClick={onSaveDraft}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
                {saveButtonText}
              </button>
              <button
                onClick={onSaveAndSend}
                disabled={saving}
                className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 inline mr-2 animate-spin" /> : null}
                Save & Send
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </FinanceLayout>
  );
};

export default InvoiceFormPageLayout;
