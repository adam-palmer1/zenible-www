import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { createRequest } from '../services/api/httpClient';
import AppLayout from './layout/AppLayout';

const request = createRequest('Support');

const COOLDOWN_SECONDS = 600; // 10 minutes
const STORAGE_KEY = 'support_last_sent';

function getRemainingCooldown(): number {
  const lastSent = localStorage.getItem(STORAGE_KEY);
  if (!lastSent) return 0;
  const elapsed = Math.floor((Date.now() - Number(lastSent)) / 1000);
  return Math.max(0, COOLDOWN_SECONDS - elapsed);
}

export default function SupportPage() {
  const { user } = useAuth();
  const { showError } = useNotification();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const initialRemaining = getRemainingCooldown();
  const [cooldown, setCooldown] = useState(initialRemaining);
  const [sent, setSent] = useState(false);
  const [returnVisit] = useState(initialRemaining > 0);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) {
      if (sent) setSent(false);
      return;
    }
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
  }, [cooldown, sent]);

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
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setCooldown(COOLDOWN_SECONDS);
      setSent(true);
    } catch (error: any) {
      const msg = error?.message || 'Failed to send message. Please try again later.';
      showError(msg);
      if (error?.status === 429) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        setCooldown(COOLDOWN_SECONDS);
        setSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  }, [subject, message, showError]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isDisabled = submitting || cooldown > 0;

  return (
    <AppLayout pageTitle="Support">
      <div className="max-w-2xl mx-auto p-4 lg:p-6">
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 lg:p-8 dark:bg-zenible-dark-card dark:border-zenible-dark-border">
          {sent ? (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-900 dark:text-white">
                Thank you. Your message has been sent. We will be in touch as soon as possible.
              </p>
            </div>
          ) : returnVisit && cooldown > 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-900 dark:text-white">
                You can send another message in {formatTime(cooldown)}
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Contact Support
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Have a question or need help? Send us a message and we'll get back to you as soon as possible.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Subject */}
                <div>
                  <label
                    htmlFor="support-subject"
                    className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300"
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
                    className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors
                      bg-white border-gray-300 text-gray-900 placeholder-gray-400
                      dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500
                      focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="support-message"
                    className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300"
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
                    className="w-full px-4 py-2.5 rounded-lg border text-sm transition-colors resize-y
                      bg-white border-gray-300 text-gray-900 placeholder-gray-400
                      dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-500
                      focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
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
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>

              {/* Info */}
              <div className="mt-10 p-4 rounded-lg border bg-purple-50 border-purple-100 dark:bg-gray-800 dark:border-gray-700">
                <p className="text-sm text-purple-800 dark:text-gray-300">
                  Logged in as <strong>{user?.email}</strong>. We'll reply to this email address.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
