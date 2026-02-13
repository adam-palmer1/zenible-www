import React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useEscapeKey } from '../../../../hooks/useEscapeKey';

export interface DeleteCardModalProps {
  cardToDelete: any;
  deletingCard: string | null;
  deleteCardError: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteCardModal: React.FC<DeleteCardModalProps> = ({
  cardToDelete,
  deletingCard,
  deleteCardError,
  onConfirm,
  onCancel,
}) => {
  useEscapeKey(onCancel, true);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onCancel}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full relative z-10">
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Remove Saved Card
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to remove this card?
                  </p>
                  {cardToDelete && (cardToDelete.brand || cardToDelete.last4) && (
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {cardToDelete.brand?.charAt(0).toUpperCase() + cardToDelete.brand?.slice(1) || 'Card'} &bull;&bull;&bull;&bull; {cardToDelete.last4}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    You will need to add a new card for future automatic payments.
                  </p>
                  {deleteCardError && (
                    <p className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                      {deleteCardError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={!!deletingCard}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!!deletingCard}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {deletingCard ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Card'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCardModal;
