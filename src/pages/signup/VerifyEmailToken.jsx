import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import OTPInput from './components/OTPInput';

// Back arrow icon
const BackArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function VerifyEmailToken() {
  const [searchParams] = useSearchParams();
  const urlEmail = searchParams.get('email') || '';
  const urlCode = searchParams.get('code') || '';

  const navigate = useNavigate();
  const { setTokens } = useAuth();

  const [email, setEmail] = useState(urlEmail);
  const [code, setCode] = useState(urlCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Auto-verify if both email and code are in URL
  useEffect(() => {
    if (urlEmail && urlCode) {
      setIsAutoVerifying(true);
      verifyEmail(urlEmail, urlCode);
    }
  }, []);

  // Auto-submit when code is complete (manual entry)
  useEffect(() => {
    if (code.length === 6 && email && !isAutoVerifying && !urlCode) {
      verifyEmail(email, code);
    }
  }, [code]);

  const verifyEmail = async (emailToVerify, codeToVerify) => {
    if (!emailToVerify || !codeToVerify || codeToVerify.length !== 6) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToVerify, code: codeToVerify })
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens - user is now logged in
        if (data.access_token && data.refresh_token) {
          setTokens(data.access_token, data.refresh_token);
        }
        navigate('/dashboard');
      } else {
        // Handle error
        let errorMessage = 'Verification failed. Please try again.';
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          const err = data.detail[0];
          errorMessage = err.msg || errorMessage;
        } else if (data.message) {
          errorMessage = data.message;
        }
        setError(errorMessage);
        if (urlCode) {
          setCode(''); // Clear code so user can re-enter manually
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setIsAutoVerifying(false);
    }
  };

  const handleVerify = () => {
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    if (code.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    verifyEmail(email, code);
  };

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setIsResending(true);
    setError('');
    setResendSuccess(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        const data = await response.json();
        let errorMessage = 'Failed to resend verification email.';
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        }
        setError(errorMessage);
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Show loading state for auto-verification
  if (isAutoVerifying && isLoading) {
    return (
      <div className="bg-[#fafafa] dark:bg-[#0c111d] min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#161b26] relative rounded-[12px] w-full max-w-[467px]">
          <div className="flex flex-col gap-[32px] p-[34px]">
            <div className="flex flex-col gap-[24px] items-center justify-center py-[40px]">
              <div className="w-16 h-16 border-4 border-[#8e51ff] dark:border-[#a684ff] border-t-transparent rounded-full animate-spin"></div>
              <div className="flex flex-col gap-[12px] items-center text-center">
                <h1 className="font-inter font-bold text-[32px] leading-[40px] text-zinc-950 dark:text-[#ededf0]">
                  Verifying...
                </h1>
                <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c]">
                  Please wait while we verify your email.
                </p>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[#c4b4ff] dark:border-[#2a1e46] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fafafa] dark:bg-[#0c111d] min-h-screen flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="bg-white dark:bg-[#161b26] relative rounded-[12px] w-full max-w-[467px]">
        <div className="flex flex-col gap-[32px] p-[34px]">
          {/* Back Button */}
          <div className="flex flex-col items-start">
            <Link
              to="/register"
              className="flex items-center gap-[8px] px-[12px] py-[10px] rounded-[10px] text-zinc-950 dark:text-[#ededf0] hover:bg-gray-100 dark:hover:bg-[#1f242f] transition-colors"
            >
              <BackArrowIcon />
              <span className="font-inter font-medium text-[16px] leading-[24px]">
                Back to Sign up
              </span>
            </Link>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-[24px] items-center w-full">
            {/* Header */}
            <div className="flex flex-col gap-[12px] items-center text-center w-[336px]">
              <h1 className="font-inter font-bold text-[32px] leading-[40px] text-zinc-950 dark:text-[#ededf0]">
                Verify your email
              </h1>
              <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c]">
                Enter the 6-digit code sent to your email.
              </p>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-[24px] items-center w-full">
              {/* Email Input (if not from URL) */}
              {!urlEmail && (
                <div className="flex flex-col gap-[4px] w-full">
                  <div className="px-[4px]">
                    <label className="font-inter font-medium text-[14px] leading-[22px] text-zinc-950 dark:text-[#ededf0]">
                      Email
                    </label>
                  </div>
                  <div className="bg-white dark:bg-[#161b26] relative rounded-[10px] w-full">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter your email"
                      className="w-full px-[16px] py-[12px] font-inter font-normal text-[16px] text-zinc-950 dark:text-[#ededf0] placeholder:text-zinc-400 dark:placeholder:text-[#85888e] outline-none bg-transparent"
                    />
                    <div aria-hidden="true" className="absolute border-[1.5px] border-neutral-200 dark:border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[10px]" />
                  </div>
                </div>
              )}

              {/* Show email if from URL */}
              {urlEmail && (
                <p className="font-inter font-normal text-[14px] leading-[22px] text-zinc-500 dark:text-[#94969c]">
                  Verifying: <span className="font-medium">{urlEmail}</span>
                </p>
              )}

              {/* OTP Input */}
              <div className="flex flex-col items-center justify-center w-full">
                <OTPInput
                  value={code}
                  onChange={(newCode) => {
                    setCode(newCode);
                    if (error) setError('');
                  }}
                  length={6}
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-inter text-center">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {resendSuccess && (
                <div className="w-full p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400 font-inter text-center">
                    Verification code sent! Check your email.
                  </p>
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6 || !email}
                className={`bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center p-[12px] rounded-[12px] w-full transition-colors ${
                  isLoading || code.length !== 6 || !email
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-[#7a3fe6] dark:hover:bg-[#9370ff]'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-inter font-medium text-[16px] text-white">Verifying...</span>
                  </div>
                ) : (
                  <span className="font-inter font-medium text-[16px] leading-[24px] text-white">
                    Verify email
                  </span>
                )}
              </button>

              {/* Resend Link */}
              <div className="flex items-center justify-center gap-[4px] w-full">
                <span className="font-inter font-normal text-[14px] leading-[22px] text-zinc-500 dark:text-[#85888e]">
                  Didn't receive the code?
                </span>
                <button
                  onClick={handleResend}
                  disabled={isResending || !email}
                  className={`font-inter font-semibold text-[14px] leading-[22px] text-[#8e51ff] dark:text-[#a684ff] hover:underline ${
                    isResending || !email ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isResending ? 'Sending...' : 'Resend'}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Card Border */}
        <div aria-hidden="true" className="absolute border border-[#c4b4ff] dark:border-[#2a1e46] border-solid inset-0 pointer-events-none rounded-[12px]" />
      </div>
    </div>
  );
}
