import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { createRequest } from '../services/api/httpClient';
import MobileHeader from './layout/MobileHeader';

const request = createRequest('Support');

const COOLDOWN_SECONDS = 60;

export default function SupportPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { darkMode } = usePreferences();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      showError('Please fill in both subject and message.');
      return;
    }

    setSubmitting(true);
    try {
      await request('/support/contact', {
        method: 'POST',
        body: JSON.stringify({ subject: subject.trim(), message: message.trim() }),
      });
      showSuccess('Your message has been sent successfully. We\'ll get back to you soon.');
      setSubject('');
      setMessage('');
      setCooldown(COOLDOWN_SECONDS);
    } catch (error: any) {
      const msg = error?.message || 'Failed to send message. Please try again later.';
      showError(msg);
      // If it's a rate limit error, start cooldown
      if (error?.status === 429) {
        setCooldown(COOLDOWN_SECONDS);
      }
    } finally {
      setSubmitting(false);
    }
  }, [subject, message, showSuccess, showError]);

  const isDisabled = submitting || cooldown > 0;

  return (
    <div className={`min-h-screen-safe ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex-1 flex flex-col lg:ml-[280px]">
        <MobileHeader title="Support" />

        <div className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto p-4 lg:p-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Contact Support
              </h1>
              <p className={`mt-2 text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                Have a question or need help? Send us a message and we'll get back to you as soon as possible.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Subject */}
              <div>
                <label
                  htmlFor="support-subject"
                  className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}
                >
                  Subject
                </label>
                <input
                  id="support-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  disabled={isDisabled}
                  placeholder="Brief description of your issue"
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors
                    ${darkMode
                      ? 'bg-zenible-dark-card border-zenible-dark-border text-white placeholder-gray-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                    }
                    focus:outline-none focus:ring-1 focus:ring-purple-500
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="support-message"
                  className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}
                >
                  Message
                </label>
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={5000}
                  disabled={isDisabled}
                  rows={8}
                  placeholder="Describe your issue or question in detail..."
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors resize-y
                    ${darkMode
                      ? 'bg-zenible-dark-card border-zenible-dark-border text-white placeholder-gray-500 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                    }
                    focus:outline-none focus:ring-1 focus:ring-purple-500
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {message.length}/5000 characters
                </p>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg
                    hover:bg-purple-700 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send Message'}
                </button>

                {cooldown > 0 && (
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    You can send another message in {cooldown} seconds.
                  </span>
                )}
              </div>
            </form>

            {/* Info */}
            <div className={`mt-10 p-4 rounded-lg border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-purple-50 border-purple-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-purple-800'}`}>
                Logged in as <strong>{user?.email}</strong>. We'll reply to this email address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
