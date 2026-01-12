import { Lead, LeadStatus, ConversationNote } from '@/types/lead';

const STORAGE_KEY = 'personal_leads';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const isOverdue = (dateStr: string): boolean => {
  const today = new Date(getToday());
  const date = new Date(dateStr);
  return date < today;
};

export const isToday = (dateStr: string): boolean => {
  return dateStr === getToday();
};

export const isUpcoming = (dateStr: string): boolean => {
  const today = new Date(getToday());
  const date = new Date(dateStr);
  return date > today;
};

export const isActiveStatus = (status: LeadStatus): boolean => {
  return !['Closed', 'Dropped'].includes(status);
};

export const isLockedStatus = (status: LeadStatus): boolean => {
  return ['Closed', 'Dropped'].includes(status);
};

// Mock initial data
const mockLeads: Lead[] = [
  {
    id: generateId(),
    name: 'Sarah Chen',
    source: 'LinkedIn',
    primaryContact: 'sarah.chen@techcorp.com',
    linkedInUrl: 'linkedin.com/in/sarahchen',
    status: 'Interested',
    nextAction: 'Schedule demo call',
    nextActionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'High',
    tags: ['enterprise', 'tech'],
    notes: [
      { id: generateId(), content: 'Connected on LinkedIn, showed interest in our platform', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastContactedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: 'Michael Torres',
    source: 'Referral',
    primaryContact: '+1 555-0123',
    linkedInUrl: 'linkedin.com/in/michaeltorres',
    status: 'Follow-up',
    nextAction: 'Send proposal document',
    nextActionDate: getToday(),
    priority: 'High',
    tags: ['startup', 'saas'],
    notes: [
      { id: generateId(), content: 'Referred by John D. - needs CRM solution', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: 'Emily Watson',
    source: 'LinkedIn',
    primaryContact: 'emily.w@innovate.io',
    linkedInUrl: 'linkedin.com/in/emilywatson',
    status: 'Contacted',
    nextAction: 'Wait for response',
    nextActionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Medium',
    tags: ['fintech'],
    notes: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastContactedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: 'David Park',
    source: 'Website',
    primaryContact: 'david@parkventures.com',
    linkedInUrl: 'linkedin.com/in/davidpark',
    status: 'New',
    nextAction: 'Initial outreach',
    nextActionDate: getToday(),
    priority: 'Low',
    tags: ['investor'],
    notes: [],
    createdAt: new Date().toISOString(),
    lastContactedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: 'Lisa Johnson',
    source: 'WhatsApp',
    primaryContact: '+1 555-9876',
    linkedInUrl: 'linkedin.com/in/lisajohnson',
    status: 'Closed',
    nextAction: 'Deal closed',
    nextActionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'High',
    tags: ['enterprise', 'closed-won'],
    valueEstimate: '$50,000',
    notes: [
      { id: generateId(), content: 'Contract signed!', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastContactedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const getLeads = (): Lead[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockLeads));
    return mockLeads;
  }
  return JSON.parse(stored);
};

export const saveLead = (lead: Lead): void => {
  const leads = getLeads();
  const existingIndex = leads.findIndex(l => l.id === lead.id);
  if (existingIndex >= 0) {
    leads[existingIndex] = lead;
  } else {
    leads.push(lead);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
};

export const getLeadById = (id: string): Lead | undefined => {
  return getLeads().find(l => l.id === id);
};

export const addNote = (leadId: string, content: string): ConversationNote | null => {
  const leads = getLeads();
  const lead = leads.find(l => l.id === leadId);
  if (!lead) return null;
  
  const note: ConversationNote = {
    id: generateId(),
    content,
    createdAt: new Date().toISOString(),
  };
  lead.notes.push(note);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  return note;
};
