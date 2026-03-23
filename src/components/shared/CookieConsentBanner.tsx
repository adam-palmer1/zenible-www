import React, { useState } from 'react';
import { useCookieConsent } from '../../hooks/useCookieConsent';

export default function CookieConsentBanner() {
  const { consent, setConsent } = useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [hiding, setHiding] = useState(false);

  // Already consented — render nothing
  if (consent) return null;

  const hide = (prefs: { accepted: boolean; analytics: boolean; marketing: boolean }) => {
    setHiding(true);
    // Allow fade-out to finish before removing from DOM
    setTimeout(() => setConsent(prefs), 300);
  };

  const handleAcceptAll = () => {
    hide({ accepted: true, analytics: true, marketing: true });
  };

  const handleSavePreferences = () => {
    hide({ accepted: true, analytics, marketing });
  };

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-50 p-4 transition-opacity duration-300 ${
        hiding ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-5">
        {/* Main banner content */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-950 dark:text-white">Cookie Preferences</p>
            <p className="text-sm text-zinc-500 dark:text-gray-400 mt-1">
              We use cookies to enhance your experience. Essential cookies are required for the site to function.
              You can customize your preferences for optional cookies.{' '}
              <a href="/privacy" className="text-[#8e51ff] hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-zinc-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Manage Preferences
            </button>
            <button
              onClick={handleAcceptAll}
              className="bg-[#8e51ff] px-4 py-2.5 rounded-lg hover:bg-[#7b3ff0] transition-colors text-sm font-medium text-white"
            >
              Accept All
            </button>
          </div>
        </div>

        {/* Expandable preferences section */}
        {showPreferences && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Essential — always on */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-950 dark:text-white">Essential</p>
                <p className="text-xs text-zinc-500 dark:text-gray-400">
                  Required for authentication and core site functionality.
                </p>
              </div>
              <div className="relative">
                <div className="w-10 h-6 bg-[#8e51ff] rounded-full opacity-60 cursor-not-allowed">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-950 dark:text-white">Analytics</p>
                <p className="text-xs text-zinc-500 dark:text-gray-400">
                  Help us understand how you use the site so we can improve it.
                </p>
              </div>
              <button
                onClick={() => setAnalytics(!analytics)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  analytics ? 'bg-[#8e51ff]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    analytics ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-950 dark:text-white">Marketing</p>
                <p className="text-xs text-zinc-500 dark:text-gray-400">
                  Allow personalized content and relevant promotions.
                </p>
              </div>
              <button
                onClick={() => setMarketing(!marketing)}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  marketing ? 'bg-[#8e51ff]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    marketing ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSavePreferences}
                className="bg-[#8e51ff] px-4 py-2 rounded-lg hover:bg-[#7b3ff0] transition-colors text-sm font-medium text-white"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
