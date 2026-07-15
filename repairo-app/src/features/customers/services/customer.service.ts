import ENV from '@/config/env';
import { getStoredToken } from '@/services/api';
import type { Vehicle } from '@/features/vehicles/services/vehicle.service';

export interface Customer {
  id: number;
  shop_id: number;
  name: string;
  phone: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  shop_name?: string;
  vehicle_count?: number;
  vehicles?: Vehicle[];
}

const API_URL = `${ENV.API_URL}/customers`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export const customerService = {
  async getAll(status?: string): Promise<{ success: boolean; data: Customer[]; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const params = status ? `?status=${status}` : '';
      const res = await fetch(`${API_URL}${params}`, { headers });
      return await res.json();
    } catch {
      return { success: false, data: [], error: 'Connection failed' };
    }
  },

  async getById(id: number): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/${id}`, { headers });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async create(data: { name: string; phone: string }): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch {
      return { success: false, error: 'Connection failed' };
    }
  },

  async update(id: number, data: { name: string; phone: string }): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
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
