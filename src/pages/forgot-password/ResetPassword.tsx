import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../config/api';

// Back arrow icon
const BackArrowIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Eye icons for password visibility toggle
const EyeIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeOffIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Check icon for success
const CheckIcon: React.FC = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  showToggle?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  required?: boolean;
}

// InputField Component with password visibility toggle
const InputField: React.FC<InputFieldProps> = ({
  writeInput = "Enter text",
  heading = true,
  writeHeading = "Label",
  type = "text",
  name = "",
  value = "",
  onChange = () => {},
  showToggle = false,
  isVisible = false,
  onToggleVisibility = () => {},
  required = false
}) => {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative w-full">
      {heading && (
        <div className="box-border content-stretch flex gap-[10px] items-center px-[4px] py-0 relative shrink-0 w-full">
          <div className="basis-0 font-inter font-medium grow leading-[0] min-h-px min-w-px relative shrink-0 text-[14px] text-zinc-950 dark:text-[#ededf0]">
            <p className="leading-[22px]">
              {writeHeading}
              {required && <span className="text-red-500 ml-1">*</span>}
            </p>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-[#161b26] relative rounded-[10px] shrink-0 w-full">
        <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[12px] relative w-full">
          <input
            type={showToggle ? (isVisible ? "text" : "password") : type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={writeInput}
            className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0 font-inter font-normal text-[16px] text-zinc-950 dark:text-[#ededf0] placeholder:text-zinc-400 dark:placeholder:text-[#85888e] outline-none bg-transparent w-full"
          />
          {showToggle && (
            <button
              type="button"
              onClick={onToggleVisibility}
              className="text-zinc-400 dark:text-[#85888e] hover:text-zinc-600 dark:hover:text-[#ededf0] transition-colors"
            >
              {isVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          )}
        </div>
        <div aria-hidden="true" className="absolute border-[1.5px] border-neutral-200 dark:border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
    </div>
  );
};

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setPassword } = useAuth();

  const [password, setPasswordValue] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [, setTokenValid] = useState<boolean>(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [tokenError, setTokenError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [, setIsDarkMode] = useState<boolean>(false);

  const token = searchParams.get('token');
  const isInvitation = tokenData?.type === 'invitation';
  const requiresName = tokenData?.requires_name === true;

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

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        setTokenError('No token provided. Please use the link from your email.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/validate-token?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setTokenValid(true);
          setTokenData(data);
        } else {
          setTokenError(data.detail || 'This link is invalid or has expired.');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setTokenError('Unable to validate the link. Please try again.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const validateForm = (): boolean => {
    if (requiresName && !firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await setPassword(
        token!,
        password,
        requiresName ? firstName : null,
        requiresName ? lastName : null
      );

      if (result.success) {
        setSuccess(true);
        // Auto-login successful, redirect to dashboard after brief delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        const errorMsg = typeof result.error === 'string' ? result.error : 'Failed to set password. The link may have expired.';
        setError(errorMsg);
      }
    } catch (err) {
      console.error('Set password error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as React.SyntheticEvent as React.FormEvent);
    }
  };

  // Get page title and description based on token type
  const getPageContent = () => {
    if (isInvitation) {
      return {
        title: 'Accept Invitation',
        subtitle: tokenData?.company_name ? `Join ${tokenData.company_name}` : 'Complete your account setup',
        description: 'Create a password to complete your account.',
        buttonText: 'Create Account',
        loadingText: 'Creating account...',
        successTitle: 'Account Created!',
        successMessage: ''
      };
    }
    return {
      title: 'Set New Password',
      subtitle: tokenData?.email ? `for ${tokenData.email}` : null,
      description: 'Your new password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.',
      buttonText: 'Reset Password',
      loadingText: 'Resetting...',
      successTitle: 'Password Reset Successful!',
      successMessage: ''
    };
  };

  const content = getPageContent();

  // Loading/Validating state
  if (isValidating) {
    return (
      <div className="bg-[#fafafa] dark:bg-[#0c111d] min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#161b26] relative rounded-[12px] w-full max-w-[467px]">
          <div className="flex flex-col gap-[32px] h-full p-[34px]">
            <div className="flex flex-col items-center justify-center w-full py-12">
              <div className="w-8 h-8 border-3 border-[#8e51ff] dark:border-[#a684ff] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c] text-center">
                Validating link...
              </p>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[#c4b4ff] dark:border-[#2a1e46] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
      </div>
    );
  }

  // Token invalid/expired state
  if (tokenError) {
    return (
      <div className="bg-[#fafafa] dark:bg-[#0c111d] min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#161b26] relative rounded-[12px] w-full max-w-[467px]">
          <div className="flex flex-col gap-[32px] h-full p-[34px]">
            <div className="flex flex-col items-center justify-center w-full py-8">
              <div className="text-red-500 dark:text-red-400 mb-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="font-inter font-bold text-[24px] leading-[32px] text-zinc-950 dark:text-[#ededf0] text-center mb-4">
                Link Expired or Invalid
              </h1>
              <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c] text-center mb-6">
                {tokenError}
              </p>
              <Link
                to="/forgot-password"
                className="bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center p-[12px] rounded-[12px] w-full hover:bg-[#7a3fe6] dark:hover:bg-[#9370ff] transition-colors"
              >
                <span className="font-inter font-medium text-[16px] leading-[24px] text-white">
                  Request new link
                </span>
              </Link>
              <Link
                to="/signin"
                className="mt-4 font-inter font-medium text-[14px] leading-[22px] text-[#8e51ff] dark:text-[#a684ff] hover:underline"
              >
                Back to Sign in
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[#c4b4ff] dark:border-[#2a1e46] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="bg-[#fafafa] dark:bg-[#0c111d] min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#161b26] relative rounded-[12px] w-full max-w-[467px]">
          <div className="flex flex-col gap-[32px] h-full p-[34px]">
            <div className="flex flex-col items-center justify-center w-full py-8">
              <div className="text-green-500 dark:text-green-400 mb-6">
                <CheckIcon />
              </div>
              <h1 className="font-inter font-bold text-[24px] leading-[32px] text-zinc-950 dark:text-[#ededf0] text-center mb-6">
                {content.successTitle}
              </h1>
              <Link
                to="/dashboard"
                className="bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center p-[12px] rounded-[12px] w-full hover:bg-[#7a3fe6] dark:hover:bg-[#9370ff] transition-colors"
              >
                <span className="font-inter font-medium text-[16px] leading-[24px] text-white">
                  Go to Dashboard
                </span>
              </Link>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[#c4b4ff] dark:border-[#2a1e46] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
      </div>
    );
  }

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
                  {content.title}
                </h1>
                {content.subtitle && (
                  <p className="font-inter font-medium text-[14px] leading-[22px] text-zinc-700 dark:text-[#ededf0]">
                    {content.subtitle}
                  </p>
                )}
                <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c]">
                  {content.description}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-[16px] items-start w-full">
                {/* Name fields for invitations */}
                {requiresName && (
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <InputField
                      writeHeading="First Name"
                      writeInput="First name"
                      type="text"
                      name="firstName"
                      value={firstName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFirstName(e.target.value);
                        if (error) setError('');
                      }}
                      required={true}
                    />
                    <InputField
                      writeHeading="Last Name"
                      writeInput="Last name"
                      type="text"
                      name="lastName"
                      value={lastName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLastName(e.target.value);
                        if (error) setError('');
                      }}
                    />
                  </div>
                )}

                {/* Password Input */}
                <div className="flex flex-col gap-[4px] w-full">
                  <InputField
                    writeHeading="Password"
                    writeInput="Enter your password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setPasswordValue(e.target.value);
                      if (error) setError('');
                    }}
                    showToggle={true}
                    isVisible={showPassword}
                    onToggleVisibility={() => setShowPassword(!showPassword)}
                    required={true}
                  />
                  {/* Real-time password requirements checklist */}
                  {password.length > 0 && (
                    <ul className="flex flex-col gap-[2px] mt-[4px] px-[4px]">
                      <li className={`font-inter text-[13px] leading-[20px] flex items-center gap-[6px] ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        <span className="text-[11px]">{password.length >= 8 ? '\u2713' : '\u2717'}</span>
                        Password must be at least 8 characters long
                      </li>
                      <li className={`font-inter text-[13px] leading-[20px] flex items-center gap-[6px] ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        <span className="text-[11px]">{/[A-Z]/.test(password) ? '\u2713' : '\u2717'}</span>
                        Contain at least one uppercase letter
                      </li>
                      <li className={`font-inter text-[13px] leading-[20px] flex items-center gap-[6px] ${/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        <span className="text-[11px]">{/[a-z]/.test(password) ? '\u2713' : '\u2717'}</span>
                        Contain at least one lowercase letter
                      </li>
                      <li className={`font-inter text-[13px] leading-[20px] flex items-center gap-[6px] ${/\d/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                        <span className="text-[11px]">{/\d/.test(password) ? '\u2713' : '\u2717'}</span>
                        Contain at least one number
                      </li>
                    </ul>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="flex flex-col gap-[4px] w-full">
                  <InputField
                    writeHeading="Confirm Password"
                    writeInput="Confirm your password"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    showToggle={true}
                    isVisible={showConfirmPassword}
                    onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                    required={true}
                  />
                  {/* Real-time password mismatch validation */}
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="font-inter text-[13px] leading-[20px] text-red-500 dark:text-red-400 px-[4px] mt-[4px]">
                      Passwords mismatch
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 font-inter text-center">
                      {error}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !password.trim() || !confirmPassword.trim() || (requiresName && !firstName.trim())}
                  className={`bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center p-[12px] rounded-[12px] w-full transition-colors mt-2 ${
                    isLoading || !password.trim() || !confirmPassword.trim() || (requiresName && !firstName.trim())
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-[#7a3fe6] dark:hover:bg-[#9370ff]'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-inter font-medium text-[16px] text-white">{content.loadingText}</span>
                    </div>
                  ) : (
                    <span className="font-inter font-medium text-[16px] leading-[24px] text-white">
                      {content.buttonText}
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* Card Border */}
        <div aria-hidden="true" className="absolute border border-[#c4b4ff] dark:border-[#2a1e46] border-solid inset-0 pointer-events-none rounded-[12px]" />
      </div>
    </div>
  );
}
