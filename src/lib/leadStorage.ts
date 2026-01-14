import { Lead, LeadStatus, ConversationNote } from '@/types/lead';

const API_URL = '/api/leads';

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
  // Check if status is defined
  if (!status) return false;
  return ['Closed', 'Dropped'].includes(status);
};

export const getLeads = async (): Promise<Lead[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch leads');
    return await response.json();
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
};

export const saveLead = async (lead: Lead): Promise<Lead> => {
  try {
    // Determine if create or update based on ID format (simple heuristic)
    // Backend IDs are Mongo ObjectIds (24 hex chars). Frontend gen IDs are shorter/alphanumeric.
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(lead.id);

    if (isMongoId) {
      // Update
      const response = await fetch(`${API_URL}/${lead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      });
      if (!response.ok) throw new Error('Failed to update lead');
      return await response.json();
    } else {
      // Create - drop the temp ID
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...leadData } = lead;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create lead: ${errorText}`);
      }
      return await response.json();
    }
  } catch (error) {
    console.error('Error saving lead:', error);
    throw error;
  }
};

export const getLeadById = async (id: string): Promise<Lead | undefined> => {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) return undefined;
    return await response.json();
  } catch (error) {
    console.error('Error getting lead:', error);
    return undefined;
  }
};

export const addNote = async (leadId: string, content: string): Promise<ConversationNote | null> => {
  try {
    const response = await fetch(`${API_URL}/${leadId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error adding note:', error);
    return null;
  }
};

export const deleteLead = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete lead');
    return true;
  } catch (error) {
    console.error('Error deleting lead:', error);
    return false;
  }
};
