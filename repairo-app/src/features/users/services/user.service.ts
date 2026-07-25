import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  role_name?: string;
  profile_image?: string | null;
  status: string;
  shop_id?: number;
  shop_name?: string;
  shop_location?: string;
  shop_owner_name?: string;
  additional_permissions?: string[];
  excluded_permissions?: string[];
  created_at?: string;
  past_repairs?: unknown[];
}

export interface RoleOption {
  id: number;
  name: string;
  slug: string;
}

const API_URL = `${ENV.API_URL}/users`;
const ROLES_API_URL = `${ENV.API_URL}/roles`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const userService = {
  async getAll(status?: string): Promise<{ success: boolean; data: User[]; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const qs = params.toString();
      const res = await fetch(`${API_URL}${qs ? `?${qs}` : ''}`, { headers });
      return await res.json();
    } catch {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },

  async getById(id: number): Promise<{ success: boolean; data?: User; error?: string }> {
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
    phone: string;
    email?: string;
    password: string;
    role: string;
    status?: string;
    additional_permissions?: string[];
    excluded_permissions?: string[];
  }): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          password: data.password,
          role: data.role,
          status: data.status || 'active',
          additional_permissions: data.additional_permissions || [],
          excluded_permissions: data.excluded_permissions || [],
        }),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async update(id: number, data: {
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: string;
    profile_image?: string;
    additional_permissions?: string[];
    excluded_permissions?: string[];
  }): Promise<{ success: boolean; data?: User; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const body: Record<string, unknown> = {};
      if (data.name !== undefined) body.name = data.name;
      if (data.phone !== undefined) body.phone = data.phone;
      if (data.email !== undefined) body.email = data.email;
      if (data.password !== undefined && data.password.length > 0) body.password = data.password;
      if (data.role !== undefined) body.role = data.role;
      if (data.status !== undefined) body.status = data.status;
      if (data.profile_image !== undefined) body.profile_image = data.profile_image;
      if (data.additional_permissions !== undefined) body.additional_permissions = data.additional_permissions;
      if (data.excluded_permissions !== undefined) body.excluded_permissions = data.excluded_permissions;
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
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

  async updateProfile(id: number, formData: FormData): Promise<{ success: boolean; data?: User; error?: string }> {
    return new Promise((resolve) => {
      getAuthHeaders().then((headers) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `${API_URL}/${id}`);
        if (headers.Authorization) xhr.setRequestHeader('Authorization', headers.Authorization);
        xhr.onload = () => {
          try {
            const parsed = JSON.parse(xhr.responseText);
            resolve(parsed);
          } catch {
            resolve({ success: false, error: xhr.responseText || `Server error (${xhr.status})` });
          }
        };
        xhr.onerror = () => resolve({ success: false, error: 'Connection failed' });
        xhr.send(formData);
      });
    });
  },

  async checkPhone(phone: string, excludeId?: number): Promise<{ success: boolean; exists: boolean; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      let url = `${API_URL}/check-phone/${encodeURIComponent(phone)}`;
      if (excludeId) url += `?excludeId=${excludeId}`;
      const res = await fetch(url, { headers });
      return await res.json();
    } catch {
      return { success: false, exists: false, error: 'Connection failed' };
    }
  },

  async getRoleOptions(): Promise<{ success: boolean; data: RoleOption[]; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${ROLES_API_URL}/options`, { headers });
      return await res.json();
    } catch {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },
};
