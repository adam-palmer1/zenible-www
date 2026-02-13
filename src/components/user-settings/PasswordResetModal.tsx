import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface PasswordResetModalProps {
  email: string;
  passwordResetSent: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PasswordResetModal({
  email,
  passwordResetSent,
  onClose,
  onConfirm,
}: PasswordResetModalProps) {
  const { darkMode } = usePreferences();
  useEscapeKey(onClose);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Reset Password
          </h3>
        </div>

        <div className="p-6">
          {!passwordResetSent ? (
            <>
              <p className={`mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                We'll send a password reset link to:
              </p>
              <p className={`font-medium mb-6 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                {email}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onClose}
                  className={`px-4 py-2 border rounded-lg ${
                    darkMode
                      ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
                >
                  Send Reset Link
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className={`text-lg font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                Reset Link Sent!
              </p>
              <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                Check your email for the password reset link.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
