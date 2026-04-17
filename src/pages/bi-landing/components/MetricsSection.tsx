import React from 'react';
import { metricsCopy } from '../data/copy';
import { useIntersectionObserver } from '../../landing/hooks/useIntersectionObserver';

export default function MetricsSection() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section className="py-16 bg-gray-900">
      <div
        ref={ref}
        className={`max-w-[1440px] mx-auto px-5 md:px-20 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {metricsCopy.items.map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{item.value}</div>
              <div className="text-sm text-gray-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
