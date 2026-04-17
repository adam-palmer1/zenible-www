import React, { useEffect } from 'react';
import LandingHeader from './components/LandingHeader';
import HeroSection from './components/HeroSection';
import TestimonialsSection from './components/TestimonialsSection';
import ProblemSection from './components/ProblemSection';
import AIAdvisorsSection from './components/AIAdvisorsSection';
import WorkspaceSection from './components/WorkspaceSection';
import FeatureDeepDive from './components/FeatureDeepDive';
import PricingSection from './components/PricingSection';
import FAQSection from './components/FAQSection';
import CTASection from './components/CTASection';
import LandingFooter from './components/LandingFooter';
import { faqItems } from './data/faq';

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Zenible',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'AI-powered business platform combining CRM, invoicing, meetings, and growth tools for freelancers and agencies.',
      url: 'https://www.zenible.com',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '3240',
        bestRating: '5',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: 'Free forever plan available',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
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

export default function LandingPage() {
  useEffect(() => {
    document.title = 'Zenible — AI-Powered Business Platform for Freelancers';
  }, []);

  return (
    <div className="min-h-screen bg-white font-inter">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingHeader />
      <HeroSection />
      <TestimonialsSection />
      <ProblemSection />
      <AIAdvisorsSection />
      <WorkspaceSection />
      <FeatureDeepDive />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
