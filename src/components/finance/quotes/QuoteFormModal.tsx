import React from 'react';
import { ChevronLeft } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import QuoteForm from './QuoteForm';

interface QuoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote?: any;
  onSuccess?: (result: any) => void;
}

/**
 * Quote Form Modal Wrapper matching InvoiceFormModal design
 * Clean modal with "Back to Quote" link and title/cancel header
 */
const QuoteFormModal: React.FC<QuoteFormModalProps> = ({ isOpen, onClose, quote = null, onSuccess }) => {
  const handleSuccess = (result: any) => {
    onClose();
    if (onSuccess) {
      onSuccess(result);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />

        {/* Content */}
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl focus:outline-none overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
            {/* Back to Quote Link */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Quotes
            </button>

            {/* Title and Cancel */}
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold text-gray-900">
                {quote ? 'Edit Quote' : 'Create New Quote'}
              </Dialog.Title>

              <button
                onClick={onClose}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-6 py-6">
            <QuoteForm
              quote={quote}
              onSuccess={handleSuccess}
              isInModal={true}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default QuoteFormModal;
