import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isValidInternalRedirect } from '../../utils/auth';

// Import local SVG assets
import brandIcon from './assets/brand-icon.svg';
import brandIconDark from './assets/brand-icon-dark.svg';
import googleIcon1 from './assets/google-icon-1.svg';
import googleIcon2 from './assets/google-icon-2.svg';
import googleIcon3 from './assets/google-icon-3.svg';
import googleIcon4 from './assets/google-icon-4.svg';

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

export default function SignIn() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  const { login, googleLogin, isAuthenticated, loading: authLoading, checkAuth } = useAuth();
  const navigate = useNavigate();

  // Force re-check authentication when component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Get URL search parameters
    const searchParams = new URLSearchParams(window.location.search);
    const urlError = searchParams.get('error');
    const redirectPath = searchParams.get('redirect');

    // Don't redirect while auth is still loading
    if (!authLoading && isAuthenticated) {
      const targetPath = isValidInternalRedirect(redirectPath) ? redirectPath! : '/dashboard';
      navigate(targetPath);
    }

    // Set error from URL parameters if present
    if (urlError) {
      setApiError(urlError);
      // Clean up the URL by removing the error parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl);
    }
  }, [isAuthenticated, navigate, authLoading]);

  useEffect(() => {
    // Check if dark mode is enabled
    const darkModeEnabled = document.documentElement.classList.contains('dark');
    setIsDarkMode(darkModeEnabled);

    // Listen for dark mode changes
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

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();

    // Clear previous errors
    setApiError('');
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Get redirect path from URL params
        const searchParams = new URLSearchParams(window.location.search);
        const redirectPath = searchParams.get('redirect');
        const targetPath = isValidInternalRedirect(redirectPath) ? redirectPath! : '/dashboard';
        navigate(targetPath);
      } else {
        setApiError(result.error || 'Login failed. Please try again.');
      }
    } catch (_error) {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setApiError('');
    setIsLoading(true);

    try {
      // Get redirect path from URL params
      const searchParams = new URLSearchParams(window.location.search);
      const redirectPath = searchParams.get('redirect');
      const result = await googleLogin(redirectPath ?? undefined);

      if (!result.success && result.error) {
        setApiError(result.error);
      }
      // If successful, the googleLogin function will redirect to the auth URL
    } catch (_error) {
      setApiError('Google sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSignIn(e);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c111d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8e51ff] dark:border-[#a684ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-inter font-medium text-zinc-950 dark:text-[#ededf0]">
            Loading...
          </p>
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
        <div className="flex flex-col gap-[32px] p-[34px]">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <div className="bg-[#8e51ff] dark:bg-[#a684ff] rounded-[16px] p-[4px] size-[64px] flex items-center justify-center">
              <img
                alt="Zenible"
                className="size-[38.4px]"
                src={isDarkMode ? brandIconDark : brandIcon}
              />
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-[12px] items-center text-center">
            <h1 className="font-inter font-bold text-[32px] leading-[40px] text-zinc-950 dark:text-[#ededf0]">
              Welcome Back
            </h1>
            <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c]">
              Please enter your details to log in
            </p>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-[24px] items-start w-full">
            {/* API Error */}
            {apiError && (
              <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-inter">{apiError}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="flex flex-col gap-[4px] w-full">
              <InputField
                writeHeading="Email"
                writeInput="Enter your email"
                type="email"
                name="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  if (apiError) setApiError('');
                }}
              />
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 font-inter px-1">{errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-[8px] w-full">
              <div className="flex flex-col gap-[4px] w-full">
                <InputField
                  writeHeading="Password"
                  writeInput="••••••••"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    if (apiError) setApiError('');
                  }}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400 font-inter px-1">{errors.password}</p>
                )}
              </div>
              <div className="flex items-center justify-end w-full">
                <Link
                  to="/forgot-password"
                  className="font-inter font-semibold text-[14px] leading-[22px] text-[#8e51ff] dark:text-[#a684ff] hover:underline"
                >
                  Forgot password
                </Link>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className={`bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center p-[12px] rounded-[12px] w-full transition-colors ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-[#7a3fe6] dark:hover:bg-[#9370ff]'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-inter font-medium text-[16px] text-white">Signing in...</span>
                </div>
              ) : (
                <span className="font-inter font-medium text-[16px] leading-[24px] text-white">
                  Sign in
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="flex gap-[6px] items-center w-full">
              <div className="bg-neutral-200 dark:bg-[#1f242f] h-px flex-1" />
              <span className="font-inter font-normal text-[14px] text-zinc-400 dark:text-[#85888e]">
                Or with Sign In
              </span>
              <div className="bg-neutral-200 dark:bg-[#1f242f] h-px flex-1" />
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`relative rounded-[12px] w-full transition-colors ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1f242f]'
              }`}
            >
              <div className="flex gap-[8px] items-center justify-center p-[12px] w-full">
                <div className="overflow-clip relative shrink-0 size-[24px]">
                  <div className="absolute inset-[40.99%_0.97%_12.07%_51%]">
                    <img alt="" className="block max-w-none size-full" src={googleIcon1} />
                  </div>
                  <div className="absolute bottom-0 left-[6.32%] right-[15.86%] top-[59.59%]">
                    <img alt="" className="block max-w-none size-full" src={googleIcon2} />
                  </div>
                  <div className="absolute inset-[27.56%_77.07%_27.54%_1%]">
                    <img alt="" className="block max-w-none size-full" src={googleIcon3} />
                  </div>
                  <div className="absolute bottom-[59.56%] left-[6.32%] right-[15.54%] top-0">
                    <img alt="" className="block max-w-none size-full" src={googleIcon4} />
                  </div>
                </div>
                <span className="font-inter font-medium text-[16px] leading-[24px] text-zinc-950 dark:text-[#ededf0]">
                  Sign in with Google
                </span>
              </div>
              <div aria-hidden="true" className="absolute border border-neutral-200 dark:border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[12px]" />
            </button>

            {/* Sign Up Link */}
            <div className="flex gap-[4px] items-center justify-center w-full">
              <span className="font-inter font-normal text-[14px] leading-[22px] text-zinc-500 dark:text-[#85888e]">
                Don't have an account?
              </span>
              <Link
                to="/register"
                className="font-inter font-semibold text-[14px] leading-[22px] text-[#8e51ff] dark:text-[#a684ff] hover:underline"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
        {/* Card Border */}
        <div aria-hidden="true" className="absolute border border-[#c4b4ff] dark:border-[#2a1e46] border-solid inset-0 pointer-events-none rounded-[12px]" />
      </div>
    </div>
  );
}
