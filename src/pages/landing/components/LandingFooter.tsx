import React from 'react';
import { zenibleDark } from '../../../assets/logos';
import { footerCopy } from '../data/copy';
import { APP_URL } from '../../../utils/hostname';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'AI Advisors', href: '#ai-advisors' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

export default function LandingFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto px-5 md:px-20 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 md:gap-8">
          {/* Brand */}
          <div>
            <img src={zenibleDark} alt="Zenible" className="h-7 mb-4" />
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              {footerCopy.tagline}
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">{heading}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-400 text-center md:text-left">
          {footerCopy.copyright}
        </div>
      </div>
    </footer>
  );
}
