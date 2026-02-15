import React from 'react';
import { Link } from 'react-router-dom';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ChangePlanPreview {
  direction: string;
  current_plan_name: string;
  new_plan_name: string;
  current_price: number;
  new_price: number;
  billing_cycle: string;
  proration_amount?: number | null;
  next_payment_amount?: number | null;
  next_payment_date?: string | null;
  current_period_end?: string | null;
  currency: string;
}

interface PlanChangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  confirming: boolean;
  preview: ChangePlanPreview | null;
  error: string | null;
}

export default function PlanChangeConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  confirming,
  preview,
  error,
}: PlanChangeConfirmModalProps) {
  const { darkMode } = usePreferences();
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const isUpgrade = preview?.direction === 'upgrade';
  const billingLabel = preview?.billing_cycle?.toLowerCase() === 'annual' ? 'yr' : 'mo';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Confirm Plan Change
          </h3>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-zenible-primary border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                Loading preview...
              </p>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {/* Direction badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isUpgrade
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isUpgrade ? 'Upgrade' : 'Downgrade'}
              </span>

              {/* Plan transition */}
              <div className={`p-4 rounded-lg border ${
                darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Current</p>
                    <p className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {preview.current_plan_name}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      {formatCurrency(preview.current_price)}/{billingLabel}
                    </p>
                  </div>
                  <div className={`px-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div className="text-center flex-1">
                    <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>New</p>
                    <p className={`font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                      {preview.new_plan_name}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      {formatCurrency(preview.new_price)}/{billingLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* Change details */}
              <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                {isUpgrade ? (
                  preview.proration_amount != null ? (
                    <p>
                      This change takes effect immediately. You will be charged{' '}
                      <strong className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                        {formatCurrency(preview.proration_amount)} today
                      </strong>{' '}
                      (prorated for the remainder of your billing period). Going forward, you will be billed{' '}
                      <strong className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                        {formatCurrency(preview.new_price)}/{billingLabel}
                      </strong>.
                    </p>
                  ) : (
                    <p>
                      This change takes effect immediately. You will be charged the new plan price of{' '}
                      <strong className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                        {formatCurrency(preview.new_price)}/{billingLabel}
                      </strong>.
                    </p>
                  )
                ) : (
                  <p>
                    Your current plan remains active until{' '}
                    <strong className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                      {preview.current_period_end ? formatDate(preview.current_period_end) : 'the end of your billing period'}
                    </strong>.
                    After that, you&apos;ll be on the new plan at{' '}
                    <strong className={darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}>
                      {formatCurrency(preview.new_price)}/{billingLabel}
                    </strong>.
                  </p>
                )}
              </div>

              {/* Error display */}
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={confirming}
                  className={`flex-1 px-4 py-2 border rounded-lg font-medium ${
                    darkMode
                      ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={confirming}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 ${
                    isUpgrade
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {confirming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    `Confirm ${isUpgrade ? 'Upgrade' : 'Downgrade'}`
                  )}
                </button>
              </div>
            </div>
          ) : error?.includes('assigned by an administrator') ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                  darkMode ? 'bg-zenible-dark-bg' : 'bg-amber-50'
                }`}>
                  <svg className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                  Your plan has been assigned by an administrator. Please{' '}
                  <Link to="/support" className="text-zenible-primary hover:underline font-medium">
                    contact support
                  </Link>{' '}
                  for any changes.
                </p>
              </div>
              <button
                onClick={onClose}
                className={`w-full px-4 py-2 border rounded-lg font-medium ${
                  darkMode
                    ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Close
              </button>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={onClose}
                className={`w-full px-4 py-2 border rounded-lg font-medium ${
                  darkMode
                    ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Close
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export type { ChangePlanPreview };
