export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  rating: number;
  avatar: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'Zenible helped me organize my entire freelance workflow. From managing clients to sending invoices, everything is finally in one place.',
    name: 'Alex Carter',
    role: 'Freelance Product Designer',
    rating: 4.5,
    avatar: '/landing/avatars/alex.png',
  },
  {
    quote:
      'The AI tools are incredibly helpful. The proposal assistant alone saves me hours every week when responding to client requests.',
    name: 'Maria Lopez',
    role: 'Marketing Consultant',
    rating: 5.0,
    avatar: '/landing/avatars/maria.png',
  },
  {
    quote:
      'I love how easy it is to track projects and invoices. Zenible keeps my business organized without feeling complicated.',
    name: 'Emma Thompson',
    role: 'Freelance Copywriter',
    rating: 4.5,
    avatar: '/landing/avatars/emma.png',
  },
  {
    quote:
      'Our agency replaced multiple tools with Zenible. Now we manage clients, meetings, and finances from one simple dashboard.',
    name: 'Daniel Wright',
    role: 'Founder, BrightStudio',
    rating: 4.0,
    avatar: '/landing/avatars/alex.png',
  },
  {
    quote:
      'The meeting intelligence feature is a game-changer. I can focus on the conversation knowing every insight is captured automatically.',
    name: 'Sarah Kim',
    role: 'Business Coach',
    rating: 5.0,
    avatar: '/landing/avatars/maria.png',
  },
  {
    quote:
      'Zenible\'s CRM is exactly what I needed. Simple, intuitive, and designed for how freelancers actually work.',
    name: 'James Okafor',
    role: 'Freelance Developer',
    rating: 4.5,
    avatar: '/landing/avatars/emma.png',
  },
];
