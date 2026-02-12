import { useState, useEffect } from 'react';
import brandIcon from '../../pages/signin/assets/brand-icon.svg';
import brandIconDark from '../../pages/signin/assets/brand-icon-dark.svg';

interface NetworkErrorOverlayProps {
  onTryAgain?: () => void;
}

export default function NetworkErrorOverlay({ onTryAgain }: NetworkErrorOverlayProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const handleTryAgain = () => {
    setIsRetrying(true);
    if (onTryAgain) {
      onTryAgain();
    } else {
      window.location.reload();
    }
    // Reset after a brief delay in case we're still offline
    setTimeout(() => setIsRetrying(false), 2000);
  };

  return (
    <div className={`fixed inset-0 z-[10001] flex flex-col items-center justify-center px-6 ${
      isDarkMode ? 'bg-[#0c111d]' : 'bg-[#fafafa]'
    }`}>
      {/* Logo */}
      <div className="mb-8">
        <div className={`${isDarkMode ? 'bg-[#a684ff]' : 'bg-[#8e51ff]'} rounded-[16px] p-[4px] size-[64px] flex items-center justify-center`}>
          <img
            alt="Zenible"
            className="size-[38.4px]"
            src={isDarkMode ? brandIconDark : brandIcon}
          />
        </div>
      </div>

      {/* Wifi-off icon */}
      <div className="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`size-16 ${isDarkMode ? 'text-[#94969c]' : 'text-zinc-400'}`}
        >
          {/* Wifi arcs */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0" />
          {/* Center dot */}
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0z" />
          {/* Slash line */}
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className={`font-inter font-bold text-2xl mb-3 ${
        isDarkMode ? 'text-[#ededf0]' : 'text-zinc-950'
      }`}>
        No internet connection
      </h1>

      {/* Body text */}
      <p className={`font-inter text-base text-center max-w-sm mb-8 ${
        isDarkMode ? 'text-[#94969c]' : 'text-zinc-500'
      }`}>
        Please check your network connection and try again.
      </p>

      {/* Try Again button */}
      <button
        onClick={handleTryAgain}
        disabled={isRetrying}
        className={`font-inter font-medium text-base px-8 py-3 rounded-lg text-white transition-colors ${
          isRetrying
            ? 'bg-[#8e51ff]/60 cursor-not-allowed'
            : 'bg-[#8e51ff] hover:bg-[#7a3ef0] active:bg-[#6b31d9]'
        }`}
      >
        {isRetrying ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Retrying…
          </span>
        ) : (
          'Try Again'
        )}
      </button>
    </div>
  );
}
