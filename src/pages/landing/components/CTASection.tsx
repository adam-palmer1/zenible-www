import React from 'react';
import { ctaCopy } from '../data/copy';
import { APP_URL } from '../../../utils/hostname';

export default function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-[#8e51ff]">
      <div className="max-w-[1440px] mx-auto px-5 md:px-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            {ctaCopy.headline}
          </h2>
          <p className="mt-5 text-lg text-purple-100 leading-relaxed max-w-xl mx-auto">
            {ctaCopy.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <a
              href={`${APP_URL}/register`}
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-[#8e51ff] bg-white rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
            >
              {ctaCopy.ctaPrimary}
            </a>
            <button
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors"
              disabled
              title="Coming soon"
            >
              {ctaCopy.ctaSecondary}
            </button>
          </div>
          <p className="mt-6 text-sm text-purple-200">{ctaCopy.reassurance}</p>
        </div>
      </div>
    </section>
  );
}
