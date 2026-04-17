import React from 'react';
import { ctaCopy } from '../data/copy';
import { APP_URL } from '../../../utils/hostname';
import { useIntersectionObserver } from '../../landing/hooks/useIntersectionObserver';

export default function BICTASection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="py-20 md:py-28 bg-gray-900">
      <div
        ref={ref}
        className={`max-w-[1440px] mx-auto px-5 md:px-20 text-center transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {ctaCopy.headline}
        </h2>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">{ctaCopy.subheadline}</p>
        <a
          href={`${APP_URL}/register`}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#8e51ff] text-white font-semibold rounded-xl hover:bg-[#7a3de6] transition-colors shadow-[0_0_32px_-8px_rgba(142,81,255,0.4)]"
        >
          {ctaCopy.ctaPrimary}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
        <p className="text-gray-500 text-sm mt-4">{ctaCopy.reassurance}</p>
      </div>
    </section>
  );
}
