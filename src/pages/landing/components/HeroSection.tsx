import React from 'react';
import { heroCopy } from '../data/copy';
import { APP_URL } from '../../../utils/hostname';
import { useTypewriter } from '../hooks/useTypewriter';
import LazyImage from './LazyImage';

const heroHooks = [
  'Stop juggling 5 tools to run your freelance business',
  'Win more clients and grow your freelance business',
  'Manage everything in one freelance business platform',
  'AI-powered tools built for your freelance business',
];

export default function HeroSection() {
  const { text } = useTypewriter({
    phrases: heroHooks,
    typingSpeed: 60,
    deletingSpeed: 35,
    pauseAfterType: 3000,
    pauseAfterDelete: 400,
  });

  return (
    <section className="pt-[72px] bg-white overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 md:px-20 pt-16 md:pt-24 pb-12">
        {/* Text content */}
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.15] h-[2.3em] overflow-hidden">
            {(() => {
              // Find where "freelance business" starts in the current phrase
              const currentPhrase = heroHooks.find((h) => h.startsWith(text) || text.startsWith(h.slice(0, text.length))) || heroHooks[0];
              const highlightStart = currentPhrase.indexOf('freelance business');
              if (highlightStart === -1 || text.length <= highlightStart) {
                // Haven't reached the highlight portion yet
                return <><span>{text}</span><span className="inline-block w-[3px] h-[1em] bg-[#8e51ff] ml-1 align-middle animate-pulse" /></>;
              }
              return (
                <>
                  <span>{text.slice(0, highlightStart)}</span>
                  <span className="text-[#8e51ff]">{text.slice(highlightStart)}</span>
                  <span className="inline-block w-[3px] h-[1em] bg-[#8e51ff] ml-1 align-middle animate-pulse" />
                </>
              );
            })()}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {heroCopy.subheadline}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href={`${APP_URL}/register`}
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-[#8e51ff] rounded-xl hover:bg-[#7a3de6] transition-colors shadow-lg shadow-purple-200"
            >
              {heroCopy.ctaPrimary}
            </a>
            <button
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              disabled
              title="Coming soon"
            >
              {heroCopy.ctaSecondary}
            </button>
          </div>
        </div>

        {/* Social proof bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <LazyImage
                key={i}
                src={`/landing/avatars/avatar-${i}.png`}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Stars */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {heroCopy.rating} based on {heroCopy.reviewCount} reviews
            </span>
          </div>
        </div>

        {/* Hero image - dashboard collage from Figma */}
        <div className="mt-14 relative">
          <div className="relative mx-auto max-w-5xl">
            {/* Main dashboard screenshot */}
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/10 border border-purple-100/60">
              <LazyImage
                src="/landing/hero/dashboard-main.png"
                alt="Zenible dashboard showing projects, invoices, and AI tools"
                width={1280}
                height={770}
                className="w-full h-auto"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            {/* Floating cards */}
            <div className="hidden lg:block absolute -left-16 top-8 w-48 rounded-xl overflow-hidden shadow-xl shadow-purple-900/10 border border-purple-100/60">
              <LazyImage
                src="/landing/hero/crm-sidebar.png"
                alt="CRM sidebar"
                width={278}
                height={112}
                className="w-full h-auto"
              />
            </div>
            <div className="hidden lg:block absolute -left-12 bottom-20 w-56 rounded-xl overflow-hidden shadow-xl shadow-purple-900/10 border border-purple-100/60">
              <LazyImage
                src="/landing/hero/invoiced.png"
                alt="Total invoiced amount"
                width={277}
                height={165}
                className="w-full h-auto"
              />
            </div>
            <div className="hidden lg:block absolute -left-8 top-1/3 w-44 rounded-xl overflow-hidden shadow-xl shadow-purple-900/10 border border-purple-100/60">
              <LazyImage
                src="/landing/hero/crm-contacts.png"
                alt="CRM contacts view"
                width={251}
                height={260}
                className="w-full h-auto"
              />
            </div>
            <div className="hidden lg:block absolute -right-8 top-12 w-40 rounded-xl overflow-hidden shadow-xl shadow-purple-900/10 border border-purple-100/60">
              <LazyImage
                src="/landing/hero/dashboard-sidebar.png"
                alt="Dashboard widgets"
                width={225}
                height={271}
                className="w-full h-auto"
              />
            </div>
            <div className="hidden lg:block absolute -right-4 bottom-8 w-52 rounded-xl overflow-hidden shadow-xl shadow-purple-900/10 border border-purple-100/60">
              <LazyImage
                src="/landing/hero/calendar.png"
                alt="Calendar view"
                width={274}
                height={299}
                className="w-full h-auto"
              />
            </div>

            {/* Decorative gradient blur */}
            <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-purple-100/40 via-transparent to-purple-100/40 rounded-3xl blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
