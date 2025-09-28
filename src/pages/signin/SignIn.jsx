import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Import all local SVG assets
import downArrowIcon from './assets/down-arrow.svg';
import eyeIcon from './assets/eye-icon.svg';
import arrowPrevIcon from './assets/arrow-prev.svg';
import arrowNextIcon from './assets/arrow-next.svg';
import brandIcon from './assets/brand-icon.svg';
import brandIconDark from './assets/brand-icon-dark.svg';
import googleIcon1 from './assets/google-icon-1.svg';
import googleIcon2 from './assets/google-icon-2.svg';
import googleIcon3 from './assets/google-icon-3.svg';
import googleIcon4 from './assets/google-icon-4.svg';
import starBg from './assets/star-bg.svg';
import star from './assets/star.svg';
import starDark from './assets/star-dark.svg';
import arrowLeft from './assets/arrow-left.svg';
import arrowLeftDark from './assets/arrow-left-dark.svg';
import arrowRight from './assets/arrow-right.svg';
import arrowRightDark from './assets/arrow-right-dark.svg';
import testimonialBg from './assets/testimonial-bg.png';
import testimonialBgDark from './assets/testimonial-bg-dark.png';

// InputField Component
const InputField = ({
  writeCounterValue = "00/100",
  writeHelpingMessage = "Helping message",
  writeInput = "User name",
  rhsIcon = true,
  lhsIcon = true,
  helpingMessageCounter = true,
  input = true,
  writingMessage = true,
  counter = true,
  lhs = null,
  rhs = null,
  heading = true,
  writeHeading = "Heading Text",
  state = "Active",
  size = "Small",
  type = "text",
  name = "",
  value = "",
  onChange = () => {}
}) => {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative size-full">
      {heading && (
        <div className="box-border content-stretch flex gap-[10px] items-center px-[4px] py-0 relative shrink-0 w-full">
          <div className="basis-0 font-inter font-medium grow leading-[0] min-h-px min-w-px relative shrink-0 text-[14px] text-zinc-950 dark:text-[#ededf0]">
            <p className="leading-[22px]">{writeHeading}</p>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-[#161b26] relative rounded-[10px] shrink-0 w-full">
        <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[12px] relative w-full">
          {lhsIcon &&
            (lhs || (
              <div className="relative shrink-0 size-[16.667px]">
                <div className="absolute inset-[39.98%_27.08%]">
                  <div className="absolute inset-[-15.59%_-6.82%]">
                    <img alt="" className="block max-w-none size-full" src={downArrowIcon} />
                  </div>
                </div>
              </div>
            ))}
          {input && (
            <input
              type={type}
              name={name}
              value={value}
              onChange={onChange}
              placeholder={writeInput}
              className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0 font-inter font-normal text-[16px] text-zinc-950 dark:text-[#ededf0] placeholder:text-zinc-400 dark:placeholder:text-[#85888e] outline-none bg-transparent"
            />
          )}
          {rhsIcon &&
            (rhs || (
              <div className="relative shrink-0 size-[16.667px]">
                <div className="absolute inset-[39.98%_27.08%]">
                  <div className="absolute inset-[-15.59%_-6.82%]">
                    <img alt="" className="block max-w-none size-full" src={eyeIcon} />
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div aria-hidden="true" className="absolute border-[1.5px] border-neutral-200 dark:border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[10px]" />
      </div>
      {helpingMessageCounter && (
        <div className="box-border content-stretch flex font-inter font-normal items-center justify-between leading-[0] px-[4px] py-0 relative shrink-0 text-[12px] text-nowrap text-zinc-500 dark:text-[#85888e] w-full">
          {writingMessage && (
            <div className="relative shrink-0">
              <p className="leading-[20px] text-nowrap whitespace-pre">{writeHelpingMessage}</p>
            </div>
          )}
          {counter && (
            <div className="relative shrink-0">
              <p className="leading-[20px] text-nowrap whitespace-pre">{writeCounterValue}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Checkbox Component
const Checkbox = ({ state = "OFF", size = "Small", checked = false, onChange = () => {} }) => {
  return (
    <div className="overflow-clip relative rounded-[4px] size-full">
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

// Button Component
const Button = ({
  rhsIcon = null,
  lhsIcon = null,
  showLhsIcon = true,
  showText = true,
  writeText = "Button Text",
  showRhsIcon = true,
  type = "Primary",
  size = "Large",
  onClick = () => {},
  className = ""
}) => {
  return (
    <div
      onClick={onClick}
      className={`box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative rounded-[12px] size-full cursor-pointer ${className}`}
    >
      {showLhsIcon &&
        (lhsIcon || (
          <div className="relative shrink-0 size-[24px]">
            <div className="absolute flex inset-[27.08%_39.98%] items-center justify-center">
              <div className="flex-none h-[4.811px] rotate-[90deg] w-[11px]">
                <div className="relative size-full">
                  <div className="absolute inset-[-15.59%_-6.82%]">
                    <img alt="" className="block max-w-none size-full" src={arrowPrevIcon} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      {showText && (
        <div className="font-inter font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-white">
          <p className="leading-[24px] whitespace-pre">{writeText}</p>
        </div>
      )}
      {showRhsIcon &&
        (rhsIcon || (
          <div className="relative shrink-0 size-[24px]">
            <div className="absolute flex inset-[27.08%_39.98%] items-center justify-center">
              <div className="flex-none h-[4.811px] rotate-[270deg] w-[11px]">
                <div className="relative size-full">
                  <div className="absolute inset-[-15.59%_-6.82%]">
                    <img alt="" className="block max-w-none size-full" src={arrowNextIcon} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

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
      const targetPath = redirectPath || '/dashboard';
      navigate(targetPath);
    }

    // Set error from URL parameters if present
    if (urlError) {
      setApiError(urlError);
      // Clean up the URL by removing the error parameter
      const newUrl = new URL(window.location);
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
  const validateForm = () => {
    const newErrors = {};

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

  const handleSignIn = async (e) => {
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
        const targetPath = redirectPath || '/dashboard';
        navigate(targetPath);
      } else {
        setApiError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
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
      const result = await googleLogin(redirectPath);

      if (!result.success && result.error) {
        setApiError(result.error);
      }
      // If successful, the googleLogin function will redirect to the auth URL
    } catch (error) {
      setApiError('Google sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSignIn(e);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0c111d] flex items-center justify-center">
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
    <div className="bg-neutral-50 dark:bg-[#0c111d] content-stretch flex items-start relative size-full min-h-screen"
         onKeyPress={handleKeyPress}>
      <div className="basis-0 bg-neutral-50 dark:bg-[#0c111d] box-border content-stretch flex gap-[8px] grow h-full items-center justify-center min-h-px min-w-px overflow-clip p-[6px] relative rounded-[12px] shrink-0">
        <div className="relative rounded-[12px] shrink-0">
          <div className="box-border content-stretch flex gap-[8px] items-center overflow-clip p-[34px] relative">
            <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0 w-[399px]">
              <div className="box-border content-stretch flex items-center justify-center px-0 py-[2px] relative shrink-0 size-[92px]">
                <div className="opacity-[0.92] overflow-clip relative rounded-[24px] shrink-0 size-[92px]">
                  <div className="absolute bg-[#8e51ff] dark:bg-[#a684ff] box-border content-stretch flex gap-[16px] items-center justify-center left-1/2 p-[4px] rounded-[16px] size-[64px] top-1/2 translate-x-[-50%] translate-y-[-50%]">
                    <div className="relative shrink-0 size-[38.4px]">
                      <img alt="" className="block max-w-none size-full" src={isDarkMode ? brandIconDark : brandIcon} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
                <div className="content-stretch flex flex-col gap-[12px] items-start leading-[0] relative shrink-0 text-center w-[336px]">
                  <div className="flex flex-col font-inter font-bold justify-end relative shrink-0 text-[32px] text-zinc-950 dark:text-[#ededf0] w-full">
                    <p className="leading-[40px]">Welcome Back</p>
                  </div>
                  <div className="font-inter font-normal relative shrink-0 text-[16px] text-zinc-500 dark:text-[#94969c] w-full">
                    <p className="leading-[24px]">Please enter your details to log in</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
                  {apiError && (
                    <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400 font-inter">{apiError}</p>
                    </div>
                  )}
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                      <InputField
                        lhsIcon={false}
                        writeHeading="Email"
                        writeInput="Enter your email"
                        rhsIcon={false}
                        helpingMessageCounter={false}
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                          if (apiError) setApiError('');
                        }}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 dark:text-red-400 font-inter px-1">{errors.email}</p>
                      )}
                    </div>
                    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                      <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                        <InputField
                          lhsIcon={false}
                          writeHeading="Password"
                          writeInput="••••••••"
                          rhsIcon={false}
                          helpingMessageCounter={false}
                          type="password"
                          name="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                            if (apiError) setApiError('');
                          }}
                        />
                        {errors.password && (
                          <p className="text-sm text-red-600 dark:text-red-400 font-inter px-1">{errors.password}</p>
                        )}
                      </div>
                      <div className="content-stretch flex items-center justify-end relative shrink-0 w-full">
                        <Link to="/forgot-password" className="font-inter font-semibold leading-[0] relative shrink-0 text-[#8e51ff] dark:text-[#a684ff] text-[14px] text-nowrap hover:underline">
                          <p className="leading-[22px] whitespace-pre">Forgot password</p>
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[399px]">
                    <button
                      onClick={handleSignIn}
                      disabled={isLoading}
                      className={`bg-[#8e51ff] dark:bg-[#a684ff] box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative rounded-[12px] shrink-0 w-full transition-colors ${
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
                        <Button writeText="Sign in" showLhsIcon={false} showRhsIcon={false} />
                      )}
                    </button>
                    <div className="content-stretch flex gap-[6px] items-center relative shrink-0 w-full">
                      <div className="bg-neutral-200 dark:bg-[#1f242f] h-px shrink-0 w-[150px]" />
                      <div className="font-inter font-normal leading-[0] relative shrink-0 text-[14px] text-nowrap text-zinc-400 dark:text-[#85888e]">
                        <p className="leading-[22px] whitespace-pre">Or with Sign In</p>
                      </div>
                      <div className="bg-neutral-200 dark:bg-[#1f242f] h-px shrink-0 w-[150px]" />
                    </div>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className={`relative rounded-[12px] shrink-0 w-full transition-colors ${
                        isLoading
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1f242f]'
                      }`}
                    >
                      <div className="box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative w-full">
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
                        <div className="font-inter font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-zinc-950 dark:text-[#ededf0]">
                          <p className="leading-[24px] whitespace-pre">Sign in with Google</p>
                        </div>
                      </div>
                      <div aria-hidden="true" className="absolute border border-neutral-200 dark:border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[12px]" />
                    </button>
                  </div>
                  <div className="content-stretch flex gap-[4px] items-baseline justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap w-full">
                    <div className="font-inter font-normal relative shrink-0 text-zinc-500 dark:text-[#85888e]">
                      <p className="leading-[22px] text-nowrap whitespace-pre">Don't have an account?</p>
                    </div>
                    <Link to="/register" className="font-inter font-semibold relative shrink-0 text-[#8e51ff] dark:text-[#a684ff] hover:underline">
                      <p className="leading-[22px] text-nowrap whitespace-pre">Sign up</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border border-[#ddd6ff] dark:border-[#2a1e46] border-solid inset-0 pointer-events-none rounded-[12px]" />
        </div>
      </div>
      <div className="box-border content-stretch flex h-[960px] items-start min-w-[640px] pl-0 pr-[16px] py-[16px] relative shrink-0 w-[720px]">
        <div
          className="basis-0 bg-center bg-cover bg-no-repeat grow h-full min-h-px min-w-px overflow-clip relative rounded-[24px] shrink-0"
          style={{ backgroundImage: `url('${isDarkMode ? testimonialBgDark : testimonialBg}')` }}
        >
          <div className="absolute bg-gradient-to-b bottom-0 box-border content-stretch flex flex-col from-[rgba(0,0,0,0)] items-center justify-center left-0 pb-0 pt-[96px] px-0 right-0 to-[rgba(0,0,0,0.4)]">
            <div className="backdrop-blur-md backdrop-filter bg-[rgba(255,255,255,0.4)] dark:bg-[rgba(255,255,255,0.4)] box-border content-stretch flex flex-col gap-[32px] items-start p-[32px] relative shrink-0 w-full">
              <div aria-hidden="true" className="absolute border-[1px_0px_0px] border-[rgba(255,255,255,0.2)] dark:border-[rgba(255,255,255,0.2)] border-solid inset-0 pointer-events-none" />
              <div className="font-inter font-semibold leading-[0] relative shrink-0 text-[32px] text-white w-full">
                <p className="leading-[40px] whitespace-pre-wrap">{`"Untitled has saved us thousands of hours of work. We're able to spin up projects  faster and take on more clients."`}</p>
              </div>
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
                  <div className="basis-0 font-inter font-semibold grow leading-[0] min-h-px min-w-px relative shrink-0 text-[38px] text-white">
                    <p className="leading-[46px]">Maya Thompson</p>
                  </div>
                  <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="overflow-clip relative shrink-0 size-[20px]">
                        <div className="absolute bottom-[-2.5%] left-0 right-0 top-[2.5%]">
                          <img alt="" className="block max-w-none size-full" src={starBg} />
                        </div>
                        <div className="absolute left-0 size-[20px] top-0">
                          <img alt="" className="block max-w-none size-full" src={isDarkMode ? starDark : star} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex flex-col gap-[4px] grow items-start leading-[0] min-h-px min-w-px relative shrink-0 text-white">
                    <div className="font-inter font-semibold relative shrink-0 text-[18px] w-full">
                      <p className="leading-[26px]">Project Manager, Timekeeper Solutions</p>
                    </div>
                    <div className="font-inter font-normal relative shrink-0 text-[16px] w-full">
                      <p className="leading-[24px]">Digital Creative Studio</p>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[32px] items-start relative shrink-0">
                    <div className="content-stretch flex gap-[12px] items-center justify-center relative rounded-[99999px] shrink-0 size-[56px] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[99999px]" />
                      <div className="relative shrink-0 size-[24px]">
                        <img alt="" className="block max-w-none size-full" src={isDarkMode ? arrowLeftDark : arrowLeft} />
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[12px] items-center justify-center relative rounded-[99999px] shrink-0 size-[56px] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                      <div aria-hidden="true" className="absolute border border-solid border-white inset-0 pointer-events-none rounded-[99999px]" />
                      <div className="relative shrink-0 size-[24px]">
                        <img alt="" className="block max-w-none size-full" src={isDarkMode ? arrowRightDark : arrowRight} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}