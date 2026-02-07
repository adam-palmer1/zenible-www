import React, { useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: string;
  billingCycle: string;
  onContinue: () => void;
}

export default function SubscriptionSuccessModal({
  isOpen,
  onClose,
  planName,
  price,
  billingCycle,
  onContinue
}: SubscriptionSuccessModalProps) {
  const { darkMode } = usePreferences();

  useEffect(() => {
    if (isOpen) {
      // Auto-redirect after 5 seconds
      const timer = setTimeout(() => {
        onContinue();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-md rounded-xl shadow-xl ${
        darkMode ? 'bg-zenible-dark-card' : 'bg-white'
      }`}>
        {/* Success Animation */}
        <div className="text-center p-8">
          <div className="relative mx-auto mb-6">
            {/* Success Checkmark Animation */}
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-green-500 rounded-full scale-0 animate-ping"></div>
              <svg
                className="w-10 h-10 text-green-600 dark:text-green-400 relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                  className="animate-pulse"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h2 className={`text-2xl font-bold mb-2 ${
            darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
          }`}>
            🎉 Welcome to {planName}!
          </h2>

          <p className={`text-lg mb-6 ${
            darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'
          }`}>
            Your subscription has been activated successfully
          </p>

          {/* Subscription Details */}
          <div className={`p-4 rounded-lg border mb-6 ${
            darkMode
              ? 'bg-zenible-dark-bg border-zenible-dark-border'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className={`font-medium ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                }`}>
                  {planName}
                </h4>
                <p className={`text-sm ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'
                }`}>
                  {billingCycle} subscription
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                }`}>
                  ${price}
                </div>
                <div className={`text-sm ${
                  darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'
                }`}>
                  /{billingCycle === 'monthly' ? 'month' : 'year'}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className={`text-left mb-6 p-4 rounded-lg ${
            darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
          }`}>
            <h3 className={`font-medium mb-3 ${
              darkMode ? 'text-blue-400' : 'text-blue-800'
            }`}>
              ✨ What's Next?
            </h3>
            <ul className={`space-y-2 text-sm ${
              darkMode ? 'text-blue-300' : 'text-blue-700'
            }`}>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Your account has been upgraded
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All premium features are now available
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Start exploring your dashboard
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onContinue}
              className="w-full px-6 py-3 bg-zenible-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              <span>Continue to Dashboard</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            <button
              onClick={onClose}
              className={`w-full px-6 py-2 border rounded-lg font-medium transition-colors ${
                darkMode
                  ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Stay on Pricing Page
            </button>
          </div>

          {/* Auto-redirect notice */}
          <p className={`text-xs mt-4 ${
            darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
          }`}>
            Automatically redirecting to dashboard in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
}