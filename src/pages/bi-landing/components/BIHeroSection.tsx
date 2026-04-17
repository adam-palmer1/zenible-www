import React from 'react';
import { heroCopy } from '../data/copy';
import PublicChat from './PublicChat';
import { useIntersectionObserver } from '../../landing/hooks/useIntersectionObserver';

export default function BIHeroSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="pt-[72px] bg-gray-950 overflow-hidden">
      <div
        ref={ref}
        className={`max-w-[1440px] mx-auto px-5 md:px-20 pt-8 md:pt-12 pb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Headline */}
        <div className="max-w-3xl mx-auto text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
            {heroCopy.headline}{' '}
            <span className="text-[#8e51ff]">{heroCopy.headlineHighlight}</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {heroCopy.subheadline}
          </p>
        </div>

        {/* Public Chat */}
        <PublicChat />

        {/* Trust line */}
        <p className="text-center text-sm text-gray-500 mt-4">{heroCopy.trustLine}</p>
      </div>
    </section>
  );
}
