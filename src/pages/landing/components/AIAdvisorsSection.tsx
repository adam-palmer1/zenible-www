import React, { useRef, useState } from 'react';
import { advisorsCopy } from '../data/copy';
import { useAICharacters } from '../hooks/useAICharacters';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import LazyImage from './LazyImage';

const roleLabels: Record<string, string> = {
  kim: 'Content & Growth',
  lyn: 'Profile & Positioning',
  mike: 'Freelancing Strategy',
  mark: 'Sales & Closing',
  meeting_intelligence_analyst: 'Meeting Intelligence',
  adam: 'Business Strategy',
  emma: 'Mindset & Resilience',
  sarah: 'Operations & Growth',
};

const credibilityLines: Record<string, string> = {
  kim: 'Trained on 40,000+ viral LinkedIn posts',
  lyn: 'Trained on hundreds of top freelancer profiles',
  mike: 'Trained on 100s of hours of expert interviews',
  mark: 'Specialized in closing high-value deals',
  meeting_intelligence_analyst: 'Auto-joins calls and captures insights',
  adam: '20+ years of service-business expertise',
  emma: 'Helps you build unshakeable confidence',
  sarah: 'Streamlines your business operations',
};

const portraitImages: Record<string, string> = {
  kim: '/landing/characters/kim.png',
  mike: '/landing/characters/mike.png',
  lyn: '/landing/characters/lyn.png',
  mark: '/landing/characters/mark.png',
  meeting_intelligence_analyst: '/landing/characters/jim.png',
  adam: '/landing/characters/adam.png',
  emma: '/landing/characters/emma.png',
  sarah: '/landing/characters/sarah.png',
};


export default function AIAdvisorsSection() {
  const { characters, loading } = useAICharacters();
  const { ref, isVisible } = useIntersectionObserver();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  function updateScrollButtons() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 300;
    el.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 350);
  }

  return (
    <section id="ai-advisors" className="py-20 md:py-28 bg-white">
      <div
        ref={ref}
        className={`max-w-[1440px] mx-auto transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-14 px-5 md:px-20">
          <span className="inline-block px-4 py-1.5 bg-purple-50 text-[#8e51ff] text-sm font-semibold rounded-full mb-4">
            {advisorsCopy.badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Meet your{' '}
            <span className="text-[#8e51ff]">AI-powered advisory board</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            {advisorsCopy.description}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              aria-label="Scroll left"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center bg-white rounded-full shadow-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              aria-label="Scroll right"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-white to-transparent z-[5]" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-white to-transparent z-[5]" />

          {/* Cards track */}
          {loading ? (
            <div className="flex gap-6 px-5 md:px-20 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[280px] h-[380px] bg-gray-50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div
              ref={scrollRef}
              onScroll={updateScrollButtons}
              className="flex gap-6 px-8 md:px-24 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {characters.map((char) => {
                const imgSrc = portraitImages[char.internal_name] || char.avatar_url;

                return (
                  <div
                    key={char.id}
                    className="flex-shrink-0 w-[280px] snap-start bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-purple-100 transition-all group"
                  >
                    {/* Character image */}
                    <div className="relative h-52 bg-gradient-to-b from-purple-50 via-purple-50/30 to-white overflow-hidden flex items-center justify-center">
                      {imgSrc ? (
                        <LazyImage
                          src={imgSrc}
                          alt={char.name}
                          width={160}
                          height={160}
                          className="w-40 h-40 rounded-2xl object-cover shadow-md ring-4 ring-white group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-purple-200 to-purple-400 flex items-center justify-center text-5xl font-bold text-white shadow-md">
                          {char.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Card content */}
                    <div className="p-5">
                      {/* Name + role */}
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{char.name}</h3>
                        </div>
                        <span className="text-xs font-semibold text-[#8e51ff]">
                          {roleLabels[char.internal_name] || 'AI Advisor'}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">
                        {char.description}
                      </p>

                      {/* Credibility line */}
                      {credibilityLines[char.internal_name] && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{credibilityLines[char.internal_name]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
