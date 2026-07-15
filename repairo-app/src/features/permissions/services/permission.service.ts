import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

export interface Permission {
  id: number;
  module_name: string;
  permission_name: string;
  slug: string;
  description: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

const API_URL = `${ENV.API_URL}/permissions`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const permissionService = {
  async getAll(status?: string): Promise<{ success: boolean; data: Permission[]; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const params = status ? `?status=${status}` : '';
      const res = await fetch(`${API_URL}${params}`, { headers });
      return await res.json();
    } catch {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },

  async getById(id: number): Promise<{ success: boolean; data?: Permission; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/${id}`, { headers });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async create(data: {
    module_name: string;
    permission_name: string;
    slug: string;
    description?: string;
  }): Promise<{ success: boolean; data?: Permission; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          module_name: data.module_name,
          items: [{
            permission_name: data.permission_name,
            slug: data.slug,
            description: data.description || '',
            status: 'active',
          }],
        }),
      });
      const result = await res.json();
      if (result.success && result.data?.length > 0) {
        return { success: true, data: result.data[0] };
      }
      return result;
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async update(id: number, data: {
    module_name: string;
    permission_name: string;
    slug: string;
    description?: string;
    status?: string;
  }): Promise<{ success: boolean; data?: Permission; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          module_name: data.module_name,
          permission_name: data.permission_name,
          slug: data.slug,
          description: data.description || '',
          status: data.status || 'active',
        }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async delete(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers,
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },
};
