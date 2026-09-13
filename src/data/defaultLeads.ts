import { Lead } from '../types';

export const DEFAULT_LEADS: Lead[] = [
  {
    id: 'lead-1',
    email: 'sarah.jenkins@hyperflow.io',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    company: 'HyperFlow Software',
    jobTitle: 'VP of Product Growth',
    industry: 'Cloud B2B SaaS',
    city: 'San Francisco',
    customIcebreaker: 'Loved your keynote on developer velocity at SaaStr last month!',
    painPoint: 'reducing trial churn',
    status: 'pending',
    currentStep: 0,
    notes: 'Series B workflow platform, 120 employees'
  },
  {
    id: 'lead-2',
    email: 'marcus.v@novatech-ai.com',
    firstName: 'Marcus',
    lastName: 'Vance',
    company: 'NovaTech AI',
    jobTitle: 'Head of Outbound Marketing',
    industry: 'Enterprise AI & Automation',
    city: 'Austin',
    customIcebreaker: 'Saw NovaTech’s recent Product Hunt launch reached top 3 of the day—huge congrats!',
    painPoint: 'sales pipeline capacity',
    status: 'pending',
    currentStep: 0,
    notes: 'Raised seed round last quarter'
  },
  {
    id: 'lead-3',
    email: 'elena.rostova@crestlinehealth.org',
    firstName: 'Elena',
    lastName: 'Rostova',
    company: 'Crestline Health',
    jobTitle: 'Director of Business Development',
    industry: 'HealthTech & Telehealth',
    city: 'Boston',
    customIcebreaker: 'Noticed your team expanding your clinical analytics division on LinkedIn.',
    painPoint: 'long enterprise sales cycles',
    status: 'pending',
    currentStep: 0,
    notes: 'HIPAA compliant B2B provider'
  },
  {
    id: 'lead-4',
    email: 'david.chen@finscale.co',
    firstName: 'David',
    lastName: 'Chen',
    company: 'FinScale Payments',
    jobTitle: 'Chief Revenue Officer',
    industry: 'Fintech & Embedded Banking',
    city: 'New York',
    customIcebreaker: 'Read your recent op-ed on real-time settlement rails—very sharp perspective.',
    painPoint: 'scaling SDR ramp time',
    status: 'pending',
    currentStep: 0,
    notes: 'Growth stage, high outbound volume'
  },
  {
    id: 'lead-5',
    email: 'amara.okafor@stridecommerce.com',
    firstName: 'Amara',
    lastName: 'Okafor',
    company: 'Stride Commerce',
    jobTitle: 'Founder & CEO',
    industry: 'E-commerce Infrastructure',
    city: 'Chicago',
    customIcebreaker: 'Big fan of your latest case study with direct-to-consumer athletic brands.',
    painPoint: 'inbox deliverability hurdles',
    status: 'pending',
    currentStep: 0,
    notes: 'Bootstrapped to $4M ARR'
  }
];
