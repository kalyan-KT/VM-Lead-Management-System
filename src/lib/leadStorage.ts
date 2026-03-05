import { Lead, LeadStatus, ConversationNote, Folder } from '@/types/lead';

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
  // User requested to allow editing closed leads, so we unlock them.
  // return ['Closed', 'Dropped'].includes(status);
  return false;
};

// Helper for headers
const getHeaders = (token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const getLeads = async (token?: string): Promise<Lead[]> => {
  try {
    const response = await fetch(API_URL, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch leads');
    return await response.json();
  } catch (error) {
    console.error('Error fetching leads:', error);
    return [];
  }
};

export const getWebsiteLeads = async (token?: string): Promise<Lead[]> => {
  try {
    const response = await fetch(`${API_URL}/website`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch website leads');
    return await response.json();
  } catch (error) {
    console.error('Error fetching website leads:', error);
    return [];
  }
};

export const getStacliLeads = async (token?: string): Promise<Lead[]> => {
  try {
    const response = await fetch(`${API_URL}/stacli`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch stacli leads');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stacli leads:', error);
    return [];
  }
};

export const getVmOnboardingLeads = async (token?: string): Promise<Lead[]> => {
  try {
    const response = await fetch(`${API_URL}/vm-onboarding`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch vm onboarding leads');
    return await response.json();
  } catch (error) {
    console.error('Error fetching vm onboarding leads:', error);
    return [];
  }
};

export const getStacliOnboardingLeads = async (token?: string): Promise<Lead[]> => {
  try {
    const response = await fetch(`${API_URL}/stacli-onboarding`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch stacli onboarding leads');
    return await response.json();
  } catch (error) {
    console.error('Error fetching stacli onboarding leads:', error);
    return [];
  }
};

// Folders API
export const getFolders = async (token?: string): Promise<Folder[]> => {
  try {
    const response = await fetch('/api/folders', {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch folders');
    return await response.json();
  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
};

export const createFolder = async (name: string, token?: string): Promise<Folder | null> => {
  try {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to create folder');
    return await response.json();
  } catch (error) {
    console.error('Error creating folder:', error);
    return null;
  }
};

export const updateFolder = async (id: string, name: string, token?: string): Promise<Folder | null> => {
  try {
    const response = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to update folder');
    return await response.json();
  } catch (error) {
    console.error('Error updating folder:', error);
    return null;
  }
};

export const deleteFolder = async (id: string, token?: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/folders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting folder:', error);
    return false;
  }
};

export const saveLead = async (lead: Lead, token?: string): Promise<Lead> => {
  try {
    // Determine if create or update based on ID format (simple heuristic)
    // Backend IDs are Mongo ObjectIds (24 hex chars). Frontend gen IDs are shorter/alphanumeric.
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(lead.id);

    if (isMongoId) {
      // Update
      const response = await fetch(`${API_URL}/${lead.id}`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify(lead),
      });
      if (!response.ok) {
        const errorText = await response.text();
        try {
          const json = JSON.parse(errorText);
          throw new Error(json.message || 'Failed to update lead');
        } catch (e) {
          throw new Error(`Failed to update lead: ${errorText}`);
        }
      }
      return await response.json();
    } else {
      // Create - drop the temp ID
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...leadData } = lead;
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getHeaders(token),
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

export const getLeadById = async (id: string, token?: string): Promise<Lead | undefined> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getHeaders(token),
    });
    if (!response.ok) return undefined;
    return await response.json();
  } catch (error) {
    console.error('Error getting lead:', error);
    return undefined;
  }
};

export const addNote = async (leadId: string, content: string, token?: string): Promise<ConversationNote | null> => {
  try {
    const response = await fetch(`${API_URL}/${leadId}/notes`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ content }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error adding note:', error);
    return null;
  }
};

export const deleteLead = async (id: string, token?: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to delete lead');
    return true;
  } catch (error) {
    console.error('Error deleting lead:', error);
    return false;
  }
};

export interface AdminLeadStat {
  userId: string;
  email: string;
  role?: string;
  totalLeads: number;
  leadsToday?: number;
  lastCreatedAt: string;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalLeads: number;
  leadsToday: number;
  activeUsers: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  totalLeads: number;
  status: string;
  createdAt: string;
}

export const getAdminLeadStats = async (token: string): Promise<AdminLeadStat[]> => {
  try {
    const response = await fetch(`${API_URL}/admin/lead-stats`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch admin stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return [];
  }
};

export const getAdminDashboardStats = async (token: string): Promise<AdminDashboardStats | null> => {
  try {
    const response = await fetch('/api/admin/stats', {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
};

export const getAdminUsers = async (token: string): Promise<AdminUser[]> => {
  try {
    const response = await fetch('/api/admin/users', {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const createAdminUser = async (user: any, token: string): Promise<any> => {
  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(user),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create user');
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getAdminUserDetails = async (userId: string, token: string): Promise<any> => {
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      headers: getHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to fetch user details');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

export const updateAdminUser = async (userId: string, data: any, token: string): Promise<any> => {
  try {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to update user');
    return result;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const resetAdminUserPassword = async (userId: string, password: string, token: string): Promise<any> => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Failed to reset password');
    return result;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const toggleAdminUserStatus = async (userId: string, action: 'enable' | 'disable', token: string): Promise<any> => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/${action}`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || `Failed to ${action} user`);
    return result;
  } catch (error) {
    console.error(`Error ${action} user:`, error);
    throw error;
  }
};

export const cloneLead = async (leadId: string, token: string): Promise<Lead> => {
  try {
    const response = await fetch(`${API_URL}/${leadId}/clone`, {
      method: 'POST',
      headers: getHeaders(token),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const json = JSON.parse(errorText);
        throw new Error(json.message || 'Failed to clone lead');
      } catch (e) {
        throw new Error(`Failed to clone lead: ${errorText}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error cloning lead:', error);
    throw error;
  }
};
