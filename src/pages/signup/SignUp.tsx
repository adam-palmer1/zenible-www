import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Import assets from signin (reuse)
import brandIcon from '../signin/assets/brand-icon.svg';
import brandIconDark from '../signin/assets/brand-icon-dark.svg';
import googleIcon1 from '../signin/assets/google-icon-1.svg';
import googleIcon2 from '../signin/assets/google-icon-2.svg';
import googleIcon3 from '../signin/assets/google-icon-3.svg';
import googleIcon4 from '../signin/assets/google-icon-4.svg';

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

interface CheckboxProps {
  checked?: boolean;
  onChange?: () => void;
}

// Checkbox Component
const Checkbox: React.FC<CheckboxProps> = ({ checked = false, onChange = () => {} }) => {
  return (
    <div className="overflow-clip relative rounded-[4px] size-[16px] cursor-pointer" onClick={onChange}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div aria-hidden="true" className="absolute border border-neutral-200 dark:border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[4px]" />
      {checked && (
        <div className="absolute inset-0 bg-[#8e51ff] dark:bg-[#a684ff] rounded-[4px] flex items-center justify-center">
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
    </div>
  );
};

export default function SignUp() {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string>('');

  const { signup, googleLogin, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, authLoading]);

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

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      newErrors.password = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setApiError('');
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup(email, password, firstName, lastName);

      if (result.success) {
        // Navigate to email verification page
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setApiError(result.error || 'Sign up failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setApiError('');
    setIsLoading(true);

    try {
      const result = await googleLogin();
      if (!result.success && result.error) {
        setApiError(result.error);
      }
    } catch (_error) {
      setApiError('Google sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSignUp(e);
    }
  };

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c111d] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#8e51ff] dark:border-[#a684ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-inter font-medium text-zinc-950 dark:text-[#ededf0]">Loading...</p>
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
        <div className="p-5 sm:p-[34px]">
          <div className="flex flex-col gap-[40px] items-center">
            {/* Logo */}
            <div className="flex items-center justify-center py-[2px] size-[92px]">
              <div className="opacity-[0.92] overflow-clip relative rounded-[24px] size-[92px]"
                   style={{ backgroundImage: 'linear-gradient(180deg, rgba(245, 243, 255, 1) 6%, rgba(221, 214, 255, 1) 97%)' }}>
                <div className="absolute bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-[4px] rounded-[16px] size-[64px]">
                  <img alt="Zenible" className="size-[48px]" src={isDarkMode ? brandIconDark : brandIcon} />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="flex flex-col gap-[24px] items-center w-full">
              <div className="flex flex-col gap-[12px] items-center text-center w-full max-w-[336px]">
                <h1 className="font-inter font-bold text-2xl sm:text-[32px] leading-tight sm:leading-[40px] text-zinc-950 dark:text-[#ededf0]">
                  Create your account
                </h1>
                <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c]">
                  Please enter your details for create account.
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

                {/* Form Fields */}
                <div className="flex flex-col gap-[16px] w-full">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col gap-[4px]">
                      <InputField
                        writeHeading="First Name"
                        writeInput="First name"
                        type="text"
                        name="firstName"
                        value={firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFirstName(e.target.value);
                          if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
                          if (apiError) setApiError('');
                        }}
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600 dark:text-red-400 font-inter px-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-[4px]">
                      <InputField
                        writeHeading="Last Name"
                        writeInput="Last name"
                        type="text"
                        name="lastName"
                        value={lastName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setLastName(e.target.value);
                          if (apiError) setApiError('');
                        }}
                      />
                    </div>
                  </div>

                  {/* Email Field */}
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

                  {/* Password Field */}
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

                    {/* Remember Checkbox */}
                    <div className="flex items-center gap-[8px] w-full">
                      <Checkbox
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                      />
                      <span className="font-inter font-normal text-[14px] leading-[22px] text-zinc-500 dark:text-[#94969c]">
                        Remember for 30 days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-[16px] w-full">
                  {/* Sign Up Button */}
                  <button
                    onClick={handleSignUp}
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
                        <span className="font-inter font-medium text-[16px] text-white">Creating account...</span>
                      </div>
                    ) : (
                      <span className="font-inter font-medium text-[16px] leading-[24px] text-white">Sign up</span>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-[6px] w-full">
                    <div className="bg-neutral-200 dark:bg-[#1f242f] h-px flex-1" />
                    <span className="font-inter font-normal text-[14px] leading-[22px] text-zinc-400 dark:text-[#85888e]">
                      Or with Sign up
                    </span>
                    <div className="bg-neutral-200 dark:bg-[#1f242f] h-px flex-1" />
                  </div>

                  {/* Google Button */}
                  <button
                    onClick={handleGoogleSignUp}
                    disabled={isLoading}
                    className={`relative rounded-[12px] w-full transition-colors ${
                      isLoading
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1f242f]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-[8px] p-[12px] w-full">
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
                </div>

                {/* Sign In Link */}
                <div className="flex items-center justify-center gap-[4px] w-full">
                  <span className="font-inter font-normal text-[14px] leading-[22px] text-zinc-500 dark:text-[#85888e]">
                    Already have an account?
                  </span>
                  <Link
                    to="/signin"
                    className="font-inter font-semibold text-[14px] leading-[22px] text-[#8e51ff] dark:text-[#a684ff] hover:underline"
                  >
                    Sign in
                  </Link>
                </div>
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
