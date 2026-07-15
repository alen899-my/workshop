import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';
import type { Permission } from '@/features/permissions/services/permission.service';

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: string;
  permissions?: string[];
  permission_count?: number;
  created_at?: string;
  updated_at?: string;
}

const API_URL = `${ENV.API_URL}/roles`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const roleService = {
  async getAll(): Promise<{ success: boolean; data: Role[]; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(API_URL, { headers });
      return await res.json();
    } catch {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },

  async getById(id: number): Promise<{ success: boolean; data?: Role; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/${id}`, { headers });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    permissions?: string[];
  }): Promise<{ success: boolean; data?: Role; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          status: 'active',
          permissions: data.permissions || [],
        }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async update(id: number, data: {
    name: string;
    slug: string;
    description?: string;
    status?: string;
    permissions?: string[];
  }): Promise<{ success: boolean; data?: Role; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          status: data.status || 'active',
          permissions: data.permissions || [],
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

export type { Permission };
