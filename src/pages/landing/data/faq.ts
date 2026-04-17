export interface FAQItem {
  question: string;
  answer: string;
}

export const faqItems: FAQItem[] = [
  {
    question: 'Is Zenible really free?',
    answer:
      'Yes! Zenible offers a free forever plan that includes core CRM features, basic invoicing, and access to AI advisors with usage limits. Paid plans unlock advanced features like meeting intelligence, unlimited AI usage, and priority support.',
  },
  {
    question: 'Who is Zenible built for?',
    answer:
      'Zenible is built for freelancers, consultants, coaches, agencies, and service providers who want to manage their entire business from one platform instead of juggling multiple tools.',
  },
  {
    question: 'How are the AI advisors different from ChatGPT?',
    answer:
      "Zenible's AI advisors are specialized experts — each trained on real-world data for specific tasks. Kim is trained on 40,000+ viral LinkedIn posts, Mike on hundreds of hours of interviews with million-dollar freelancers, and so on. They understand your business context and give tailored advice, not generic responses.",
  },
  {
    question: 'Can I migrate my data from other tools?',
    answer:
      'Yes. Zenible supports CSV imports for contacts, invoices, and expenses. If you need help migrating from a specific tool, our support team can assist you with the transition.',
  },
  {
    question: 'How does the meeting intelligence work?',
    answer:
      "Zenible's AI bot automatically joins your scheduled video calls, records the conversation, generates a summary with key insights, and creates follow-up action items. It works with Zoom and any meeting link in your calendar.",
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. Zenible uses industry-standard encryption, secure cloud infrastructure on AWS, and strict access controls. Your data is always yours — we never sell or share it with third parties.',
  },
  {
    question: 'What payment methods are supported?',
    answer:
      'Your clients can pay invoices via Stripe (credit/debit cards) and PayPal. Zenible supports multiple currencies, so you can invoice global clients in their preferred currency.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      "Yes, you can cancel anytime with no penalties. Your data remains accessible, and you can always downgrade to the free plan if you'd like to keep using Zenible's core features.",
  },
];
