import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Back arrow icon
const BackArrowIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface InputFieldProps {
  writeInput?: string;
  heading?: boolean;
  writeHeading?: string;
  type?: string;
  name?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

// InputField Component
const InputField: React.FC<InputFieldProps> = ({
  writeInput = "Enter text",
  heading = true,
  writeHeading = "Label",
  type = "text",
  name = "",
  value = "",
  onChange = () => {}
}) => {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative w-full">
      {heading && (
        <div className="box-border content-stretch flex gap-[10px] items-center px-[4px] py-0 relative shrink-0 w-full">
          <div className="basis-0 font-inter font-medium grow leading-[0] min-h-px min-w-px relative shrink-0 text-[14px] text-zinc-950 dark:text-[#ededf0]">
            <p className="leading-[22px]">{writeHeading}</p>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-[#161b26] relative rounded-[10px] shrink-0 w-full">
        <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[12px] relative w-full">
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={writeInput}
            className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0 font-inter font-normal text-[16px] text-zinc-950 dark:text-[#ededf0] placeholder:text-zinc-400 dark:placeholder:text-[#85888e] outline-none bg-transparent w-full"
          />
        </div>
        <div aria-hidden="true" className="absolute border-[1.5px] border-neutral-200 dark:border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
    </div>
  );
};

export default function ForgotPassword() {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const { forgotPassword } = useAuth() as any;

  // Dark mode detection
  useEffect(() => {
    const darkModeEnabled = document.documentElement.classList.contains('dark');
    setIsDarkMode(darkModeEnabled);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const darkModeEnabled = document.documentElement.classList.contains('dark');
          setIsDarkMode(darkModeEnabled);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setIsResending(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        // Show brief confirmation
        setSuccess(true);
      } else {
        setError(result.error || 'Failed to resend email. Please try again.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <div
      className="bg-[#fafafa] dark:bg-[#0c111d] min-h-screen flex items-center justify-center p-4"
      onKeyPress={handleKeyPress}
    >
      {/* Card Container */}
      <div className="bg-white dark:bg-[#161b26] relative rounded-[12px] w-full max-w-[467px]">
        <div className="flex flex-col gap-[32px] h-full p-[34px]">
          {/* Back Button */}
          <div className="flex flex-col items-start">
            <Link
              to="/signin"
              className="flex items-center gap-[8px] px-[12px] py-[10px] rounded-[10px] text-zinc-950 dark:text-[#ededf0] hover:bg-gray-100 dark:hover:bg-[#1f242f] transition-colors"
            >
              <BackArrowIcon />
              <span className="font-inter font-medium text-[16px] leading-[24px]">
                Back to Sign in
              </span>
            </Link>
          </div>

          {/* Content */}
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col gap-[24px] items-center w-full">
              {/* Header */}
              <div className="flex flex-col gap-[12px] items-center text-center w-[336px]">
                <h1 className="font-inter font-bold text-[32px] leading-[40px] text-zinc-950 dark:text-[#ededf0]">
                  Forgot password?
                </h1>
                <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c]">
                  No worries, we'll send you reset instructions.
                </p>
              </div>

              {/* Form */}
              <div className="flex flex-col gap-[24px] items-start w-full">
                {/* Email Input */}
                <div className="flex flex-col items-start w-full">
                  <div className="flex flex-col gap-[4px] w-full">
                    <InputField
                      writeHeading="Email"
                      writeInput="Enter your email"
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                        if (success) setSuccess(false);
                      }}
                    />
                    {error && (
                      <p className="text-sm text-red-600 dark:text-red-400 font-inter px-1">{error}</p>
                    )}
                  </div>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="w-full p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400 font-inter text-center">
                      If an account matches the email address provided, you will receive instructions to reset your password shortly.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !email.trim()}
                  className={`bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center p-[12px] rounded-[12px] w-full transition-colors ${
                    isLoading || !email.trim()
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-[#7a3fe6] dark:hover:bg-[#9370ff]'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-inter font-medium text-[16px] text-white">Sending...</span>
                    </div>
                  ) : (
                    <span className="font-inter font-medium text-[16px] leading-[24px] text-white">
                      Check email
                    </span>
                  )}
                </button>
              </div>

              {/* Resend Link */}
              <div className="flex items-center justify-center gap-[4px] w-full">
                <span className="font-inter font-normal text-[14px] leading-[22px] text-zinc-500 dark:text-[#85888e]">
                  Didn't receive the email?
                </span>
                <button
                  onClick={handleResend}
                  disabled={isResending || !email.trim()}
                  className={`font-inter font-semibold text-[14px] leading-[22px] text-[#8e51ff] dark:text-[#a684ff] hover:underline ${
                    isResending || !email.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
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
