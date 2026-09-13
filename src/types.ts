export type SequenceStepType = 'initial' | 'followup_1' | 'followup_2' | 'followup_3' | 'breakup';

export interface SequenceStep {
  id: string;
  stepNumber: number;
  type: SequenceStepType;
  delayDays: number; // Days to wait after previous step if no reply
  subject: string;
  body: string;
  condition: 'if_no_reply' | 'always';
  isActive: boolean;
}

export type LeadStatus =
  | 'pending'
  | 'in_sequence'
  | 'step_1_sent'
  | 'step_2_sent'
  | 'step_3_sent'
  | 'completed'
  | 'replied'
  | 'bounced'
  | 'unsubscribed';

export interface Lead {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  industry?: string;
  city?: string;
  customIcebreaker?: string;
  painPoint?: string;
  status: LeadStatus;
  currentStep: number;
  lastContactedAt?: string;
  nextScheduledAt?: string;
  replyText?: string;
  notes?: string;
}

export interface EmailLogEntry {
  id: string;
  leadId: string;
  leadEmail: string;
  leadName: string;
  leadCompany: string;
  stepNumber: number;
  stepType: SequenceStepType;
  subject: string;
  bodyPreview: string;
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed';
  timestamp: string;
  isSimulated: boolean;
  errorMessage?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isConfigured: boolean;
}

export interface CampaignSchedule {
  dailyLimit: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  timezone: string;
  activeHoursStart: string; // e.g. "09:00"
  activeHoursEnd: string; // e.g. "17:00"
  sendOnWeekends: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  steps: SequenceStep[];
  schedule: CampaignSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignTemplate {
  id: string;
  title: string;
  category: 'b2b_saas' | 'agency_services' | 'partnerships' | 'recruiting' | 'followups';
  description: string;
  steps: {
    stepNumber: number;
    delayDays: number;
    subject: string;
    body: string;
  }[];
}

export interface SpamAnalysisResult {
  score: number; // 0-100 (100 is best / lowest spam risk)
  rating: 'excellent' | 'good' | 'moderate' | 'high_risk';
  flags: {
    word: string;
    reason: string;
    type: 'spam_word' | 'formatting' | 'length' | 'links';
  }[];
  wordCount: number;
  readingTimeSeconds: number;
  personalizedVariablesCount: number;
  suggestions: string[];
}
