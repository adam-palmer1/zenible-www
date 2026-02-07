import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emailVerifiedIcon from './assets/email-verified-icon.svg';

// Back arrow icon
const BackArrowIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function EmailConfirmed() {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/signin');
  };

  return (
    <div className="bg-[#fafafa] dark:bg-[#0c111d] min-h-screen flex items-center justify-center p-4">
      {/* Card Container */}
      <div className="bg-white dark:bg-[#161b26] relative rounded-[12px] w-full max-w-[467px]">
        <div className="flex flex-col gap-[32px] h-full p-[34px]">
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

          {/* Content - Centered */}
          <div className="flex-1 flex flex-col gap-[40px] items-center justify-center">
            {/* Icon */}
            <div className="overflow-clip relative size-[80px]">
              <img
                src={emailVerifiedIcon}
                alt="Email verified"
                className="size-full"
              />
            </div>

            {/* Text & Button */}
            <div className="flex flex-col gap-[24px] items-center w-full">
              {/* Header */}
              <div className="flex-1 flex flex-col gap-[12px] items-center text-center w-full">
                <h1 className="font-inter font-bold text-[32px] leading-[40px] text-zinc-950 dark:text-[#ededf0]">
                  Email verified
                </h1>
                <p className="font-inter font-normal text-[16px] leading-[24px] text-zinc-500 dark:text-[#94969c]">
                  Your password has been successfully reset. Click below to log in magically.
                </p>
              </div>

              {/* Continue Button */}
              <div className="flex flex-col items-center w-full">
                <button
                  onClick={handleContinue}
                  className="bg-[#8e51ff] dark:bg-[#a684ff] flex items-center justify-center p-[12px] rounded-[12px] w-full cursor-pointer hover:bg-[#7a3fe6] dark:hover:bg-[#9370ff] transition-colors"
                >
                  <span className="font-inter font-medium text-[16px] leading-[24px] text-white">
                    Continue
                  </span>
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
