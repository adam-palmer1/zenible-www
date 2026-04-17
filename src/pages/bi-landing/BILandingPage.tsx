import React, { useEffect } from 'react';
import BIHeader from './components/BIHeader';
import LandingFooter from '../landing/components/LandingFooter';
import BIHeroSection from './components/BIHeroSection';
import MetricsSection from './components/MetricsSection';
import AdvisorsGallery from './components/AdvisorsGallery';
import HowItWorksSection from './components/HowItWorksSection';
import ComparisonSection from './components/ComparisonSection';
import UseCasesSection from './components/UseCasesSection';
import BIFAQSection from './components/BIFAQSection';
import BICTASection from './components/BICTASection';
import { biFaqItems } from './data/faq';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Zenible Business Intelligence',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        '8 specialized AI advisors for freelancers and agencies — trained on real-world data to help you grow your business.',
      url: 'https://www.zenible.com/business-intelligence',
    },
    {
      '@type': 'FAQPage',
      mainEntity: biFaqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
};

export default function BILandingPage() {
  useEffect(() => {
    document.title = 'Zenible Business Intelligence — AI-Powered Advisory Board';
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 font-inter">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BIHeader />
      <BIHeroSection />
      <MetricsSection />
      <AdvisorsGallery />
      <HowItWorksSection />
      <ComparisonSection />
      <UseCasesSection />
      <BIFAQSection />
      <BICTASection />
      <LandingFooter />
    </div>
  );
}
