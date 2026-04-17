import React, { useState } from 'react';
import { workspaceCopy } from '../data/copy';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const tabIcons: Record<string, React.ReactNode> = {
  crm: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  meetings: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  finance: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
};

const tabImages: Record<string, string> = {
  crm: '/landing/sections/crm-contacts.png',
  meetings: '/landing/sections/meeting-intelligence.png',
  finance: '/landing/sections/finance-invoices.png',
};

export default function WorkspaceSection() {
  const [activeTab, setActiveTab] = useState('crm');
  const { ref, isVisible } = useIntersectionObserver();

  const activeTabData = workspaceCopy.tabs.find((t) => t.id === activeTab)!;

  return (
    <section className="py-20 md:py-28 bg-gray-50">
      <div
        ref={ref}
        className={`max-w-[1440px] mx-auto px-5 md:px-20 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 bg-purple-50 text-[#8e51ff] text-sm font-semibold rounded-full mb-4">
            {workspaceCopy.badge}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Run your entire business from{' '}
            <span className="text-[#8e51ff]">one workspace</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            {workspaceCopy.description}
          </p>
        </div>

        {/* Content area */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Tab sidebar */}
          <div className="flex lg:flex-col gap-2">
            {workspaceCopy.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-white shadow-md border border-gray-100 text-gray-900'
                    : 'text-gray-500 hover:bg-white/60 hover:text-gray-700'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-[#8e51ff]' : ''}>
                  {tabIcons[tab.id]}
                </span>
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {activeTabData.title}
            </h3>
            <p className="text-gray-600 mb-6">{activeTabData.description}</p>
            <ul className="space-y-3">
              {activeTabData.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#8e51ff] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Screenshot */}
            <div className="mt-8 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
              <img
                src={tabImages[activeTab]}
                alt={`${activeTabData.label} screenshot`}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
