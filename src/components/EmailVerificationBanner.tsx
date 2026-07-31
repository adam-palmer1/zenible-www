import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.email_verified) return null;

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (response.ok) {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      } else {
        const data = await response.json().catch(() => ({}));
        const retryAfter = data.retry_after ? ` Please try again in ${data.retry_after} seconds.` : '';
        setError((data.detail || 'Failed to resend verification email.') + retryAfter);
        setTimeout(() => setError(null), 8000);
      }
    } catch {
      setError('Failed to resend verification email. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex-shrink-0">
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-amber-800">
            {resent ? (
              <span className="font-medium">Verification email sent! Check your inbox.</span>
            ) : (
              <>
                Please verify your email address. Check your inbox for a verification link.
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="ml-2 font-medium text-amber-900 underline hover:no-underline disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend'}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
