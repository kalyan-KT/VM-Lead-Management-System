export type LeadStatus = 'New' | 'Contacted' | 'Interested' | 'Follow-up' | 'Closed' | 'Dropped';
export type LeadSource = 'LinkedIn' | 'WhatsApp' | 'Referral' | 'Website' | 'Other';
export type LeadPriority = 'High' | 'Medium' | 'Low';

export interface ConversationNote {
  id: string;
  content: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  source: LeadSource;
  primaryContact: string;
  linkedInUrl: string;
  status: LeadStatus;
  nextAction: string;
  nextActionDate: string;
  contextNote?: string;
  priority: LeadPriority;
  tags: string[];
  valueEstimate?: string;
  notes: ConversationNote[];
  createdAt: string;
  lastContactedAt: string;
}

export type ViewFilter = 'all' | 'today' | 'overdue' | 'active' | 'closed';
