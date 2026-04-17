import React from 'react';
import { comparisonCopy } from '../data/copy';
import { useIntersectionObserver } from '../../landing/hooks/useIntersectionObserver';

export default function ComparisonSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="py-20 md:py-28 bg-gray-950">
      <div
        ref={ref}
        className={`max-w-[1440px] mx-auto px-5 md:px-20 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {comparisonCopy.headline}
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            {comparisonCopy.subheadline}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Old way */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6">
            <h3 className="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-4">
              {comparisonCopy.oldWay.title}
            </h3>
            <ul className="space-y-3">
              {comparisonCopy.oldWay.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* New way */}
          <div className="bg-[#8e51ff]/[0.05] border border-[#8e51ff]/20 rounded-3xl p-6">
            <h3 className="text-[#8e51ff] font-semibold text-xs uppercase tracking-wider mb-4">
              {comparisonCopy.newWay.title}
            </h3>
            <ul className="space-y-3">
              {comparisonCopy.newWay.items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-200">
                  <svg className="w-4 h-4 text-[#8e51ff] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
