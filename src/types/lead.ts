export type LeadStatus = 'New' | 'Contacted' | 'Interested' | 'Follow-up' | 'Closed' | 'Dropped';
export type LeadSource = 'LinkedIn' | 'WhatsApp' | 'Referral' | 'Website' | 'Other';
export type LeadPriority = 'High' | 'Medium' | 'Low';

export interface ConversationNote {
  id: string;
  content: string;
  createdAt: string;
}


export interface Document {
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt?: string;
}

export interface FollowUp {
  date: string;
  note: string;
}

export interface MeetingNote {
  title: string;
  note: string;
  createdAt?: string;
}

export interface Lead {
  id: string;
  createdBy: string;
  creatorEmail?: string;
  name: string;
  source: LeadSource;
  primaryContact: string;
  linkedInUrl?: string; // Optional
  status: LeadStatus;
  nextAction: string;
  nextActionDate: string;
  contextNote?: string;
  priority: LeadPriority;
  tags: string[];
  valueEstimate?: string;
  notes: ConversationNote[];
  relevantLinks: string[];
  documents: Document[];
  followUps: FollowUp[];
  meetingNotes: MeetingNote[];
  createdAt: string;
  lastContactedAt: string;
  // Admin Review
  adminReview?: 'Sent Message' | 'Sent Note' | 'Hiring Post' | 'Rejected' | 'Other';
  adminReviewNote?: string;
  // Website Lead Specific & New Core Fields
  companyName?: string;
  designation?: string;
  outreachChannel?: string[];
  email?: string;
  contactNumber?: string;
  company?: string;
  service?: string;
  budget?: string;
  division?: string;
  phone?: string;
}

export type ViewFilter = 'all' | 'today' | 'overdue' | 'active' | 'closed' | 'table' | 'users' | 'user_leads' | 'website_leads' | 'stacli_leads' | 'vm_onboarding' | 'stacli_onboarding';
