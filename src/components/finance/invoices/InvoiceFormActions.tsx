import React from 'react';
import { Loader2, Settings } from 'lucide-react';

interface InvoiceFormActionsProps {
  saving: boolean;
  saveButtonText: string;
  onSaveDraft: () => void;
  onSaveAndSend: () => void;
  onOpenSettings: () => void;
}

const InvoiceFormActions: React.FC<InvoiceFormActionsProps> = ({
  saving,
  saveButtonText,
  onSaveDraft,
  onSaveAndSend,
  onOpenSettings,
}) => {
  return (
    <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200">
      <button
        onClick={onOpenSettings}
        className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Invoice Settings
      </button>
      <div className="flex items-center gap-3">
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
  );
};

export default InvoiceFormActions;
