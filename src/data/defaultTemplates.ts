import { CampaignTemplate } from '../types';

export const DEFAULT_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'saas_growth',
    title: 'B2B SaaS / Product Pitch (4 Steps)',
    category: 'b2b_saas',
    description: 'High-converting sequence for software products featuring personalized icebreakers and painless CTAs.',
    steps: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: '{Quick question for {{company}}|Thoughts on scaling {{company}}?}',
        body: `{Hi|Hey} {{firstName}},\n\n{{customIcebreaker|I noticed what you're building at {{company}} and was impressed by your recent growth.}}\n\nWe recently helped a similar team in the {{industry|tech}} space reduce their pipeline conversion dropoff by 34% without hiring additional reps.\n\nAre you open to a 3-minute glance at how we did it next Tuesday?`
      },
      {
        stepNumber: 2,
        delayDays: 3,
        subject: 'Re: {Quick question for {{company}}|Thoughts on scaling {{company}}?}',
        body: `{{firstName}},\n\nWanted to float this to the top of your inbox in case it got buried.\n\nHere is a 30-second breakdown of how we solved this for teams like {{company}}:\n• Automated data extraction cut prep time by 70%\n• Personalized sequencing doubled outbound replies\n\nWould it make sense to connect for 5 mins this week, or is {{painPoint|outreach efficiency}} not a priority right now?`
      },
      {
        stepNumber: 3,
        delayDays: 4,
        subject: 'Re: {Quick question for {{company}}|Thoughts on scaling {{company}}?}',
        body: `Hey {{firstName}},\n\nAssuming you're swamped with priorities this quarter.\n\nI put together a quick 2-page teardown on how {{company}} could optimize outbound reply rates. Happy to send the PDF over directly if you're curious—no call required.\n\nShould I send it your way?`
      },
      {
        stepNumber: 4,
        delayDays: 5,
        subject: 'Permission to close file? ({{company}})',
        body: `Hi {{firstName}},\n\nSince I haven't heard back, I'm assuming timing isn't right or {{company}} already has this fully dialed in.\n\nI'll stop bugging you. If things change down the road or you ever want to revisit, you know where to find me.\n\nWishing you and {{company}} continued momentum!`
      }
    ]
  },
  {
    id: 'agency_services',
    title: 'Design & Dev Agency Outreach (3 Steps)',
    category: 'agency_services',
    description: 'Direct, craft-focused outreach for engineering or creative studios pitching high-impact deliverables.',
    steps: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: 'Idea for {{company}}\'s user onboarding',
        body: `{Hi|Hello} {{firstName}},\n\n{{customIcebreaker|Loved your team's recent release at {{company}}.}}\n\nWhile exploring your product flow, I spotted 2 quick UX adjustments on the signup page that could bump trial activation significantly.\n\nMind if I send over a 90-second Loom showing the walkthrough?`
      },
      {
        stepNumber: 2,
        delayDays: 3,
        subject: 'Re: Idea for {{company}}\'s user onboarding',
        body: `Hey {{firstName}},\n\nChecking in on the Loom offer. We just wrapped a similar UX sprint with a fast-growing {{industry|SaaS}} brand that drove a 22% bump in conversions within 14 days.\n\nStill open to checking out the screen recording?`
      },
      {
        stepNumber: 3,
        delayDays: 5,
        subject: 'Moving on from {{company}} for now',
        body: `{{firstName}},\n\nI know {{jobTitle}}s have zero extra bandwidth for unsolicited messages, so I'll pause following up.\n\nIf you ever need an elite external product design team on standby, feel free to keep us in mind.\n\nBest of luck with {{company}}!`
      }
    ]
  },
  {
    id: 'partnership_collab',
    title: 'Strategic Co-Marketing / Partnership (3 Steps)',
    category: 'partnerships',
    description: 'Colleague-to-colleague tone for co-webinars, integration partnerships, or cross-promotions.',
    steps: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: 'Partnership between {{company}} and our team?',
        body: `Hi {{firstName}},\n\nI follow {{company}}'s updates in the {{industry|market}} space and see huge overlap with our audience of verified founders.\n\nWe're hosting a quarterly live masterclass next month and would love to feature {{company}} as a co-host or case study.\n\nWould you or someone on your growth team be interested in discussing this?`
      },
      {
        stepNumber: 2,
        delayDays: 4,
        subject: 'Re: Partnership between {{company}} and our team?',
        body: `Hey {{firstName}},\n\nFollowing up on the co-marketing invite for {{company}}.\n\nWe expect 600+ registered attendees from mid-market teams. We handle all production and promotion—your team just provides the domain expertise.\n\nWorth a brief 10-min chat on Friday?`
      },
      {
        stepNumber: 3,
        delayDays: 4,
        subject: 'Final check: {{company}} partnership slot',
        body: `Hi {{firstName}},\n\nWe're finalizing our speaker roster by end of week.\n\nIf this isn't the right fit or timing for {{company}}, totally understand! If someone else on your team handles brand partnerships, could you point me in their direction?\n\nThanks, {{firstName}}!`
      }
    ]
  },
  {
    id: 'career_internship',
    title: 'Job / Internship & Research Outreach (3 Steps)',
    category: 'recruiting',
    description: 'Targeted cold email for job seekers, interns, or researchers reaching out to hiring managers and lab leads.',
    steps: [
      {
        stepNumber: 1,
        delayDays: 0,
        subject: '{Role inquiry / interest in {{company}}|Excited about {{company}}\'s team}',
        body: `Dear {{firstName}},\n\n{{customIcebreaker|I have been closely following {{company}}'s impressive work in the space.}}\n\nI am writing to express my strong interest in opportunities on your team at {{company}} as a {{jobTitle|Software Engineer / Researcher}}.\n\nI have attached my Resume (PDF) detailing my technical projects, work experience, and coursework. If relevant, my academic transcript is also attached for your review.\n\nWould you have 10 minutes for a brief introductory conversation or advice on opportunities at {{company}}?`
      },
      {
        stepNumber: 2,
        delayDays: 4,
        subject: 'Re: {Role inquiry / interest in {{company}}|Excited about {{company}}\'s team}',
        body: `Hi {{firstName}},\n\nI wanted to gently follow up on my previous note regarding potential openings at {{company}}.\n\nI remain very enthusiastic about your team's mission. Please let me know if you would like any additional details or code samples beyond the attached resume.\n\nThank you for your time and consideration!`
      },
      {
        stepNumber: 3,
        delayDays: 5,
        subject: 'Re: Inquiry regarding {{company}} team',
        body: `Dear {{firstName}},\n\nI realize you are very busy with high priorities, so I will not crowd your inbox further.\n\nIf any relevant roles or project collaborations open up at {{company}} in the future, please feel free to keep my attached resume on file.\n\nWishing you and the team continued success!`
      }
    ]
  }
];
