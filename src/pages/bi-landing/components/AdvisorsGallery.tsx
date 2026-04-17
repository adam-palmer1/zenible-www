import React from 'react';
import { usePublicCharacters } from '../hooks/usePublicCharacters';
import { useIntersectionObserver } from '../../landing/hooks/useIntersectionObserver';

export default function AdvisorsGallery() {
  const { ref, isVisible } = useIntersectionObserver();
  const { characters } = usePublicCharacters();

  return (
    <section id="advisors" className="py-20 md:py-28 bg-gray-950">
      <div
        ref={ref}
        className={`max-w-[1440px] mx-auto px-5 md:px-20 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="text-center mb-12">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#8e51ff]/10 border border-[#8e51ff]/20 text-[#8e51ff] text-xs font-medium mb-4">
            Meet Your Advisors
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {characters.length} experts, one boardroom
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Each advisor brings deep domain expertise to help you grow your business.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {characters.map((char) => {
            const gated = !char.is_accessible;
            return (
              <div
                key={char.id}
                className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 transition-colors ${
                  gated ? 'opacity-50' : 'hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {char.avatar_url ? (
                    <img
                      src={char.avatar_url}
                      alt=""
                      className={`w-10 h-10 rounded-full object-cover ${gated ? 'grayscale' : ''}`}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full bg-violet-50 border border-[#ddd6ff] flex items-center justify-center ${gated ? 'grayscale' : ''}`}>
                      <span className="text-sm font-bold text-violet-400">{char.name[0]}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-semibold text-sm">{char.name}</h3>
                  </div>
                </div>
                {char.description && (
                  <p className={`text-sm leading-relaxed ${gated ? 'text-gray-500' : 'text-gray-400'}`}>
                    {char.description}
                  </p>
                )}
                {gated && char.required_plan_name && (
                  <p className="text-xs mt-2 text-[#8e51ff] font-medium">
                    Upgrade to {char.required_plan_name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
