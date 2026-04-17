import React, { useState, useEffect } from 'react';
import { zenibleLight } from '../../../assets/logos';
import { APP_URL } from '../../../utils/hostname';

const navLinks = [
  { label: 'Advisors', href: '#advisors' },
  { label: 'FAQ', href: '#faq' },
];

export default function BIHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-gray-950/95 backdrop-blur-sm shadow-sm' : 'bg-gray-950'
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-5 md:px-20 h-[72px]">
        <a href="/" className="flex items-center">
          <img src={zenibleLight} alt="Zenible" className="h-7" />
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href={`${APP_URL}/signin`}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Login
          </a>
          <a
            href={`${APP_URL}/register`}
            className="px-5 py-2.5 text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7a3de6] transition-colors"
          >
            Sign Up
          </a>
        </div>

        <button
          className="md:hidden p-2 text-gray-300"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 px-5 pb-6">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="py-3 text-base font-medium text-gray-300 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-3 mt-4">
            <a
              href={`${APP_URL}/register`}
              className="w-full py-3 text-center text-sm font-medium text-white bg-[#8e51ff] rounded-lg hover:bg-[#7a3de6] transition-colors"
            >
              Start Free
            </a>
            <a
              href={`${APP_URL}/signin`}
              className="w-full py-3 text-center text-sm font-medium text-gray-300 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Login
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
