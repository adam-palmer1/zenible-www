import React from 'react';
import { crmFeatures, meetingsFeatures, financeFeatures } from '../data/features';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { APP_URL } from '../../../utils/hostname';
import type { FeatureBlock } from '../data/features';

function FeatureBlockSection({ block }: { block: FeatureBlock }) {
  const { ref, isVisible } = useIntersectionObserver();

  const badgeColors: Record<string, string> = {
    crm: 'bg-blue-50 text-blue-700',
    meetings: 'bg-green-50 text-green-700',
    finance: 'bg-red-50 text-red-700',
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Block header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3 ${badgeColors[block.id] || 'bg-gray-50 text-gray-700'}`}>
            {block.badge}
          </span>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
            {block.headline}
          </h3>
          <p className="mt-3 text-gray-600 max-w-xl">{block.description}</p>
        </div>
        <a
          href={`${APP_URL}/register`}
          className="hidden md:inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          {block.ctaText}
        </a>
      </div>

      {/* Items grid */}
      <div className={`grid grid-cols-1 ${block.items.length <= 4 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-5`}>
        {block.items.map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
          >
            <h4 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Section screenshot */}
      {block.image && (
        <div className="mt-8 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
          <img
            src={block.image}
            alt={`${block.badge} screenshot`}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      )}

      {/* Mobile CTA */}
      <a
        href={`${APP_URL}/register`}
        className="md:hidden mt-6 inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
      >
        {block.ctaText}
      </a>
    </div>
  );
}

export default function FeatureDeepDive() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-[1440px] mx-auto px-5 md:px-20 space-y-24">
        <FeatureBlockSection block={crmFeatures} />
        <FeatureBlockSection block={meetingsFeatures} />
        <FeatureBlockSection block={financeFeatures} />
      </div>
    </section>
  );
}
