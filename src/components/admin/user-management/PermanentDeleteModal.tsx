import React from 'react';
import { X, Loader2, AlertTriangle, Skull } from 'lucide-react';
import { PermanentDeleteModalState } from './types';

interface PermanentDeleteModalProps {
  permanentDeleteModal: PermanentDeleteModalState;
  deleteConfirmText: string;
  setDeleteConfirmText: (val: string) => void;
  onClose: () => void;
  onExecute: () => void;
}

const PermanentDeleteModal: React.FC<PermanentDeleteModalProps> = ({
  permanentDeleteModal,
  deleteConfirmText,
  setDeleteConfirmText,
  onClose,
  onExecute,
}) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !permanentDeleteModal.loading && onClose()} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Permanent Deletion</h2>
              <p className="text-sm text-red-700 dark:text-red-300">This action is IRREVERSIBLE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={permanentDeleteModal.loading}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {permanentDeleteModal.loading && !permanentDeleteModal.preview ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading deletion preview...</span>
            </div>
          ) : permanentDeleteModal.preview ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">User to be deleted:</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{permanentDeleteModal.preview.user_email}</p>
              </div>

              {/* Company Warning */}
              {permanentDeleteModal.preview.company_name && (
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">This user owns a company!</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Company "<span className="font-medium">{permanentDeleteModal.preview.company_name}</span>" will also be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data to be deleted */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Data to be deleted:</p>

                {/* User Records */}
                {permanentDeleteModal.preview.records_deleted?.user && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User Records</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {permanentDeleteModal.preview.records_deleted.user.subscriptions > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.user.subscriptions} subscription(s)
                        </div>
                      )}
                      {permanentDeleteModal.preview.records_deleted.user.payments > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.user.payments} payment(s)
                        </div>
                      )}
                      {permanentDeleteModal.preview.records_deleted.user.conversations > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.user.conversations} conversation(s)
                        </div>
                      )}
                      {permanentDeleteModal.preview.records_deleted.user.documents > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.user.documents} document(s)
                        </div>
                      )}
                      {permanentDeleteModal.preview.records_deleted.user.permissions > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.user.permissions} permission(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Company Records */}
                {permanentDeleteModal.preview.records_deleted?.company && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">Company Records</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {permanentDeleteModal.preview.records_deleted.company.contacts > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.company.contacts} contact(s)
                        </div>
                      )}
                      {permanentDeleteModal.preview.records_deleted.company.invoices > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.company.invoices} invoice(s)
                        </div>
                      )}
                      {permanentDeleteModal.preview.records_deleted.company.expenses > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.company.expenses} expense(s)
                        </div>
                      )}
                      {permanentDeleteModal.preview.records_deleted.company.quotes > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.company.quotes} quote(s)
                        </div>
                      )}
                      {permanentDeleteModal.preview.records_deleted.company.projects > 0 && (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                          {permanentDeleteModal.preview.records_deleted.company.projects} project(s)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* External services */}
                {(permanentDeleteModal.preview.stripe_subscriptions_cancelled > 0 ||
                  permanentDeleteModal.preview.stripe_customer_deleted ||
                  permanentDeleteModal.preview.stripe_connect_disconnected ||
                  permanentDeleteModal.preview.s3_files_deleted > 0 ||
                  permanentDeleteModal.preview.google_calendar_revoked ||
                  permanentDeleteModal.preview.zoom_revoked) && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">External Services</p>
                    <div className="flex flex-wrap gap-2">
                      {permanentDeleteModal.preview.stripe_subscriptions_cancelled > 0 && (
                        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                          {permanentDeleteModal.preview.stripe_subscriptions_cancelled} Stripe subscription(s)
                        </span>
                      )}
                      {permanentDeleteModal.preview.stripe_customer_deleted && (
                        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Stripe customer</span>
                      )}
                      {permanentDeleteModal.preview.stripe_connect_disconnected && (
                        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Stripe Connect</span>
                      )}
                      {permanentDeleteModal.preview.s3_files_deleted > 0 && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {permanentDeleteModal.preview.s3_files_deleted} S3 file(s)
                        </span>
                      )}
                      {permanentDeleteModal.preview.google_calendar_revoked && (
                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Google Calendar</span>
                      )}
                      {permanentDeleteModal.preview.zoom_revoked && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Zoom</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation Input */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white text-sm font-mono"
                  disabled={permanentDeleteModal.loading}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={permanentDeleteModal.loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onExecute}
            disabled={permanentDeleteModal.loading || deleteConfirmText !== 'DELETE'}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {permanentDeleteModal.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Skull className="h-4 w-4" />
                Permanently Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermanentDeleteModal;
