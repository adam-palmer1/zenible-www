import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

interface CancelSubscriptionModalProps {
  saving: boolean;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelSubscriptionModal({
  saving,
  cancelReason,
  setCancelReason,
  onClose,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const { darkMode } = usePreferences();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Cancel Subscription
          </h3>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className={`mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
              We're sorry to see you go! Your subscription will remain active until the end of your current billing period.
            </p>
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Help us improve - why are you cancelling? (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Tell us why you're cancelling..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg ${
                  darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                    : 'bg-white border-gray-300 text-gray-900'
                } placeholder-gray-500`}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className={`flex-1 px-4 py-2 border rounded-lg font-medium ${
                darkMode
                  ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50`}
            >
              Keep Subscription
            </button>
            <button
              onClick={onConfirm}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
