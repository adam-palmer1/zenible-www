import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

function isValidInternalRedirect(path: string | null): boolean {
  if (!path) return false;
  // Must start with / but not // (protocol-relative URL)
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  // Must not contain protocol
  try {
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent double execution in StrictMode
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const state = searchParams.get('state'); // Get redirect path from state parameter

      if (error) {
        logger.error('Google OAuth error:', error);
        const redirectParam = state ? `&redirect=${encodeURIComponent(state)}` : '';
        navigate(`/signin?error=Google authentication was cancelled or failed${redirectParam}`);
        return;
      }

      if (!code) {
        logger.error('No authorization code received');
        const redirectParam = state ? `&redirect=${encodeURIComponent(state)}` : '';
        navigate(`/signin?error=No authorization code received from Google${redirectParam}`);
        return;
      }

      try {
        const result = await handleGoogleCallback(code);

        if (result.success) {
          // Small delay to ensure state is updated before navigation
          setTimeout(() => {
            const targetPath = isValidInternalRedirect(state) ? state! : '/dashboard';
            navigate(targetPath);
          }, 100);
        } else {
          logger.error('Google callback failed:', result.error);
          const redirectParam = state ? `&redirect=${encodeURIComponent(state)}` : '';
          navigate(`/signin?error=${encodeURIComponent(result.error || 'Google authentication failed')}${redirectParam}`);
        }
      } catch (error) {
        logger.error('Google callback error:', error);
        const redirectParam = state ? `&redirect=${encodeURIComponent(state)}` : '';
        navigate(`/signin?error=Google authentication failed. Please try again.${redirectParam}`);
      }
    };

    handleCallback();
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0c111d] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#8e51ff] dark:border-[#a684ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg font-inter font-medium text-zinc-950 dark:text-[#ededf0]">
          Completing Google sign in...
        </p>
        <p className="text-sm font-inter text-zinc-500 dark:text-[#85888e] mt-2">
          Please wait while we process your authentication.
        </p>
      </div>
    </div>
  );
}
